import type { Node as FlowNode } from '@xyflow/react';
import JSZip from 'jszip';
import { useCallback, useState } from 'react';
import { useEditorNodes } from '../context';
import { LOCKPACK_EXPORT_RULES } from '../lockwidget/export-rules';
import {
  type ExportBundleOptions,
  type ExportProgressLevel,
  fetchSourceBlob,
  findRootGroupNode,
} from './exportBundleShared';
import { collectLockWidgetExportFiles } from './useLockWidgetExportBundle';
import { collectWallpaperExportFiles } from './useWallpaperExportBundle';

const EXPORT_JPEG_QUALITY = 1;

export type LockpackExportFile = {
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
  ((node?.data as Record<string, any> | undefined) ?? {}) as Record<
    string,
    any
  >;

/** 仅 1 套时原名；多套时在扩展名前加 _1 / _2 …，见 LOCKPACK_EXPORT_RULES.multipleSuffixFrom */
const withExportIndex = (
  filename: string,
  index: number,
  total: number,
): string => {
  if (total <= 1) return filename;
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return `${filename}_${index}`;
  return `${filename.slice(0, dot)}_${index}${filename.slice(dot)}`;
};

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

const decodeImageBlob = async (blob: Blob): Promise<DecodedImage | null> => {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
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
    return {
      source: image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      release: () => URL.revokeObjectURL(objectUrl),
    };
  } catch {
    URL.revokeObjectURL(objectUrl);
    return null;
  }
};

/**
 * 统一转成 jpg：lockpack.yml 要求预览图和壁纸都是 jpg，
 * 用户可能传的是 png / webp，原样透传会导出 preview_long.png 这种过不了校验的文件。
 * 传了 target 就按目标尺寸拉伸输出，用于壁纸强制对齐 887×1920。
 */
const toJpegBlob = async (
  blob: Blob,
  target?: { width: number; height: number },
): Promise<{ blob: Blob; width: number; height: number } | null> => {
  const decoded = await decodeImageBlob(blob);
  if (!decoded) return null;

  const width = Math.max(1, Math.round(target?.width ?? decoded.width));
  const height = Math.max(1, Math.round(target?.height ?? decoded.height));
  const sizeMatched = width === decoded.width && height === decoded.height;

  try {
    if (blob.type === 'image/jpeg' && sizeMatched) {
      return { blob, width: decoded.width, height: decoded.height };
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(decoded.source, 0, 0, width, height);
    const encoded = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((next) => resolve(next), 'image/jpeg', EXPORT_JPEG_QUALITY);
    });
    return encoded ? { blob: encoded, width, height } : null;
  } finally {
    decoded.release();
  }
};

type LockpackSurface = {
  key: string;
  source: string;
};

/** 预览面：platform_group.themekitType 是业务 key，子节点上挂着上传的 source */
const collectLockpackSurfaces = (rootNode: FlowNode, nodes: FlowNode[]) => {
  const surfaces = new Map<string, LockpackSurface>();
  let selectElements: Record<string, any> = {};

  nodes
    .filter(
      (node) => node.type === 'platform_group' && node.parentId === rootNode.id,
    )
    .forEach((platformNode) => {
      const key = String(getNodeData(platformNode).themekitType || '');
      if (!key) return;
      const surfaceNode = nodes.find(
        (node) => node.parentId === platformNode.id,
      );
      const data = getNodeData(surfaceNode);
      if (data.selectElements && typeof data.selectElements === 'object') {
        selectElements = data.selectElements;
      }
      surfaces.set(key, { key, source: String(data.source ?? '') });
    });

  return { surfaces, selectElements };
};

/**
 * 收集 LockPack 可导出资源（不打包、不下载）。
 *
 * 与 theme 不同，这里对缺失资源不做「跳过并继续」：lockpack.yml 要求三张预览图、
 * 一张壁纸、至少一套组件缺一不可，缺了导出出来的包必然过不了校验，
 * 不如直接中止并告诉用户缺什么。
 */
