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
  sourceUrl?: string;
  cropTransform?: CropTransform;
  outputWidth?: number;
  outputHeight?: number;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
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
    const previewBackgroundColor = pickPreviewBackgroundColor(element);
    return await toCanvas(captureElement, {
      cacheBust: true,
      pixelRatio: scale,
      backgroundColor: previewBackgroundColor,
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
) => {
  if (!frames.length) throw new Error('No gif frames.');
  const firstFrame = frames[0].canvas;
  return await new Promise<Blob>((resolve, reject) => {
    const gif = new GIF({
      workers: 2,
      quality: 10,
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

export const generateElementPreview = async (
  element: HTMLElement,
  options: GenerateElementPreviewOptions = {},
) => {
  const {
    isGif = false,
    scale = 1,
    fps = 12,
    durationMs = 1800,
    jpegQuality = 0.92,
    sourceUrl,
    outputWidth,
    outputHeight,
  } = options;
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

  if (!isGif) {
    const canvas = await captureElementPreviewCanvas(element, safeScale);
    if (!canvas) {
      throw new Error('Element is not visible.');
    }
    const normalizedCanvas =
      outputWidth && outputHeight
        ? normalizeCanvasSize(canvas, outputWidth, outputHeight)
        : canvas;
    return await canvasToBlob(normalizedCanvas, 'image/jpeg', jpegQuality);
  }

  if (sourceUrl && isGifSource(sourceUrl)) {
    const captureElement = getCaptureElement(element);
    const imageElements = Array.from(
      captureElement.querySelectorAll('img'),
    ) as HTMLImageElement[];
    const targetImages = imageElements.filter((img) => {
      const src = img.currentSrc || img.src || '';
      if (!src) return false;
      if (src === sourceUrl) return true;
      return isGifSource(src);
    });
    if (targetImages.length) {
      const originalSources = targetImages.map((img) => img.src);
      const decodedFrames = await decodeGifFrames(sourceUrl, 20);
      const capturedFrames: Array<{ canvas: HTMLCanvasElement; delay: number }> = [];
      const layoutSize = getElementLayoutSize(element);
      const width = Math.max(1, Math.round(outputWidth ?? layoutSize.width));
      const height = Math.max(1, Math.round(outputHeight ?? layoutSize.height));
      try {
        for (let index = 0; index < decodedFrames.length; index += 1) {
          const decodedFrame = decodedFrames[index];
          const frameDataUrl = decodedFrame.canvas.toDataURL('image/png');
          await Promise.all(
            targetImages.map(
              (img) =>
                new Promise<void>((resolve) => {
                  const onDone = () => {
                    img.removeEventListener('load', onDone);
                    img.removeEventListener('error', onDone);
                    resolve();
                  };
                  img.addEventListener('load', onDone);
                  img.addEventListener('error', onDone);
                  img.src = frameDataUrl;
                }),
            ),
          );
          await new Promise<void>((resolve) =>
            window.requestAnimationFrame(() => resolve()),
          );

          const frameCanvas = await captureElementPreviewCanvas(element, safeScale);
          if (!frameCanvas) continue;
          capturedFrames.push({
            canvas:
              frameCanvas.width === width && frameCanvas.height === height
                ? frameCanvas
                : normalizeCanvasSize(frameCanvas, width, height),
            delay: decodedFrame.delayMs,
          });
        }
      } finally {
        await Promise.all(
          targetImages.map(
            (img, index) =>
              new Promise<void>((resolve) => {
                const onDone = () => {
                  img.removeEventListener('load', onDone);
                  img.removeEventListener('error', onDone);
                  resolve();
                };
                img.addEventListener('load', onDone);
                img.addEventListener('error', onDone);
                img.src = originalSources[index];
              }),
          ),
        );
      }

      if (capturedFrames.length) {
        return await encodeGifFromCanvases(capturedFrames);
      }
    }
  }

  const delay = Math.max(1, Math.round(1000 / Math.max(1, fps)));
  const frameCount = Math.max(2, Math.round((durationMs / 1000) * Math.max(1, fps)));
  const frames: Array<{ canvas: HTMLCanvasElement; delay: number }> = [];
  const fallbackTargetWidth = outputWidth ? Math.max(1, Math.round(outputWidth)) : null;
  const fallbackTargetHeight = outputHeight ? Math.max(1, Math.round(outputHeight)) : null;
  for (let index = 0; index < frameCount; index += 1) {
    if (index > 0) {
      await wait(delay);
    } else {
      await wait(16);
    }
    const frameCanvas = await captureElementPreviewCanvas(element, safeScale);
    if (!frameCanvas) continue;
    const normalizedCanvas =
      fallbackTargetWidth && fallbackTargetHeight
        ? normalizeCanvasSize(frameCanvas, fallbackTargetWidth, fallbackTargetHeight)
        : frameCanvas;
    frames.push({ canvas: normalizedCanvas, delay });
  }
  if (!frames.length) {
    throw new Error('Element is not visible.');
  }
  return await encodeGifFromCanvases(frames);
};
