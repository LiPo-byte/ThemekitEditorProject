import type { Node as FlowNode } from '@xyflow/react';
import JSZip from 'jszip';
import { useCallback, useState } from 'react';
import { useEditorNodes } from '../context';
import {
  findRootGroupNode,
  type ExportBundleOptions,
  type ExportProgressLevel,
} from './exportBundleShared';

/**
 * 文件名、尺寸、格式全部按资源校验规则来，改之前先看这两份 yml：
 * widget/rule_ymal/resource-validation/resource_sticker_gif_ios.yml
 * widget/rule_ymal/resource-validation/resource_sticker_static_ios.yml
 */
const STICKER_FILE_SPEC = {
  'sticker.png': { width: 450, height: 450 },
  'sticker.mov': { width: 450, height: 450 },
  'list_view.webp': { width: 192, height: 192 },
} as const;

type StickerFileName = keyof typeof STICKER_FILE_SPEC;

const REQUIRED_FILES: Record<'gif' | 'static', readonly StickerFileName[]> = {
  gif: ['list_view.webp', 'sticker.mov'],
  static: ['sticker.png'],
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

/** 每个 sticker 子节点导出成哪个文件：gif 的主体是 mov，静态的主体是 png */
const resolveExportFile = (data: Record<string, any>, isGif: boolean) => {
  const key = String(data.key ?? 'sticker');
  if (key === 'list_view') {
    return data.source
      ? { filename: 'list_view.webp' as StickerFileName, source: String(data.source) }
      : null;
  }
  if (isGif) {
    return data.movsource
      ? { filename: 'sticker.mov' as StickerFileName, source: String(data.movsource) }
      : null;
  }
  return data.source
    ? { filename: 'sticker.png' as StickerFileName, source: String(data.source) }
    : null;
};

/**
 * 上传时已经按规则卡过尺寸，这里再确认一次，防止右侧属性面板换过图。
 * mov 浏览器不一定解得开，只校验图片。
 */
const findSizeMismatch = async (blob: Blob, filename: StickerFileName) => {
  if (filename === 'sticker.mov') return null;
  if (typeof createImageBitmap !== 'function') return null;
  try {
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;
    bitmap.close();
    const spec = STICKER_FILE_SPEC[filename];
    if (width === spec.width && height === spec.height) return null;
    return `${width}×${height}`;
  } catch {
    return null;
  }
};

export type StickerExportFile = {
  filename: string;
  blob: Blob;
};

/**
 * 收集 Sticker 可导出资源（不打包、不下载）。
 * nodeId 为 sticker 根 group 下任意节点均可。
 */
export const collectStickerExportFiles = async (
  nodes: FlowNode[],
  nodeId?: string,
  options?: ExportBundleOptions,
): Promise<StickerExportFile[] | null> => {
  const pushLine = (level: ExportProgressLevel, text: string) => {
    options?.onProgressLine?.({ level, text });
  };

  const rootNode = findRootGroupNode(nodes, nodeId);
  const rootData = getNodeData(rootNode);
  if (!rootNode || rootData.category !== 'sticker') {
    pushLine('warning', '当前选中节点不属于 sticker');
    options?.onWarning?.('当前选中节点不属于 sticker');
    return null;
  }

  const isGif = Boolean(rootData.sticker_gif);
  pushLine('info', `开始收集 Sticker 资源（${isGif ? 'gif' : 'static'}）...`);

  const platformIds = new Set(
    nodes
      .filter(
        (node) =>
          node.type === 'platform_group' && node.parentId === rootNode.id,
      )
      .map((node) => node.id),
  );
  const stickerNodes = nodes.filter(
    (node) =>
      node.type === 'sticker' &&
      Boolean(node.parentId) &&
      platformIds.has(node.parentId as string),
  );

  const files: StickerExportFile[] = [];

  for (const stickerNode of stickerNodes) {
    const data = getNodeData(stickerNode);
    const target = resolveExportFile(data, isGif);
    if (!target) {
      pushLine('warning', `跳过 ${data.key ?? 'sticker'}（未上传文件）`);
      continue;
    }

    pushLine('info', `开始处理 ${target.filename}...`);
    try {
      // 尺寸和格式都是规则写死的，不转码，原样取回二进制打包
      const response = await fetch(target.source);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const mismatch = await findSizeMismatch(blob, target.filename);
      if (mismatch) {
        const spec = STICKER_FILE_SPEC[target.filename];
        pushLine(
          'warning',
          `${target.filename} 尺寸是 ${mismatch}，规则要求 ${spec.width}×${spec.height}`,
        );
      }
      files.push({ filename: target.filename, blob });
      pushLine('success', `生成 ${target.filename}`);
    } catch {
      pushLine('warning', `跳过 ${target.filename}（下载失败）`);
    }
  }

  const missing = REQUIRED_FILES[isGif ? 'gif' : 'static'].filter(
    (filename) => !files.some((file) => file.filename === filename),
  );
  if (missing.length) {
    const text = `缺少规则要求的文件：${missing.join('、')}`;
    pushLine('warning', text);
    options?.onWarning?.(text);
  }

  if (!files.length) {
    pushLine('warning', '没有可导出的文件');
    options?.onWarning?.('没有可导出的文件');
    return [];
  }

  pushLine('success', `Sticker 资源收集完成，共 ${files.length} 个文件`);
  return files;
};

export const useStickerExportBundle = (nodeId?: string) => {
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
        const files = await collectStickerExportFiles(nodes, nodeId, options);
        if (!files?.length) return;

        pushLine('info', '正在打包 zip...');
        const zip = new JSZip();
        for (const file of files) {
          zip.file(file.filename, file.blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `sticker-export-${Date.now()}.zip`);
        pushLine('success', '导出完成');
        options?.onSuccess?.('Sticker 压缩包已下载');
      } catch (error) {
        console.warn('[useStickerExportBundle] export failed:', error);
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
