import type { Node as FlowNode } from '@xyflow/react';
import JSZip from 'jszip';
import { useCallback, useState } from 'react';
import { useEditorNodes } from '../context';
import { cropMediaByUrl } from '../util/cropMediaByUrl';
import { generateElementPreview } from '../util/generateElementPreview';
import {
  buildWatchFaceConfigJson,
  REQUIRED_FILES_BY_VARIANT,
  resolveWatchFaceExportVariant,
  WATCH_FACE_EXPORT_HEIGHT,
  WATCH_FACE_EXPORT_WIDTH,
  type WatchFaceExportVariant,
} from '../watchface/export-rules';
import {
  fetchSourceBlob,
  findRootGroupNode,
  type ExportBundleOptions,
  type ExportProgressLevel,
} from './exportBundleShared';

const EXPORT_JPEG_QUALITY = 1;
const PREVIEW_CAPTURE_SCALE = 1;

const WATCH_FACE_NODE_TYPES = new Set([
  'photo_watch_face_1_static',
  'photo_watch_face_1_dynamic',
  'photo_watch_face_2',
  'portraits_watch_face',
]);

export type WatchFaceExportFile = {
  filename: string;
  blob: Blob;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
};

const getNodeData = (node?: FlowNode | null) =>
  ((node?.data as Record<string, any> | undefined) ?? {}) as Record<string, any>;

const getNodeSelectorById = (id: string) => {
  if (!id) return '';
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return `.xyflow-stage .react-flow__node[data-id="${CSS.escape(id)}"]`;
  }
  return `.xyflow-stage .react-flow__node[data-id="${id}"]`;
};

const queryNodeElement = (id: string) => {
  if (typeof document === 'undefined') return null;
  const selector = getNodeSelectorById(id);
  if (!selector) return null;
  return document.querySelector(selector) as HTMLElement | null;
};

const normalizeCropProps = (cropProps: any) => ({
  translateX: Number(cropProps?.translateX ?? 0),
  translateY: Number(cropProps?.translateY ?? 0),
  rotation: Number(cropProps?.rotation ?? 0),
  scaleX: Number(cropProps?.scaleX ?? 1),
  scaleY: Number(cropProps?.scaleY ?? 1),
});

const waitForPaint = () =>
  new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, 100);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.clearTimeout(timer);
        resolve();
      });
    });
  });

const withForcedVisibility = async <T>(
  elements: (HTMLElement | null)[],
  run: () => Promise<T>,
): Promise<T> => {
  const restores = elements
    .filter((element): element is HTMLElement => Boolean(element))
    .map((element) => {
      const previous = element.style.visibility;
      element.style.setProperty('visibility', 'visible', 'important');
      return () => {
        element.style.visibility = previous;
      };
    });
  try {
    return await run();
  } finally {
    restores.forEach((restore) => {
      restore();
    });
  }
};

const findImageSizeMismatch = async (blob: Blob, width: number, height: number) => {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    const bitmap = await createImageBitmap(blob);
    const actualWidth = bitmap.width;
    const actualHeight = bitmap.height;
    bitmap.close();
    if (actualWidth === width && actualHeight === height) return null;
    return `${actualWidth}×${actualHeight}`;
  } catch {
    return null;
  }
};

const encodeBlobToFixedSize = async (
  blob: Blob,
  width: number,
  height: number,
  format: 'jpeg' | 'png',
): Promise<Blob | null> => {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (next) => resolve(next),
        mimeType,
        format === 'jpeg' ? EXPORT_JPEG_QUALITY : undefined,
      );
    });
  } catch {
    return null;
  }
};

const findWatchFaceContext = (nodes: FlowNode[], nodeId?: string) => {
  const rootNode = findRootGroupNode(nodes, nodeId);
  const rootData = getNodeData(rootNode);
  if (!rootNode || rootData.category !== 'watchface') return null;

  const platformNode = nodes.find(
    (node) =>
      node.type === 'platform_group' && node.parentId === rootNode.id,
  );
  const watchNode = nodes.find(
    (node) =>
      Boolean(node.parentId) &&
      node.parentId === platformNode?.id &&
      WATCH_FACE_NODE_TYPES.has(String(node.type ?? '')),
  );
  if (!watchNode) return null;

  const data = getNodeData(watchNode);
  const variant = resolveWatchFaceExportVariant(String(data.type ?? ''));
  if (!variant) return null;

  return {
    rootNode,
    watchNode,
    data,
    variant,
  };
};

