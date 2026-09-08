import GIF from 'gif.js';
import { decompressFrames, parseGIF } from 'gifuct-js';
import { toCanvas } from 'html-to-image';
import type { CropTransform } from './cropMediaByUrl';

export type GenerateElementPreviewOptions = {
  isGif?: boolean;
  scale?: number;
  fps?: number;
  durationMs?: number;
  jpegQuality?: number;
  /** 静态图输出格式，默认 jpeg；规则要求 png 的预览（含 previewTransParent）传 'png' */
  imageFormat?: 'jpeg' | 'png';
  /** 不铺底色，保留元素自身的透明区域；只对 png 有意义，jpeg 没有 alpha */
  transparentBackground?: boolean;
  /** gif.js 取样步长：数值越大体积越小、画质越差，常用 10~20 */
  gifQuality?: number;
  sourceUrl?: string;
  cropTransform?: CropTransform;
  outputWidth?: number;
  outputHeight?: number;
  /** 兜底分支的帧数，配合 onFrame 由调用方决定采样多少帧 */
  frameCount?: number;
  /** 由调用方驱动每帧画面；传入后不再靠等待真实动画自行推进，避免采样漂移漏帧 */
  onFrame?: (frameIndex: number) => void | Promise<void>;
  /**
   * 把采样点对齐到固定时间表，使整体覆盖的真实时间等于 durationMs。
   * 默认逻辑是「截完一帧再等固定间隔」，覆盖多长时间取决于截图快慢、不可控；
   * 需要保证动画完整走完一个周期时开启。
   */
  paceSampling?: boolean;
};

/** 预览 GIF 硬上限，避免多源采样把体积打爆 */
const GIF_MAX_FRAMES = 16;
/** 实测帧间隔的取值范围：下限贴合 GIF 格式精度，上限避免切到后台被节流时出现长时间卡帧 */
const GIF_MIN_FRAME_DELAY_MS = 20;
const GIF_MAX_FRAME_DELAY_MS = 2000;

const clampFrameDelay = (delayMs: number) =>
  Math.min(
    GIF_MAX_FRAME_DELAY_MS,
    Math.max(GIF_MIN_FRAME_DELAY_MS, Math.round(delayMs)),
  );

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

/** 等到 React 提交并完成一次绘制，保证截图读到的是刚指定的那一帧 */
const waitForNextPaint = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });

const getCaptureElement = (element: HTMLElement) => {
  const firstChild = element.firstElementChild;
  if (
    firstChild instanceof HTMLElement &&
    firstChild.offsetWidth > 0 &&
    firstChild.offsetHeight > 0
  ) {
    return firstChild;
  }
  return element;
};

export const isGifSource = (sourceUrl: string) => {
  if (!sourceUrl) return false;
  if (sourceUrl.startsWith('data:image/gif')) return true;
  return /\.gif(?:$|\?)/i.test(sourceUrl);
};

const pickPreviewBackgroundColor = (element: HTMLElement) => {
  const captureElement = getCaptureElement(element);
  const candidateElements: HTMLElement[] = [captureElement, element];
  for (let i = 0; i < candidateElements.length; i += 1) {
    const current = candidateElements[i];
    const backgroundColor = window.getComputedStyle(current).backgroundColor;
    const normalized = backgroundColor.replace(/\s+/g, '').toLowerCase();
    if (!normalized) continue;
    if (normalized === 'transparent') continue;
    if (normalized === 'rgba(0,0,0,0)') continue;
    return backgroundColor;
  }
  return '#ffffff';
};

const captureElementPreviewCanvas = async (
  element: HTMLElement,
  scale: number,
  transparentBackground = false,
) => {
  const captureElement = getCaptureElement(element);
  const firstChild = element.firstElementChild;
  const roundedElement = firstChild instanceof HTMLElement ? firstChild : null;
  const previousBorderRadius = roundedElement?.style.borderRadius ?? null;
  if (roundedElement) {
    roundedElement.style.borderRadius = '0px';
  }
  const rect = captureElement.getBoundingClientRect();
  try {
    if (rect.width <= 0 || rect.height <= 0) return null;
    const computedStyle = window.getComputedStyle(captureElement);
    const shouldResetTransform =
      Boolean(computedStyle.transform) && computedStyle.transform !== 'none';
    return await toCanvas(captureElement, {
      cacheBust: true,
      pixelRatio: scale,
      // 透明底预览不能铺底色，否则 alpha 通道会被填满
      backgroundColor: transparentBackground
        ? undefined
        : pickPreviewBackgroundColor(element),
      style: shouldResetTransform
        ? {
            transform: 'none',
            transformOrigin: 'top left',
          }
        : undefined,
    });
  } finally {
    if (roundedElement && previousBorderRadius != null) {
      roundedElement.style.borderRadius = previousBorderRadius;
    }
  }
};

