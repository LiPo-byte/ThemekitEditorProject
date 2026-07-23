import { useCallback, useState } from 'react';
import JSZip from 'jszip';
import type { Node as FlowNode } from '@xyflow/react';
import { useEditorNodes } from '../context';
import { buildIconPackConfigJson } from '../icon/buildIconPackConfig';
import { cropMediaByUrl } from '../util/cropMediaByUrl';
import {
  generateElementPreview,
  isGifSource,
} from '../util/generateElementPreview';
import { CONFIG_SIZE_MAP } from '../widget/base-config';
import {
  findRootGroupNode,
  type ExportBundleOptions,
  type ExportProgressLevel,
} from './exportBundleShared';

const ICON_EXPORT_SIZE = 180;
const EXPORT_JPEG_QUALITY = 1;
const EXPORT_PREVIEW_SCALE = 3;

const SIZE_LABEL_MAP: Record<number, string> = {
  1: 'small',
  2: 'medium',
  3: 'large',
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

/** @deprecated 使用 findRootGroupNode + category === 'iconpack' */
export const findIconPackRootNode = (
  nodes: FlowNode[],
  nodeId?: string,
): FlowNode | null => {
  const root = findRootGroupNode(nodes, nodeId);
  if (!root) return null;
  return getNodeData(root).category === 'iconpack' ? root : null;
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

/** 判断 node 是否属于 rootId 子树 */
const isUnderRoot = (
  nodes: FlowNode[],
  node: FlowNode,
  rootId: string,
): boolean => {
  if (String(node.id) === String(rootId)) return true;
  const byId = new Map(nodes.map((item) => [String(item.id), item]));
  let current: FlowNode | undefined = node;
  while (current?.parentId) {
    if (String(current.parentId) === String(rootId)) return true;
    current = byId.get(String(current.parentId));
  }
  return false;
};

export type IconPackExportFile = {
  /** 稳定标识，外部改名时用这个识别（如 safari / preview_long） */
  key: string;
  /** 资源类型 */
  kind: 'icon' | 'preview';
  /** 默认文件名，外部打包时可换成任意路径/名字 */
  filename: string;
  blob: Blob;
};

/**
 * 收集 IconPack 可导出资源（不打包、不下载）。
 * 供外部自行改名后打进别的 zip。
 */
export const collectIconPackExportFiles = async (
  nodes: FlowNode[],
  nodeId?: string,
  options?: ExportBundleOptions,
): Promise<IconPackExportFile[] | null> => {
  const pushLine = (level: ExportProgressLevel, text: string) => {
    options?.onProgressLine?.({ level, text });
  };

  const rootNode = findRootGroupNode(nodes, nodeId);
  if (!rootNode || getNodeData(rootNode).category !== 'iconpack') {
    pushLine('warning', '当前选中节点不属于 iconpack');
    options?.onWarning?.('当前选中节点不属于 iconpack');
    return null;
  }

  pushLine('info', '开始收集 IconPack 资源...');
  const files: IconPackExportFile[] = [];
  // const configJson = buildIconPackConfigJson(rootNode, nodes);
  // files.push({
  //   key: 'iconpack_spec',
  //   kind: 'preview',
  //   filename: 'iconpack_spec.json',
  //   blob: new Blob([JSON.stringify(configJson, null, 2)], {
  //     type: 'application/json',
  //   }),
  // });
  // pushLine('success', '生成 iconpack_spec.json');

  const platformGroups = nodes.filter(
    (node) =>
      node.type === 'platform_group' && node.parentId === rootNode.id,
  );
  const appsGroup = platformGroups.find(
    (node) => getNodeData(node).label === 'iconpack',
  );

  // apps → icon_{key}.jpg
  const iconNodes = appsGroup
    ? nodes.filter(
        (node) => node.type === 'icon' && node.parentId === appsGroup.id,
      )
    : [];
  for (let index = 0; index < iconNodes.length; index += 1) {
    const iconNode = iconNodes[index];
    const data = getNodeData(iconNode);
    const key = sanitizeFileToken(
      String(data.key ?? data.name ?? iconNode.id ?? index),
    );
    const source = data.source;
    if (!source || typeof source !== 'string') {
      pushLine('warning', `跳过 icon_${key}.jpg（未找到 source）`);
      continue;
    }
    const targetElement = queryNodeElement(String(iconNode.id));
    pushLine('info', `开始处理 icon_${key}...`);
    try {
      const { jpegBlob } = await cropMediaByUrl(source, {
        transform: normalizeCropProps(data.crop_props),
        targetElement,
        jpegOutputWidth: ICON_EXPORT_SIZE,
        jpegOutputHeight: ICON_EXPORT_SIZE,
        jpegQuality: EXPORT_JPEG_QUALITY,
        outputScale: 1,
        renderScale: 2,
        resizeMode: 'stretch',
      });
      if (!jpegBlob) {
        pushLine('warning', `跳过 icon_${key}.jpg（裁剪失败）`);
        continue;
      }
      files.push({
        key,
        kind: 'icon',
        filename: `icon_${key}.jpg`,
        blob: jpegBlob,
      });
      pushLine('success', `生成 icon_${key}.jpg`);
    } catch {
      pushLine('warning', `跳过 icon_${key}.jpg（导出失败）`);
    }
  }

  // preview_long / preview_short / list_view → icons_{key}.jpg|png
  const surfaceGroups = platformGroups
    .filter((node) => getNodeData(node).label !== 'iconpack')
    .sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));
  for (let index = 0; index < surfaceGroups.length; index += 1) {
    const platformNode = surfaceGroups[index];
    const platformData = getNodeData(platformNode);
    const key = String(
      platformData.label || platformData.themekitType || '',
    );
    if (!key) continue;

    const surfaceNode = nodes.find(
      (node) =>
        node.parentId === platformNode.id &&
        (node.type === key ||
          String(getNodeData(node).key ?? '') === key),
    );
    if (!surfaceNode || !isUnderRoot(nodes, surfaceNode, String(rootNode.id))) {
      continue;
    }

    const data = getNodeData(surfaceNode);
    const name = sanitizeFileToken(String(data.name || key || `preview_${index}`));
    const filename = `icons_${name || 'preview'}.${
      name === 'list_view' ? 'png' : 'jpg'
    }`;
    const outputWidth =
      Number(data.exportWidth) > 0
        ? Number(data.exportWidth)
        : Number(data.width) > 0
          ? Number(data.width)
          : undefined;
    const outputHeight =
      Number(data.exportHeight) > 0
        ? Number(data.exportHeight)
        : Number(data.height) > 0
          ? Number(data.height)
          : undefined;
    const targetElement = queryNodeElement(String(surfaceNode.id));
    if (!targetElement) {
      pushLine('warning', `跳过 ${filename}（未找到 DOM 节点）`);
      continue;
    }
    pushLine(
      'info',
      `开始处理 ${filename}${outputWidth && outputHeight ? ` ${outputWidth}x${outputHeight}` : ''}...`,
    );
    try {
      const previewBlob = await generateElementPreview(targetElement, {
        isGif: Boolean(data.isGif),
        scale: EXPORT_PREVIEW_SCALE,
        jpegQuality: EXPORT_JPEG_QUALITY,
        outputWidth,
        outputHeight,
      });
      if (!previewBlob) {
        pushLine('warning', `跳过 ${filename}（截图失败）`);
        continue;
      }
      files.push({
        key: name || key,
        kind: 'preview',
        filename,
        blob: previewBlob,
      });
      pushLine('success', `生成 ${filename}`);
    } catch {
      pushLine('warning', `跳过 ${filename}（导出失败）`);
    }
  }

  if (!files.length) {
    pushLine('warning', '没有可导出的文件');
    options?.onWarning?.('没有可导出的文件');
    return [];
  }

  pushLine('success', `资源收集完成，共 ${files.length} 个文件`);
  return files;
};