export const collectLockpackExportFiles = async (
  nodes: FlowNode[],
  nodeId?: string,
  options?: ExportBundleOptions,
): Promise<LockpackExportFile[] | null> => {
  const pushLine = (level: ExportProgressLevel, text: string) => {
    options?.onProgressLine?.({ level, text });
  };
  const fail = (text: string) => {
    pushLine('error', text);
    options?.onError?.(text);
    return null;
  };

  const rootNode = findRootGroupNode(nodes, nodeId);
  if (!rootNode || getNodeData(rootNode).category !== 'lockpack') {
    return fail('当前选中节点不属于 lockpack');
  }

  const { surfaces, selectElements } = collectLockpackSurfaces(rootNode, nodes);
  const files: LockpackExportFile[] = [];

  // 1. 三张整包预览图：右侧面板上传的成品图，转 jpg 后原样进包
  pushLine('info', '开始收集 LockPack 预览图...');
  const missingPreviews: string[] = [];
  for (const rule of LOCKPACK_EXPORT_RULES.previews) {
    const key = rule.name.replace(/\.[^.]+$/, '');
    const source = surfaces.get(key)?.source ?? '';
    if (!source) {
      missingPreviews.push(rule.name);
      continue;
    }
    const blob = await fetchSourceBlob(source);
    if (!blob) {
      missingPreviews.push(rule.name);
      continue;
    }
    const encoded = await toJpegBlob(blob);
    if (!encoded) {
      missingPreviews.push(rule.name);
      continue;
    }
    if (
      encoded.width !== rule.expectedWidth ||
      encoded.height !== rule.expectedHeight
    ) {
      pushLine(
        'warning',
        `${rule.name} 尺寸为 ${encoded.width}×${encoded.height}，规则要求 ${rule.expectedWidth}×${rule.expectedHeight}`,
      );
    }
    files.push({ filename: rule.name, blob: encoded.blob });
    pushLine('success', `生成 ${rule.name}`);
  }
  if (missingPreviews.length) {
    return fail(`缺少预览图：${missingPreviews.join('、')}`);
  }

  // 2. 壁纸：LockPack 固定单张 wallpaper.jpg，iPad 那张不进包
  const wallpaperKey = String(
    (Array.isArray(selectElements?.wallpaper)
      ? selectElements.wallpaper[0]
      : '') || '',
  );
  if (!wallpaperKey) {
    return fail('LockPack 未关联壁纸');
  }
  pushLine('info', `开始收集壁纸: ${wallpaperKey}`);
  const wallpaperFiles = await collectWallpaperExportFiles(
    nodes,
    wallpaperKey,
    options,
  );
  const phoneWallpaper = wallpaperFiles?.find((file) =>
    /^wallpaper\.[a-z0-9]+$/i.test(file.filename),
  );
  if (!phoneWallpaper) {
    return fail(`壁纸 ${wallpaperKey} 无可导出内容`);
  }
  const wallpaperRule = LOCKPACK_EXPORT_RULES.wallpaper;
  // 壁纸按规则尺寸强制输出，画布上壁纸节点尺寸不对时也能出合规的包
  const wallpaperBlob = await toJpegBlob(phoneWallpaper.blob, {
    width: wallpaperRule.expectedWidth,
    height: wallpaperRule.expectedHeight,
  });
  if (!wallpaperBlob) {
    return fail(`壁纸 ${wallpaperKey} 转码失败`);
  }
  files.push({ filename: wallpaperRule.name, blob: wallpaperBlob.blob });
  pushLine(
    'success',
    `生成 ${wallpaperRule.name} ${wallpaperRule.expectedWidth}×${wallpaperRule.expectedHeight}`,
  );

  // 3. 锁屏组件：整套复用 lockwidget 导出器，多套时全部资源加 _1 / _2 后缀
  const lockWidgetKeys = (
    Array.isArray(selectElements?.lockwidgets) ? selectElements.lockwidgets : []
  )
    .map((key: unknown) => String(key))
    .filter(Boolean);
  if (!lockWidgetKeys.length) {
    return fail('LockPack 未关联锁屏组件');
  }

  const total = lockWidgetKeys.length;
  pushLine('info', `开始收集锁屏组件资源（${total} 套）...`);
  for (let i = 0; i < total; i += 1) {
    const elementKey = lockWidgetKeys[i];
    const index = i + LOCKPACK_EXPORT_RULES.multipleSuffixFrom;
    const lockFiles = await collectLockWidgetExportFiles(
      nodes,
      elementKey,
      options,
    );
    if (!lockFiles?.length) {
      return fail(`锁屏组件 ${elementKey} 无可导出资源`);
    }
    for (const file of lockFiles) {
      const filename = withExportIndex(file.filename, index, total);
      files.push({ filename, blob: file.blob });
      pushLine('success', `锁屏组件资源: [${elementKey}] → ${filename}`);
    }
  }

  pushLine('success', `资源收集完成，共 ${files.length} 个文件`);
  return files;
};

export const useLockpackExportBundle = (nodeId?: string) => {
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
        const files = await collectLockpackExportFiles(nodes, nodeId, options);
        if (!files?.length) return;

        pushLine('info', '正在打包 zip...');
        const zip = new JSZip();
        for (const file of files) {
          zip.file(file.filename, file.blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `lockpack-export-${Date.now()}.zip`);
        pushLine('success', '导出完成');
        options?.onSuccess?.('LockPack 压缩包已下载');
      } catch (error) {
        console.warn('[useLockpackExportBundle] export failed:', error);
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