const getElementLayoutSize = (element: HTMLElement) => {
  const captureElement = getCaptureElement(element);
  const readPositive = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const width =
    readPositive(captureElement.offsetWidth) ??
    readPositive(captureElement.clientWidth) ??
    readPositive(element.offsetWidth) ??
    Math.max(1, Math.round(captureElement.getBoundingClientRect().width));
  const height =
    readPositive(captureElement.offsetHeight) ??
    readPositive(captureElement.clientHeight) ??
    readPositive(element.offsetHeight) ??
    Math.max(1, Math.round(captureElement.getBoundingClientRect().height));
  return { width, height };
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas.'));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });

const normalizeCanvasSize = (
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
) => {
  const normalizedCanvas = document.createElement('canvas');
  normalizedCanvas.width = Math.max(1, Math.round(targetWidth));
  normalizedCanvas.height = Math.max(1, Math.round(targetHeight));
  const ctx = normalizedCanvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, normalizedCanvas.width, normalizedCanvas.height);
  }
  return normalizedCanvas;
};

const decodeGifFrames = async (sourceUrl: string, minDelayMs = 20) => {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch gif: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const gif = parseGIF(arrayBuffer);
  const decodedFrames = decompressFrames(gif, true) as any[];
  if (!decodedFrames.length) {
    throw new Error('No gif frames decoded.');
  }

  const screenWidth =
    Number((gif as any)?.lsd?.width) || Number(decodedFrames[0]?.dims?.width) || 1;
  const screenHeight =
    Number((gif as any)?.lsd?.height) ||
    Number(decodedFrames[0]?.dims?.height) ||
    1;

  const stageCanvas = document.createElement('canvas');
  stageCanvas.width = screenWidth;
  stageCanvas.height = screenHeight;
  const stageCtx = stageCanvas.getContext('2d');
  if (!stageCtx) {
    throw new Error('Cannot create gif stage context.');
  }

  const normalizeDelay = (delayValue: unknown, fallbackMs: number) => {
    const n = Number(delayValue);
    if (!Number.isFinite(n) || n <= 0) return fallbackMs;
    return n <= 20 ? n * 10 : n;
  };

  let lastDelayMs = minDelayMs;
  const frames: Array<{ canvas: HTMLCanvasElement; delayMs: number }> = [];
  decodedFrames.forEach((frame) => {
    const { dims, patch } = frame;
    if (!dims || !patch) return;

    const patchCanvas = document.createElement('canvas');
    patchCanvas.width = dims.width;
    patchCanvas.height = dims.height;
    const patchCtx = patchCanvas.getContext('2d');
    if (!patchCtx) return;
    const patchImageData = patchCtx.createImageData(dims.width, dims.height);
    patchImageData.data.set(patch);
    patchCtx.putImageData(patchImageData, 0, 0);

    const prevFrameImage =
      frame.disposalType === 3
        ? stageCtx.getImageData(0, 0, screenWidth, screenHeight)
        : null;
    stageCtx.drawImage(patchCanvas, dims.left, dims.top);

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = screenWidth;
    outputCanvas.height = screenHeight;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) return;
    outputCtx.drawImage(stageCanvas, 0, 0);

    if (frame.disposalType === 2) {
      stageCtx.clearRect(dims.left, dims.top, dims.width, dims.height);
    } else if (frame.disposalType === 3 && prevFrameImage) {
      stageCtx.putImageData(prevFrameImage, 0, 0);
    }

    const rawDelayMs = normalizeDelay(frame.delay, lastDelayMs);
    lastDelayMs = rawDelayMs;
    frames.push({
      canvas: outputCanvas,
      delayMs: Math.max(minDelayMs, Math.round(rawDelayMs)),
    });
  });

  if (!frames.length) {
    throw new Error('No usable gif frames decoded.');
  }
  return frames;
};