const captureWatchFacePreview = async (
  watchNode: FlowNode,
  variant: WatchFaceExportVariant,
) => {
  const targetElement = queryNodeElement(String(watchNode.id));
  if (!targetElement) return null;

  const imageFormat = variant === 'portraits' ? 'png' : 'jpeg';
  const filename =
    variant === 'portraits' ? 'preview.png' : 'preview.jpg';

  await waitForPaint();
  const blob = await withForcedVisibility(
    [targetElement, targetElement.firstElementChild as HTMLElement | null],
    () =>
      generateElementPreview(targetElement, {
        scale: PREVIEW_CAPTURE_SCALE,
        jpegQuality: EXPORT_JPEG_QUALITY,
        imageFormat,
        outputWidth: WATCH_FACE_EXPORT_WIDTH,
        outputHeight: WATCH_FACE_EXPORT_HEIGHT,
      }),
  );

  return blob ? { filename, blob } : null;
};

const pushSizeWarning = (
  pushLine: (level: ExportProgressLevel, text: string) => void,
  filename: string,
  blob: Blob,
) => {
  void findImageSizeMismatch(
    blob,
    WATCH_FACE_EXPORT_WIDTH,
    WATCH_FACE_EXPORT_HEIGHT,
  ).then((mismatch) => {
    if (!mismatch) return;
    pushLine(
      'warning',
      `${filename} 尺寸是 ${mismatch}，规则要求 ${WATCH_FACE_EXPORT_WIDTH}×${WATCH_FACE_EXPORT_HEIGHT}`,
    );
  });
};

