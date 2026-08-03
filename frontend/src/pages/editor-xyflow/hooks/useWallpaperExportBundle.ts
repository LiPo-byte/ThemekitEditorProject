import { useCallback, useState } from 'react';
import JSZip from 'jszip';
import type { Node as FlowNode } from '@xyflow/react';
import { useEditorNodes } from '../context';
import { buildWallpaperConfigJson } from '../wallpaper/util';
import { cropMediaByUrl } from '../util/cropMediaByUrl';
import { generateElementPreview } from '../util/generateElementPreview';
import {
  findRootGroupNode,
  type ExportBundleOptions,
  type ExportProgressLevel,
} from './exportBundleShared';

const DEFAULT_WALLPAPER_WIDTH = 887;
const DEFAULT_WALLPAPER_HEIGHT = 1920;
const EXPORT_JPEG_QUALITY = 1;
const EXPORT_PREVIEW_SCALE = 3;

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

const sanitizeFileToken = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_\-]/g, '');

/** 读取导出后缀；未配置时默认 jpg */
const resolveExportExt = (value: unknown, fallback = 'jpg') => {
  const ext = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^\./, '');
  if (!ext || !/^[a-z0-9]+$/.test(ext)) return fallback;
  return ext === 'jpeg' ? 'jpg' : ext;
};

const mimeTypeByExt = (ext: string) => {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
};

/** 将裁剪结果按目标后缀重新编码（jpg 可直接复用） */
const encodeBlobByExt = async (
  blob: Blob,
  ext: string,
  quality = EXPORT_JPEG_QUALITY,
): Promise<Blob | null> => {
  const mimeType = mimeTypeByExt(ext);
  if (ext === 'jpg' || ext === 'jpeg') return blob;
  if (blob.type === mimeType) return blob;

  const drawToCanvas = async (source: CanvasImageSource, width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (nextBlob) => resolve(nextBlob),
        mimeType,
        mimeType === 'image/jpeg' ? quality : undefined,
      );
    });
  };

  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(blob);
      const encoded = await drawToCanvas(bitmap, bitmap.width, bitmap.height);
      bitmap.close();
      if (encoded) return encoded;
    } catch {
      // createImageBitmap 失败时回退 <img>
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image.'));
      img.src = objectUrl;
    });
    return await drawToCanvas(
      image,
      image.naturalWidth || image.width || 1,
      image.naturalHeight || image.height || 1,
    );
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export type WallpaperExportFile = {
  filename: string;
  blob: Blob;
};

/**
 * 收集 Wallpaper 可导出资源（不打包、不下载）。
 * nodeId 为 wallpaper 根 group 下任意节点均可。
 */
export const collectWallpaperExportFiles = async (
  nodes: FlowNode[],
  nodeId?: string,
  options?: ExportBundleOptions,
): Promise<WallpaperExportFile[] | null> => {
  const pushLine = (level: ExportProgressLevel, text: string) => {
    options?.onProgressLine?.({ level, text });
  };

  const rootNode = findRootGroupNode(nodes, nodeId);
  if (!rootNode || getNodeData(rootNode).category !== 'wallpaper') {
    pushLine('warning', '当前选中节点不属于 wallpaper');
    options?.onWarning?.('当前选中节点不属于 wallpaper');
    return null;
  }

  pushLine('info', '开始收集 Wallpaper 资源...');
  const files: WallpaperExportFile[] = [];

  // const configJson = buildWallpaperConfigJson(rootNode, nodes);
  // files.push({
  //   filename: 'wallpaper_spec.json',
  //   blob: new Blob([JSON.stringify(configJson, null, 2)], {
  //     type: 'application/json',
  //   }),
  // });
  // pushLine('success', '生成 wallpaper_spec.json');

  const platformGroups = nodes.filter(
    (node) =>
      node.type === 'platform_group' && node.parentId === rootNode.id,
  );
  const platformIds = new Set(platformGroups.map((node) => node.id));
  const wallpaperNodes = nodes.filter(
    (node) =>
      node.type === 'wallpaper' &&
      Boolean(node.parentId) &&
      platformIds.has(node.parentId as string),
  );

  for (let index = 0; index < wallpaperNodes.length; index += 1) {
    const wallpaperNode = wallpaperNodes[index];
    const data = getNodeData(wallpaperNode);
    const name = sanitizeFileToken(
      String(data.name ?? wallpaperNode.id ?? `wallpaper_${index}`),
    );
    const ext = resolveExportExt(data.ext, 'jpg');
    const filename = `${name || 'wallpaper'}.${ext}`;
    const outputWidth =
      Number(data.width) > 0 ? Number(data.width) : DEFAULT_WALLPAPER_WIDTH;
    const outputHeight =
      Number(data.height) > 0
        ? Number(data.height)
        : DEFAULT_WALLPAPER_HEIGHT;
    const targetElement = queryNodeElement(String(wallpaperNode.id));
    const source = data.source;

    pushLine('info', `开始处理 ${filename}...`);

    if (source && typeof source === 'string') {
      try {
        const { jpegBlob } = await cropMediaByUrl(source, {
          transform: normalizeCropProps(data.crop_props),
          targetElement,
          jpegOutputWidth: outputWidth,
          jpegOutputHeight: outputHeight,
          jpegQuality: EXPORT_JPEG_QUALITY,
          outputScale: 1,
          renderScale: 2,
          resizeMode: 'stretch',
        });
        if (!jpegBlob) {
          pushLine('warning', `跳过 ${filename}（裁剪失败）`);
          continue;
        }
        const exportBlob = await encodeBlobByExt(jpegBlob, ext);
        if (!exportBlob) {
          pushLine('warning', `跳过 ${filename}（转码失败）`);
          continue;
        }
        files.push({ filename, blob: exportBlob });
        pushLine('success', `生成 ${filename}`);
        continue;
      } catch {
        pushLine('warning', `${filename} 裁剪失败，尝试截图导出...`);
      }
    }
  }

  if (!files.length) {
    pushLine('warning', '没有可导出的文件');
    options?.onWarning?.('没有可导出的文件');
    return [];
  }

  pushLine('success', `Wallpaper 资源收集完成，共 ${files.length} 个文件`);
  return files;
};

export const useWallpaperExportBundle = (nodeId?: string) => {
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
        const files = await collectWallpaperExportFiles(nodes, nodeId, options);
        if (!files?.length) return;

        pushLine('info', '正在打包 zip...');
        const zip = new JSZip();
        for (const file of files) {
          zip.file(file.filename, file.blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `wallpaper-export-${Date.now()}.zip`);
        pushLine('success', '导出完成');
        options?.onSuccess?.('Wallpaper 压缩包已下载');
      } catch (error) {
        console.warn('[useWallpaperExportBundle] export failed:', error);
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