const encodeGifFromCanvases = async (
  frames: Array<{ canvas: HTMLCanvasElement; delay: number }>,
  gifQuality = 18,
) => {
  if (!frames.length) throw new Error('No gif frames.');
  const firstFrame = frames[0].canvas;
  // gif.js: quality 越小颜色越准、体积越大
  const quality = Math.min(30, Math.max(1, Math.round(gifQuality)));
  return await new Promise<Blob>((resolve, reject) => {
    const gif = new GIF({
      workers: 2,
      quality,
      width: firstFrame.width,
      height: firstFrame.height,
      workerScript: '/scripts/gif.worker.js',
    });
    frames.forEach((frame) => {
      gif.addFrame(frame.canvas, {
        delay: frame.delay,
        copy: true,
      });
    });
    gif.on('finished', (blob: Blob) => resolve(blob));
    gif.on('abort', () => reject(new Error('GIF render aborted')));
    gif.render();
  });
};

type DecodedGifFrame = { canvas: HTMLCanvasElement; delayMs: number };

const getImageSource = (img: HTMLImageElement) => img.currentSrc || img.src || '';

const getGifDurationMs = (frames: DecodedGifFrame[]) =>
  frames.reduce((sum, frame) => sum + Math.max(1, frame.delayMs), 0);

const pickFrameIndexAtTime = (frames: DecodedGifFrame[], timeMs: number) => {
  if (!frames.length) return 0;
  const duration = getGifDurationMs(frames);
  if (duration <= 0) return 0;
  let cursor = ((timeMs % duration) + duration) % duration;
  for (let index = 0; index < frames.length; index += 1) {
    cursor -= Math.max(1, frames[index].delayMs);
    if (cursor < 0) return index;
  }
  return frames.length - 1;
};

const waitImageSrc = (img: HTMLImageElement, nextSrc: string) =>
  new Promise<void>((resolve) => {
    const onDone = () => {
      img.removeEventListener('load', onDone);
      img.removeEventListener('error', onDone);
      resolve();
    };
    img.addEventListener('load', onDone);
    img.addEventListener('error', onDone);
    img.src = nextSrc;
  });

const applyImageSources = async (
  entries: Array<{ img: HTMLImageElement; source: string }>,
  dataUrlBySource: Map<string, string[]>,
  frameIndexBySource: Map<string, number>,
  appliedDataUrlByImage: Map<HTMLImageElement, string>,
) => {
  await Promise.all(
    entries.map(async ({ img, source }) => {
      const dataUrls = dataUrlBySource.get(source);
      if (!dataUrls?.length) return;
      const frameIndex = frameIndexBySource.get(source) ?? 0;
      const nextSrc = dataUrls[Math.min(frameIndex, dataUrls.length - 1)];
      if (appliedDataUrlByImage.get(img) === nextSrc) return;
      await waitImageSrc(img, nextSrc);
      appliedDataUrlByImage.set(img, nextSrc);
    }),
  );
};

/**
 * 输出尺寸普遍大于节点在画布上的 DOM 尺寸（如 small widget 155 -> 269），
 * 按 1 倍截图会被 normalizeCanvasSize 放大导致发虚。这里与静态图一致按 scale 超采样，
 * 并保证倍率不低于输出/布局的比值，避免任何放大。
 */
const getGifCaptureScale = (
  element: HTMLElement,
  safeScale: number,
  outputWidth?: number,
  outputHeight?: number,
) => {
  const layoutSize = getElementLayoutSize(element);
  const requiredScale = Math.max(
    (outputWidth ?? layoutSize.width) / layoutSize.width,
    (outputHeight ?? layoutSize.height) / layoutSize.height,
    1,
  );
  return Math.max(safeScale, requiredScale);
};

