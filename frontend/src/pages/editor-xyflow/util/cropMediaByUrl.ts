import GIF from 'gif.js';
import { decompressFrames, parseGIF } from 'gifuct-js';
import { getElementAbsoluteSize } from './getElementAbsoluteSize';

export type CropTransform = {
  translateX?: number;
  translateY?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
};

export type CropMediaByUrlOptions = {
  transform?: CropTransform;
  outputWidth?: number;
  outputHeight?: number;
  gifOutputWidth?: number;
  gifOutputHeight?: number;
  jpegOutputWidth?: number;
  jpegOutputHeight?: number;
  targetElement?: HTMLElement | null;
  outputScale?: number;
  renderScale?: number;
  resizeMode?: 'crop' | 'stretch';
  jpegQuality?: number;
  gifMinDelayMs?: number;
  gifBackgroundColor?: string | null;
  /** 为 true 时不产出 jpeg（gif 仍照常输出），jpegBlob 恒为 null */
  skipJpeg?: boolean;
};

export type CropMediaByUrlResult = {
  blob: Blob | null;
  mimeType: 'image/gif' | 'image/jpeg';
  isGif: boolean;
  width: number;
  height: number;
  gifBlob: Blob | null;
  jpegBlob: Blob | null;
};

const DEFAULT_TRANSFORM: Required<CropTransform> = {
  translateX: 0,
  translateY: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
};

const isGifSource = (sourceUrl: string) => {
  if (!sourceUrl) return false;
  if (sourceUrl.startsWith('data:image/gif')) return true;
  return /\.gif(?:$|\?)/i.test(sourceUrl);
};

const normalizeGifDelayMs = (delayValue: unknown, fallbackMs: number) => {
  const n = Number(delayValue);
  if (!Number.isFinite(n) || n <= 0) return fallbackMs;
  return n <= 20 ? n * 10 : n;
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

const renderFrameWithTransform = (params: {
  sourceCanvas: HTMLCanvasElement;
  width: number;
  height: number;
  transform: Required<CropTransform>;
  outputScale: number;
  renderScale: number;
  resizeMode: 'crop' | 'stretch';
  backgroundColor?: string | null;
}) => {
  const {
    sourceCanvas,
    width,
    height,
    transform,
    outputScale,
    renderScale,
    resizeMode,
    backgroundColor,
  } = params;
  const canvas = document.createElement('canvas');
  const combinedScale = outputScale * renderScale;
  canvas.width = Math.max(1, Math.round(width * combinedScale));
  canvas.height = Math.max(1, Math.round(height * combinedScale));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Cannot create canvas 2d context.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(combinedScale, combinedScale);
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  // 对齐页面端 CropEditableImage 的语义：
  // transformOrigin: top left
  // transform: translate(...) scale(...) rotate(...)
  // CSS 变换从右到左应用，对应这里调用顺序 translate -> scale -> rotate
  ctx.save();
  ctx.translate(transform.translateX, transform.translateY);
  ctx.scale(transform.scaleX, transform.scaleY);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.drawImage(
    sourceCanvas,
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
  );
  ctx.restore();
  return canvas;
};

const resizeCanvasTo = (
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
) => {
  if (sourceCanvas.width === width && sourceCanvas.height === height) {
    return sourceCanvas;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Cannot create resize canvas context.');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
  return canvas;
};

const encodeGifFromFrames = async (
  frames: Array<{ canvas: HTMLCanvasElement; delayMs: number }>,
) => {
  if (!frames.length) {
    throw new Error('No gif frames to encode.');
  }
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
        delay: frame.delayMs,
        copy: true,
      });
    });
    gif.on('finished', (blob: Blob) => resolve(blob));
    gif.on('abort', () => reject(new Error('GIF render aborted.')));
    gif.render();
  });
};

const decodeGifFrames = async (sourceUrl: string, minDelayMs: number) => {
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

  let lastDelayMs = minDelayMs;
  const usableFrames: Array<{ canvas: HTMLCanvasElement; delayMs: number }> = [];
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

    const rawDelayMs = normalizeGifDelayMs(frame.delay, lastDelayMs);
    lastDelayMs = rawDelayMs;
    usableFrames.push({
      canvas: outputCanvas,
      delayMs: Math.max(minDelayMs, Math.round(rawDelayMs)),
    });
  });

  if (!usableFrames.length) {
    throw new Error('No usable gif frames decoded.');
  }
  return {
    width: screenWidth,
    height: screenHeight,
    frames: usableFrames,
  };
};

