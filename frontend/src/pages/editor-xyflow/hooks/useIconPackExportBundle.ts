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

export const useIconPackExportBundle = (nodeId?: string) => {
  const nodes = useEditorNodes();
  const [exporting, setExporting] = useState(false);

  const exportBundle = useCallback(
    async (options?: ExportBundleOptions) => {
      const pushLine = (level: ExportProgressLevel, text: string) => {
        options?.onProgressLine?.({ level, text });
      };

      if (exporting) return;

      const rootNode = findRootGroupNode(nodes, nodeId);
      if (!rootNode || getNodeData(rootNode).category !== 'iconpack') {
        pushLine('warning', '当前选中节点不属于 iconpack');
        options?.onWarning?.('当前选中节点不属于 iconpack');
        return;
      }

      setExporting(true);
      try {
        pushLine('info', '开始导出 IconPack 资源...');
        const zip = new JSZip();
        // const configJson = buildIconPackConfigJson(rootNode, nodes);
        // zip.file('iconpack_spec.json', JSON.stringify(configJson, null, 2));
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
            zip.file(`icon_${key}.jpg`, jpegBlob);
            pushLine('success', `生成 icon_${key}.jpg`);
          } catch {
            pushLine('warning', `跳过 icon_${key}.jpg（导出失败）`);
          }
        }

        // type === 'preview' → 桌面预览截图
        const previewNodes = nodes.filter(
          (node) =>
            node.type === 'preview' &&
            isUnderRoot(nodes, node, String(rootNode.id)),
        );
        for (let index = 0; index < previewNodes.length; index += 1) {
          const previewNode = previewNodes[index];
          const data = getNodeData(previewNode);
          const name = sanitizeFileToken(
            String(data.name ?? `preview_${index}`),
          );
          const filename = `icons_${name || 'preview'}.${name === 'list_view' ? 'png' : 'jpg'}`;
          const size = Array.isArray(data.size) ? data.size : [];
          const outputWidth = Number(size[0]) || undefined;
          const outputHeight = Number(size[1]) || undefined;
          const targetElement = queryNodeElement(String(previewNode.id));
          if (!targetElement) {
            pushLine('warning', `跳过 ${filename}（未找到 DOM 节点）`);
            continue;
          }
          pushLine('info', `开始处理 ${filename}...`);
          try {
            const previewBlob = await generateElementPreview(targetElement, {
              isGif: false,
              scale: EXPORT_PREVIEW_SCALE,
              jpegQuality: EXPORT_JPEG_QUALITY,
              outputWidth,
              outputHeight,
            });
            if (!previewBlob) {
              pushLine('warning', `跳过 ${filename}（截图失败）`);
              continue;
            }
            zip.file(filename, previewBlob);
            pushLine('success', `生成 ${filename}`);
          } catch {
            pushLine('warning', `跳过 ${filename}（导出失败）`);
          }
        }

        const fileCount = Object.keys(zip.files).length;
        if (!fileCount || (fileCount === 1 && zip.files['iconpack_spec.json'])) {
          pushLine('warning', '没有可导出的文件');
          options?.onWarning?.('没有可导出的文件');
          return;
        }

        pushLine('info', '正在打包 zip...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `iconpack-export-${Date.now()}.zip`);
        pushLine('success', '导出完成');
        options?.onSuccess?.('IconPack 压缩包已下载');
      } catch (error) {
        console.warn('[useIconPackExportBundle] export failed:', error);
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