export const generateElementPreview = async (
  element: HTMLElement,
  options: GenerateElementPreviewOptions = {},
) => {
  const {
    isGif = false,
    scale = 1,
    fps = 8,
    durationMs = 1200,
    jpegQuality = 0.92,
    imageFormat = 'jpeg',
    transparentBackground = false,
    gifQuality = 18,
    sourceUrl,
    outputWidth,
    outputHeight,
    frameCount: externalFrameCount,
    onFrame,
    paceSampling = false,
  } = options;
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  // GIF 帧最后一定会归一到 output/layout 尺寸，提高截图倍率只改变采样精度、不改变输出像素数
  const captureScale = isGif
    ? getGifCaptureScale(element, safeScale, outputWidth, outputHeight)
    : safeScale;

  if (!isGif) {
    const canvas = await captureElementPreviewCanvas(
      element,
      captureScale,
      transparentBackground,
    );
    if (!canvas) {
      throw new Error('Element is not visible.');
    }
    const normalizedCanvas =
      outputWidth && outputHeight
        ? normalizeCanvasSize(canvas, outputWidth, outputHeight)
        : canvas;
    // png 不吃 quality 参数，传了也会被忽略，这里直接不传
    return imageFormat === 'png'
      ? await canvasToBlob(normalizedCanvas, 'image/png')
      : await canvasToBlob(normalizedCanvas, 'image/jpeg', jpegQuality);
  }

  const captureElement = getCaptureElement(element);
  const imageElements = Array.from(
    captureElement.querySelectorAll('img'),
  ) as HTMLImageElement[];
  const gifImageEntries = imageElements
    .map((img) => {
      const source = getImageSource(img);
      return { img, source };
    })
    .filter(({ source }) => {
      if (!source) return false;
      if (sourceUrl && source === sourceUrl) return isGifSource(sourceUrl);
      return isGifSource(source);
    });

  if (gifImageEntries.length) {
    const uniqueSources = Array.from(
      new Set(gifImageEntries.map((entry) => entry.source)),
    );
    const decodedBySource = new Map<string, DecodedGifFrame[]>();
    await Promise.all(
      uniqueSources.map(async (source) => {
        try {
          decodedBySource.set(source, await decodeGifFrames(source, 20));
        } catch {
          // Keep other sources usable when one gif fails to decode.
        }
      }),
    );

    const usableEntries = gifImageEntries.filter((entry) =>
      decodedBySource.has(entry.source),
    );
    const usableSources = Array.from(
      new Set(usableEntries.map((entry) => entry.source)),
    );

    if (usableEntries.length && usableSources.length) {
      const loopDurationMs = Math.max(
        ...usableSources.map((source) =>
          getGifDurationMs(decodedBySource.get(source) || []),
        ),
        1,
      );
      const safeFps = Math.max(1, fps);
      const maxDurationMs = Math.max(1, Math.round(durationMs));
      const timelineMs = Math.min(loopDurationMs, maxDurationMs);
      const sampleDelay = Math.max(40, Math.round(1000 / safeFps));
      const maxFrameCount = Math.min(
        GIF_MAX_FRAMES,
        Math.max(2, Math.round((maxDurationMs / 1000) * safeFps)),
      );
      const sampleCount = Math.min(
        maxFrameCount,
        Math.max(2, Math.ceil(timelineMs / sampleDelay)),
      );

      const dataUrlBySource = new Map<string, string[]>();
      usableSources.forEach((source) => {
        const frames = decodedBySource.get(source) || [];
        dataUrlBySource.set(
          source,
          frames.map((frame) => frame.canvas.toDataURL('image/png')),
        );
      });

      const originalSources = usableEntries.map((entry) => entry.img.src);
      const appliedDataUrlByImage = new Map<HTMLImageElement, string>();
      const capturedFrames: Array<{ canvas: HTMLCanvasElement; delay: number }> =
        [];
      const layoutSize = getElementLayoutSize(element);
      const width = Math.max(1, Math.round(outputWidth ?? layoutSize.width));
      const height = Math.max(1, Math.round(outputHeight ?? layoutSize.height));

      try {
        let lastIndexKey = '';
        for (let index = 0; index < sampleCount; index += 1) {
          const timeMs =
            sampleCount <= 1
              ? 0
              : Math.min(
                  timelineMs - 1,
                  Math.round((index * timelineMs) / sampleCount),
                );
          const frameIndexBySource = new Map<string, number>();
          const indexKey = usableSources
            .map((source) => {
              const frameIndex = pickFrameIndexAtTime(
                decodedBySource.get(source) || [],
                timeMs,
              );
              frameIndexBySource.set(source, frameIndex);
              return `${source}:${frameIndex}`;
            })
            .join('|');

          if (indexKey === lastIndexKey && capturedFrames.length) {
            capturedFrames[capturedFrames.length - 1].delay += sampleDelay;
            continue;
          }
          lastIndexKey = indexKey;

          await applyImageSources(
            usableEntries,
            dataUrlBySource,
            frameIndexBySource,
            appliedDataUrlByImage,
          );
          await new Promise<void>((resolve) =>
            window.requestAnimationFrame(() => resolve()),
          );

          const frameCanvas = await captureElementPreviewCanvas(
            element,
            captureScale,
          );
          if (!frameCanvas) continue;
          capturedFrames.push({
            canvas:
              frameCanvas.width === width && frameCanvas.height === height
                ? frameCanvas
                : normalizeCanvasSize(frameCanvas, width, height),
            delay: sampleDelay,
          });
        }
      } finally {
        await Promise.all(
          usableEntries.map((entry, index) =>
            waitImageSrc(entry.img, originalSources[index]),
          ),
        );
      }

      if (capturedFrames.length) {
        return await encodeGifFromCanvases(capturedFrames, gifQuality);
      }
    }
  }

  const delay = Math.max(40, Math.round(1000 / Math.max(1, fps)));
  const frameCount = Math.min(
    GIF_MAX_FRAMES,
    Math.max(
      2,
      Math.round(externalFrameCount ?? (durationMs / 1000) * Math.max(1, fps)),
    ),
  );
  const frames: Array<{ canvas: HTMLCanvasElement; delay: number }> = [];
  // 未指定输出尺寸时回落到布局尺寸，保证超采样只提升清晰度、不放大导出动图的像素数
  const fallbackLayoutSize = getElementLayoutSize(element);
  const fallbackTargetWidth = Math.max(
    1,
    Math.round(outputWidth ?? fallbackLayoutSize.width),
  );
  const fallbackTargetHeight = Math.max(
    1,
    Math.round(outputHeight ?? fallbackLayoutSize.height),
  );
  const paceIntervalMs =
    paceSampling && !onFrame && frameCount > 0 ? durationMs / frameCount : 0;
  const sampleStartedAt = performance.now();
  let previousSampledAt = 0;
  for (let index = 0; index < frameCount; index += 1) {
    if (onFrame) {
      await onFrame(index);
      await waitForNextPaint();
    } else if (paceIntervalMs) {
      // 采样点对齐到时间表，保证整体覆盖 durationMs 这段真实时间。
      // 截图慢于节拍时不再额外等待，此时覆盖时间只会更长、不会更短。
      const remainMs =
        sampleStartedAt + index * paceIntervalMs - performance.now();
      if (remainMs > 0) await wait(remainMs);
    } else if (index > 0) {
      await wait(delay);
    } else {
      await wait(16);
    }
    // 画面对应的是克隆 DOM 的这一刻，用它做时间基准
    const sampledAt = performance.now();
    const frameCanvas = await captureElementPreviewCanvas(element, captureScale);
    if (!frameCanvas) continue;
    // 单帧截图本身要几百毫秒，实际采样间隔远大于标称的 delay，用实测值才能保证播放速度一致。
    // 外部驱动帧时画面由调用方指定、与真实耗时无关，仍按标称间隔播放。
    if (!onFrame && frames.length && previousSampledAt) {
      frames[frames.length - 1].delay = clampFrameDelay(
        sampledAt - previousSampledAt,
      );
    }
    previousSampledAt = sampledAt;
    const normalizedCanvas =
      frameCanvas.width === fallbackTargetWidth &&
      frameCanvas.height === fallbackTargetHeight
        ? frameCanvas
        : normalizeCanvasSize(
            frameCanvas,
            fallbackTargetWidth,
            fallbackTargetHeight,
          );
    frames.push({ canvas: normalizedCanvas, delay });
  }
  if (!frames.length) {
    throw new Error('Element is not visible.');
  }
  // 末帧没有下一次采样可参照，沿用前一帧的实测间隔
  if (!onFrame && frames.length > 1) {
    frames[frames.length - 1].delay = frames[frames.length - 2].delay;
  }
  return await encodeGifFromCanvases(frames, gifQuality);
};
