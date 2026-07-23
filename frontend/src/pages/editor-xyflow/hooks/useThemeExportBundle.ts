import { useCallback, useState } from 'react';
import JSZip from 'jszip';
import type { Node as FlowNode } from '@xyflow/react';
import { useEditorNodes } from '../context';
import { generateElementPreview } from '../util/generateElementPreview';
import {
  findRootGroupNode,
  type ExportBundleOptions,
  type ExportProgressLevel,
} from './exportBundleShared';

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
type ThemeSurfaceExportItem = {
  key: string;
  surfaceNode: FlowNode;
  platformNode: FlowNode;
  isGif: boolean;
  exportWidth: number;
  exportHeight: number;
  width: number;
  height: number;
};

/** 收集 theme 根下各预览面节点（与 buildThemeConfigJson 同一套树结构） */
const collectThemeSurfaceNodes = (
  rootNode: FlowNode,
  nodes: FlowNode[],
): ThemeSurfaceExportItem[] => {
  const platformNodes = nodes
    .filter(
      (node) =>
        node.type === 'platform_group' && node.parentId === rootNode.id,
    )
    .sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));

  const surfaces: ThemeSurfaceExportItem[] = [];
  platformNodes.forEach((platformNode) => {
    const platformData = getNodeData(platformNode);
    const key = String(platformData.label || platformData.themekitType || '');
    if (!key) return;

    const surfaceNode = nodes.find(
      (node) =>
        node.parentId === platformNode.id &&
        (node.type === key || String(getNodeData(node).key ?? '') === key),
    );
    if (!surfaceNode) return;

    const data = getNodeData(surfaceNode);
    surfaces.push({
      key,
      surfaceNode,
      platformNode,
      isGif: data.isGif,
      exportWidth: Number(data.exportWidth) > 0 ? Number(data.exportWidth) : 887,
      exportHeight: Number(data.exportHeight) > 0 ? Number(data.exportHeight) : 1920,
      width: Number(data.width) > 0 ? Number(data.width) : 887,
      height: Number(data.height) > 0 ? Number(data.height) : 1920,
    });
  });
  return surfaces;
};

export const useThemeExportBundle = (nodeId?: string) => {
  const nodes = useEditorNodes();
  const [exporting, setExporting] = useState(false);

  const exportBundle = useCallback(
    async (options?: ExportBundleOptions) => {
      const pushLine = (level: ExportProgressLevel, text: string) => {
        options?.onProgressLine?.({ level, text });
      };

      if (exporting) return;

      const rootNode = findRootGroupNode(nodes, nodeId);
      if (!rootNode || getNodeData(rootNode).category !== 'theme') {
        pushLine('warning', '当前选中节点不属于 theme');
        options?.onWarning?.('当前选中节点不属于 theme');
        return;
      }

      setExporting(true);
      try {
        pushLine('info', '开始导出 Theme 资源...');
        const zip = new JSZip();

        const surfaces = collectThemeSurfaceNodes(rootNode, nodes);
        pushLine('info', `收集到 ${surfaces.length} 个预览面`);
        if (!surfaces.length) {
          pushLine('warning', '未找到可导出的预览面节点');
        }

        for (let index = 0; index < surfaces.length; index += 1) {
          const item = surfaces[index];
          const isGif = item.isGif;
          const filename = `${item.key}.${isGif ? 'gif' : 'jpg'}`;
          const targetElement = queryNodeElement(String(item.surfaceNode.id));
          if (!targetElement) {
            pushLine('warning', `跳过 ${filename}（未找到 DOM 节点）`);
            continue;
          }
          pushLine(
            'info',
            `开始处理 ${filename} ${item.exportWidth}x${item.exportHeight}...`,
          );
          try {
            const previewBlob = await generateElementPreview(targetElement, {
              isGif: isGif,
              scale: 2,
              jpegQuality: EXPORT_JPEG_QUALITY,
              outputWidth: item.exportWidth,
              outputHeight: item.exportHeight,
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

        // TODO: 用 buildThemeConfigJson(rootNode, nodes) 生成 theme_spec.json 并写入 zip
        // TODO: 如需打包 selectElements 关联的 widget/icon/wallpaper 资源，在此补充

        const fileCount = Object.keys(zip.files).length;
        if (!fileCount) {
          pushLine('warning', '没有可导出的文件');
          options?.onWarning?.('没有可导出的文件');
          return;
        }

        pushLine('info', '正在打包 zip...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `theme-export-${Date.now()}.zip`);
        pushLine('success', '导出完成');
        options?.onSuccess?.('Theme 压缩包已下载');
      } catch (error) {
        console.warn('[useThemeExportBundle] export failed:', error);
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
