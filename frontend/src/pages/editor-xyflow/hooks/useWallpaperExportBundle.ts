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

export const useWallpaperExportBundle = (nodeId?: string) => {
  const nodes = useEditorNodes();
  const [exporting, setExporting] = useState(false);

  const exportBundle = useCallback(
    async (options?: ExportBundleOptions) => {
      const pushLine = (level: ExportProgressLevel, text: string) => {
        options?.onProgressLine?.({ level, text });
      };

      if (exporting) return;

      const rootNode = findRootGroupNode(nodes, nodeId);
      if (!rootNode || getNodeData(rootNode).category !== 'wallpaper') {
        pushLine('warning', '当前选中节点不属于 wallpaper');
        options?.onWarning?.('当前选中节点不属于 wallpaper');
        return;
      }

      setExporting(true);
      try {
        pushLine('info', '开始导出 Wallpaper 资源...');
        const zip = new JSZip();

        // const configJson = buildWallpaperConfigJson(rootNode, nodes);
        // zip.file('wallpaper_spec.json', JSON.stringify(configJson, null, 2));
        // pushLine('success', '生成 wallpaper_spec.json');
        // console.log(configJson, 'configJson')

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
          const filename = `${name || 'wallpaper'}.jpg`;
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
              zip.file(filename, jpegBlob);
              pushLine('success', `生成 ${filename}`);
              continue;
            } catch {
              pushLine('warning', `${filename} 裁剪失败，尝试截图导出...`);
            }
          }

          // if (!targetElement) {
          //   pushLine('warning', `跳过 ${filename}（未找到 source / DOM 节点）`);
          //   continue;
          // }
        }

        const fileCount = Object.keys(zip.files).length;
        if (!fileCount || (fileCount === 1 && zip.files['wallpaper_spec.json'])) {
          pushLine('warning', '没有可导出的文件');
          options?.onWarning?.('没有可导出的文件');
          return;
        }

        pushLine('info', '正在打包 zip...');
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