export const collectWatchFaceExportFiles = async (
  nodes: FlowNode[],
  nodeId?: string,
  options?: ExportBundleOptions,
): Promise<WatchFaceExportFile[] | null> => {
  const pushLine = (level: ExportProgressLevel, text: string) => {
    options?.onProgressLine?.({ level, text });
  };

  const context = findWatchFaceContext(nodes, nodeId);
  if (!context) {
    pushLine('warning', '当前选中节点不属于 watchface');
    options?.onWarning?.('当前选中节点不属于 watchface');
    return null;
  }

  const { watchNode, data, variant } = context;
  const requiredFiles = REQUIRED_FILES_BY_VARIANT[variant];
  pushLine('info', `开始收集 Watch Face 资源（${variant}）...`);

  const files: WatchFaceExportFile[] = [];
  const targetElement = queryNodeElement(String(watchNode.id));

  const config = buildWatchFaceConfigJson(data);
  files.push({
    filename: 'config.json',
    blob: new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    }),
  });
  pushLine('success', '生成 config.json');

  if (variant === 'photo_layout_1_static') {
    const source = String(data.source ?? '').trim();
    if (!source) {
      pushLine('warning', '跳过 watch.jpg（未上传 source）');
    } else {
      pushLine('info', '开始处理 watch.jpg...');
      const { jpegBlob } = await cropMediaByUrl(source, {
        transform: normalizeCropProps(data.crop_props),
        targetElement,
        jpegOutputWidth: WATCH_FACE_EXPORT_WIDTH,
        jpegOutputHeight: WATCH_FACE_EXPORT_HEIGHT,
        jpegQuality: EXPORT_JPEG_QUALITY,
        outputScale: 1,
        renderScale: 2,
        resizeMode: 'stretch',
      });
      if (jpegBlob) {
        files.push({ filename: 'watch.jpg', blob: jpegBlob });
        pushSizeWarning(pushLine, 'watch.jpg', jpegBlob);
        pushLine('success', '生成 watch.jpg');
      } else {
        pushLine('warning', '跳过 watch.jpg（裁剪失败）');
      }
    }
  }

  if (variant === 'photo_layout_1_dynamic') {
    const movSource = String(data.movsource ?? '').trim();
    if (!movSource) {
      pushLine('warning', '跳过 watch.mov（未上传 movsource）');
    } else {
      pushLine('info', '开始处理 watch.mov...');
      const blob = await fetchSourceBlob(movSource);
      if (blob) {
        files.push({ filename: 'watch.mov', blob });
        pushLine('success', '生成 watch.mov');
      } else {
        pushLine('warning', '跳过 watch.mov（下载失败）');
      }
    }

    const pagSource = String(data.pagsource ?? '').trim();
    if (!pagSource) {
      pushLine('warning', '跳过 preview.pag（未上传 pagsource）');
    } else {
      pushLine('info', '开始处理 preview.pag...');
      const blob = await fetchSourceBlob(pagSource);
      if (blob) {
        files.push({ filename: 'preview.pag', blob });
        pushLine('success', '生成 preview.pag');
      } else {
        pushLine('warning', '跳过 preview.pag（下载失败）');
      }
    }
  }

  if (variant === 'photo_layout_2') {
    const source = String(data.source ?? '').trim();
    if (!source) {
      pushLine('warning', '跳过 watch.jpg（未上传 source）');
    } else {
      pushLine('info', '开始处理 watch.jpg...');
      const rawBlob = await fetchSourceBlob(source);
      const jpegBlob = rawBlob
        ? await encodeBlobToFixedSize(
            rawBlob,
            WATCH_FACE_EXPORT_WIDTH,
            WATCH_FACE_EXPORT_HEIGHT,
            'jpeg',
          )
        : null;
      if (jpegBlob) {
        files.push({ filename: 'watch.jpg', blob: jpegBlob });
        pushSizeWarning(pushLine, 'watch.jpg', jpegBlob);
        pushLine('success', '生成 watch.jpg');
      } else {
        pushLine('warning', '跳过 watch.jpg（处理失败）');
      }
    }
  }

  if (variant === 'portraits') {
    const portraitAssets: { field: 'backgroundSource' | 'contentSource' | 'maskSource'; filename: string }[] = [
      { field: 'backgroundSource', filename: 'background.png' },
      { field: 'contentSource', filename: 'content.png' },
      { field: 'maskSource', filename: 'mask.png' },
    ];
    for (const asset of portraitAssets) {
      const nested = data[asset.field] as Record<string, any> | undefined;
      const source = String(nested?.source ?? '').trim();
      if (!source) {
        pushLine('warning', `跳过 ${asset.filename}（未上传 ${asset.field}.source）`);
        continue;
      }
      pushLine('info', `开始处理 ${asset.filename}...`);
      const rawBlob = await fetchSourceBlob(source);
      const pngBlob = rawBlob
        ? await encodeBlobToFixedSize(
            rawBlob,
            WATCH_FACE_EXPORT_WIDTH,
            WATCH_FACE_EXPORT_HEIGHT,
            'png',
          )
        : null;
      if (pngBlob) {
        files.push({ filename: asset.filename, blob: pngBlob });
        pushSizeWarning(pushLine, asset.filename, pngBlob);
        pushLine('success', `生成 ${asset.filename}`);
      } else {
        pushLine('warning', `跳过 ${asset.filename}（处理失败）`);
      }
    }
  }

  if (variant !== 'photo_layout_1_dynamic') {
    pushLine('info', '开始生成预览图（DOM 截图）...');
    try {
      const preview = await captureWatchFacePreview(watchNode, variant);
      if (preview) {
        files.push(preview);
        pushSizeWarning(pushLine, preview.filename, preview.blob);
        pushLine('success', `生成 ${preview.filename}`);
      } else {
        pushLine('warning', '预览图生成失败（节点不可见或未找到 DOM）');
      }
    } catch (error) {
      console.warn('[useWatchFaceExportBundle] preview capture failed:', error);
      pushLine('warning', '预览图生成失败');
    }
  }

  const missing = requiredFiles.filter(
    (filename) => !files.some((file) => file.filename === filename),
  );
  if (missing.length) {
    const text = `缺少规则要求的文件：${missing.join('、')}`;
    pushLine('warning', text);
    options?.onWarning?.(text);
    return null;
  }

  pushLine('success', `Watch Face 资源收集完成，共 ${files.length} 个文件`);
  return files;
};

export const useWatchFaceExportBundle = (nodeId?: string) => {
  const nodes = useEditorNodes();
  const [exporting, setExporting] = useState(false);

  const exportBundle = useCallback(
    async (options?: ExportBundleOptions) => {
      const pushLine = (level: ExportProgressLevel, text: string) => {
        options?.onProgressLine?.({ level, text });
      };

      if (exporting) return;

      setExporting(true);
      try {
        const files = await collectWatchFaceExportFiles(nodes, nodeId, options);
        if (!files?.length) return;

        pushLine('info', '正在打包 zip...');
        const zip = new JSZip();
        for (const file of files) {
          zip.file(file.filename, file.blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `watchface-export-${Date.now()}.zip`);
        pushLine('success', '导出完成');
        options?.onSuccess?.('Watch Face 压缩包已下载');
      } catch (error) {
        console.warn('[useWatchFaceExportBundle] export failed:', error);
        pushLine('error', '导出失败');
        options?.onError?.('导出失败');
      } finally {
        setExporting(false);
      }
    },
    [exporting, nodeId, nodes],
  );

  return {
    exporting,
    exportBundle,
  };
};