const loadImageToCanvas = async (sourceUrl: string) => {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const blob = await response.blob();
  const loadByImageElement = async () => {
    const objectUrl = URL.createObjectURL(blob);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image.'));
        img.src = objectUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Cannot create image canvas context.');
      }
      ctx.drawImage(image, 0, 0);
      return canvas;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Cannot create image canvas context.');
      }
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      return canvas;
    } catch {
      // 某些格式/浏览器组合下 createImageBitmap 会抛 InvalidStateError，
      // 回退到 <img> 解码可显著提升兼容性。
      return await loadByImageElement();
    }
  }

  return await loadByImageElement();
};

const _legacyLoadImageToCanvasRemoved = true;
/* legacy kept for context; no-op marker */
/* const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.src = objectUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot create image canvas context.');
    }
    ctx.drawImage(image, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}; */

export const cropMediaByUrl = async (
  sourceUrl: string,
  options: CropMediaByUrlOptions = {},
): Promise<CropMediaByUrlResult> => {
  const isMissingSource = !sourceUrl || typeof sourceUrl !== 'string';
  const transform: Required<CropTransform> = {
    ...DEFAULT_TRANSFORM,
    ...(options.transform || {}),
  };
  const outputScale =
    Number.isFinite(options.outputScale) && (options.outputScale ?? 0) > 0
      ? (options.outputScale as number)
      : 1;
  const renderScale =
    Number.isFinite(options.renderScale) && (options.renderScale ?? 0) > 0
      ? (options.renderScale as number)
      : 1;
  const resizeMode = options.resizeMode ?? 'crop';
  const gifMinDelayMs = Math.max(1, Math.round(options.gifMinDelayMs ?? 20));
  const targetElement = options.targetElement;
  const captureElement =
    targetElement?.firstElementChild instanceof HTMLElement
      ? targetElement.firstElementChild
      : targetElement;
  const readPositive = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const targetElementLayoutSize = {
    width:
      readPositive(captureElement?.offsetWidth) ??
      readPositive(captureElement?.clientWidth) ??
      null,
    height:
      readPositive(captureElement?.offsetHeight) ??
      readPositive(captureElement?.clientHeight) ??
      null,
  };
  const targetElementSize = getElementAbsoluteSize(targetElement);
  const preferredOutputWidthBase =
    (Number.isFinite(options.outputWidth) && Number(options.outputWidth) > 0
      ? Number(options.outputWidth)
      : null) ??
    (Number.isFinite(options.jpegOutputWidth) && Number(options.jpegOutputWidth) > 0
      ? Number(options.jpegOutputWidth)
      : null) ??
    (Number.isFinite(options.gifOutputWidth) && Number(options.gifOutputWidth) > 0
      ? Number(options.gifOutputWidth)
      : null) ??
    targetElementLayoutSize.width ??
    (targetElementSize.width > 0 ? targetElementSize.width : null);
  const preferredOutputHeightBase =
    (Number.isFinite(options.outputHeight) && Number(options.outputHeight) > 0
      ? Number(options.outputHeight)
      : null) ??
    (Number.isFinite(options.jpegOutputHeight) && Number(options.jpegOutputHeight) > 0
      ? Number(options.jpegOutputHeight)
      : null) ??
    (Number.isFinite(options.gifOutputHeight) && Number(options.gifOutputHeight) > 0
      ? Number(options.gifOutputHeight)
      : null) ??
    targetElementLayoutSize.height ??
    (targetElementSize.height > 0 ? targetElementSize.height : null);
  const preferredGifOutputWidth =
    (Number.isFinite(options.gifOutputWidth) && Number(options.gifOutputWidth) > 0
      ? Number(options.gifOutputWidth)
      : null) ?? preferredOutputWidthBase;
  const preferredGifOutputHeight =
    (Number.isFinite(options.gifOutputHeight) && Number(options.gifOutputHeight) > 0
      ? Number(options.gifOutputHeight)
      : null) ?? preferredOutputHeightBase;
  const preferredJpegOutputWidth =
    (Number.isFinite(options.jpegOutputWidth) && Number(options.jpegOutputWidth) > 0
      ? Number(options.jpegOutputWidth)
      : null) ?? preferredOutputWidthBase;
  const preferredJpegOutputHeight =
    (Number.isFinite(options.jpegOutputHeight) && Number(options.jpegOutputHeight) > 0
      ? Number(options.jpegOutputHeight)
      : null) ?? preferredOutputHeightBase;
  const renderWidth = Math.max(
    1,
    Math.round(
      targetElementLayoutSize.width ??
        preferredOutputWidthBase ??
        (targetElementSize.width > 0 ? targetElementSize.width : null) ??
        1,
    ),
  );
  const renderHeight = Math.max(
    1,
    Math.round(
      targetElementLayoutSize.height ??
        preferredOutputHeightBase ??
        (targetElementSize.height > 0 ? targetElementSize.height : null) ??
        1,
    ),
  );

  if (isMissingSource) {
    return {
      blob: null,
      mimeType: 'image/jpeg',
      isGif: false,
      width: 0,
      height: 0,
      gifBlob: null,
      jpegBlob: null,
    };
  }

  if (isGifSource(sourceUrl)) {
    const decoded = await decodeGifFrames(sourceUrl, gifMinDelayMs);
    const gifWidth = Math.max(
      1,
      Math.round(preferredGifOutputWidth ?? decoded.width),
    );
    const gifHeight = Math.max(
      1,
      Math.round(preferredGifOutputHeight ?? decoded.height),
    );
    const jpegWidth = Math.max(
      1,
      Math.round(preferredJpegOutputWidth ?? decoded.width),
    );
    const jpegHeight = Math.max(
      1,
      Math.round(preferredJpegOutputHeight ?? decoded.height),
    );

    const transformedFrames = decoded.frames.map((frame) => ({
      canvas: resizeCanvasTo(
        renderFrameWithTransform({
          sourceCanvas: frame.canvas,
          width: renderWidth,
          height: renderHeight,
          transform,
          outputScale,
          renderScale,
          resizeMode,
          backgroundColor: options.gifBackgroundColor ?? null,
        }),
        Math.max(1, Math.round(gifWidth * outputScale)),
        Math.max(1, Math.round(gifHeight * outputScale)),
      ),
      delayMs: frame.delayMs,
    }));

    const gifBlob = await encodeGifFromFrames(transformedFrames);
    const firstFrameCanvas =
      transformedFrames[0]?.canvas ??
      resizeCanvasTo(
        renderFrameWithTransform({
          sourceCanvas: decoded.frames[0].canvas,
          width: renderWidth,
          height: renderHeight,
          transform,
          outputScale,
          renderScale,
          resizeMode,
          backgroundColor: options.gifBackgroundColor ?? null,
        }),
        Math.max(1, Math.round(gifWidth * outputScale)),
        Math.max(1, Math.round(gifHeight * outputScale)),
      );
    const jpegFrameCanvas = options.skipJpeg
      ? null
      : resizeCanvasTo(
          firstFrameCanvas,
          Math.max(1, Math.round(jpegWidth * outputScale)),
          Math.max(1, Math.round(jpegHeight * outputScale)),
        );
    const jpegBlob = jpegFrameCanvas
      ? await canvasToBlob(
          jpegFrameCanvas,
          'image/jpeg',
          options.jpegQuality ?? 0.92,
        )
      : null;
    return {
      blob: gifBlob,
      mimeType: 'image/gif',
      isGif: true,
      width: Math.max(1, Math.round(gifWidth * outputScale)),
      height: Math.max(1, Math.round(gifHeight * outputScale)),
      gifBlob,
      jpegBlob,
    };
  }

  // 非 gif 源只会产出 jpeg，跳过时无需下载和渲染
  if (options.skipJpeg) {
    return {
      blob: null,
      mimeType: 'image/jpeg',
      isGif: false,
      width: 0,
      height: 0,
      gifBlob: null,
      jpegBlob: null,
    };
  }

  const sourceCanvas = await loadImageToCanvas(sourceUrl);
  const jpegWidth = Math.max(
    1,
    Math.round(preferredJpegOutputWidth ?? sourceCanvas.width),
  );
  const jpegHeight = Math.max(
    1,
    Math.round(preferredJpegOutputHeight ?? sourceCanvas.height),
  );
  const outputCanvas = renderFrameWithTransform({
    sourceCanvas,
    width: renderWidth,
    height: renderHeight,
    transform,
    outputScale,
    renderScale,
    resizeMode,
    backgroundColor: '#ffffff',
  });
  const normalizedOutputCanvas = resizeCanvasTo(
    outputCanvas,
    Math.max(1, Math.round(jpegWidth * outputScale)),
    Math.max(1, Math.round(jpegHeight * outputScale)),
  );
  const blob = await canvasToBlob(
    normalizedOutputCanvas,
    'image/jpeg',
    options.jpegQuality ?? 0.92,
  );
  return {
    blob,
    mimeType: 'image/jpeg',
    isGif: false,
    width: normalizedOutputCanvas.width,
    height: normalizedOutputCanvas.height,
    gifBlob: null,
    jpegBlob: blob,
  };
};