/** 将已收集的资源打成 zip 并触发下载 */
export const packAndDownloadIconPackFiles = async (
  files: IconPackExportFile[],
  options?: ExportBundleOptions & { filename?: string },
) => {
  const pushLine = (level: ExportProgressLevel, text: string) => {
    options?.onProgressLine?.({ level, text });
  };

  if (!files.length) {
    pushLine('warning', '没有可导出的文件');
    options?.onWarning?.('没有可导出的文件');
    return false;
  }

  pushLine('info', '正在打包 zip...');
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.filename, file.blob);
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename =
    options?.filename || `iconpack-export-${Date.now()}.zip`;
  downloadBlob(zipBlob, filename);
  pushLine('success', '导出完成');
  options?.onSuccess?.('IconPack 压缩包已下载');
  return true;
};

export const useIconPackExportBundle = (nodeId?: string) => {
  const nodes = useEditorNodes();
  const [exporting, setExporting] = useState(false);

  /** 获取可打包资源列表（不下载）；外部可改 filename 后打进别的 zip */
  const collectAssets = useCallback(
    async (options?: ExportBundleOptions): Promise<IconPackExportFile[] | null> => {
      if (exporting) return null;
      setExporting(true);
      try {
        return await collectIconPackExportFiles(nodes, nodeId, options);
      } catch (error) {
        console.warn('[useIconPackExportBundle] collectAssets failed:', error);
        options?.onProgressLine?.({ level: 'error', text: '收集资源失败' });
        options?.onError?.('收集资源失败');
        return null;
      } finally {
        setExporting(false);
      }
    },
    [exporting, nodeId, nodes],
  );

  /** 收集资源 + 打包下载（兼容原有调用） */
  const exportBundle = useCallback(
    async (options?: ExportBundleOptions) => {
      if (exporting) return;
      setExporting(true);
      try {
        const files = await collectIconPackExportFiles(nodes, nodeId, options);
        if (!files?.length) return;
        await packAndDownloadIconPackFiles(files, options);
      } catch (error) {
        console.warn('[useIconPackExportBundle] export failed:', error);
        options?.onProgressLine?.({ level: 'error', text: '导出失败' });
        options?.onError?.('导出失败');
      } finally {
        setExporting(false);
      }
    },
    [exporting, nodeId, nodes],
  );

  return {
    exporting,
    /** 只拿资源，不打包不下载 */
    collectAssets,
    exportBundle,
  };
};
