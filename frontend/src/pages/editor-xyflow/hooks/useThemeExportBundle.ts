import { useCallback, useState } from 'react';
import JSZip from 'jszip';
import type { Node as FlowNode } from '@xyflow/react';
import { useEditorNodes } from '../context';
import {
  collectIconPackExportFiles,
  type IconPackExportFile,
} from './useIconPackExportBundle';
import {
  collectWidgetExportFiles,
  type WidgetExportFile,
} from './useWidgetExportBundle';
import {
  collectWallpaperExportFiles,
  type WallpaperExportFile,
} from './useWallpaperExportBundle';
import {
  fetchSourceBlob,
  findRootGroupNode,
  resolveSourceExt,
  type ExportBundleOptions,
  type ExportProgressLevel,
} from './exportBundleShared';

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

type ThemeSurfaceExportItem = {
  key: string;
  surfaceNode: FlowNode;
  platformNode: FlowNode;
  isGif: boolean;
  /** 上传的预览图，导出时直接透传 */
  source: string;
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
    // label 表示 common 等系统，业务 key 优先 themekitType
    const key = String(platformData.themekitType || platformData.label || '');
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
      source: String(data.source || '').trim(),
      exportWidth: Number(data.exportWidth) > 0 ? Number(data.exportWidth) : 887,
      exportHeight: Number(data.exportHeight) > 0 ? Number(data.exportHeight) : 1920,
      width: Number(data.width) > 0 ? Number(data.width) : 887,
      height: Number(data.height) > 0 ? Number(data.height) : 1920,
    });
  });
  return surfaces;
};

/** 从 theme 各预览面读取 selectElements（与 buildThemeConfigJson 一致，后者覆盖前者） */
const resolveThemeSelectElements = (
  rootNode: FlowNode,
  nodes: FlowNode[],
): Record<string, any> => {
  const platformNodes = nodes
    .filter(
      (node) =>
        node.type === 'platform_group' && node.parentId === rootNode.id,
    )
    .sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));

  let selectElements: Record<string, any> = {};
  platformNodes.forEach((platformNode) => {
    const platformData = getNodeData(platformNode);
    const key = String(platformData.themekitType || platformData.label || '');
    if (!key) return;
    const surfaceNode = nodes.find(
      (node) =>
        node.parentId === platformNode.id &&
        (node.type === key || String(getNodeData(node).key ?? '') === key),
    );
    const data = getNodeData(surfaceNode);
    if (data.selectElements && typeof data.selectElements === 'object') {
      selectElements = data.selectElements;
    }
  });
  return selectElements;
};

/** 收集 selectElements.apps 关联的 iconpack 导出资源列表 */
const collectThemeIconPackAssets = async (
  nodes: FlowNode[],
  selectElements: Record<string, any>,
  options?: ExportBundleOptions,
): Promise<Array<IconPackExportFile & { elementKey: string }>> => {
  const pushLine = (level: ExportProgressLevel, text: string) => {
    options?.onProgressLine?.({ level, text });
  };

  const appKeys = Array.isArray(selectElements?.apps)
    ? selectElements.apps.map((key: unknown) => String(key)).filter(Boolean)
    : [];

  if (!appKeys.length) {
    pushLine('info', 'selectElements.apps 为空，跳过 icon 资源收集');
    return [];
  }

  pushLine('info', `开始收集关联 iconpack 资源（${appKeys.length} 个）...`);
  const result: Array<IconPackExportFile & { elementKey: string }> = [];

  for (const elementKey of appKeys) {
    pushLine('info', `收集 iconpack: ${elementKey}`);
    const files = await collectIconPackExportFiles(nodes, elementKey, options);
    if (!files?.length) {
      pushLine('warning', `iconpack ${elementKey} 无可导出资源`);
      continue;
    }
    for (const file of files) {
      result.push({ ...file, elementKey });
      pushLine(
        'success',
        `icon 资源: [${elementKey}] ${file.kind}/${file.key} → ${file.filename}`,
      );
    }
  }

  pushLine('info', `icon 资源列表共 ${result.length} 个文件`);
  return result;
};

/** 仅 1 个时原名；多个时在扩展名前加 _1 / _2 … */
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

/** 解析 selectElements.widgets 条目 → platform_group id */
const resolveWidgetPlatformGroupId = (
  nodes: FlowNode[],
  selectionKey: string,
): string | null => {
  const [elementKeyRaw, systemRaw] = String(selectionKey).split(',');
  const elementKey = String(elementKeyRaw || '').trim();
  const system = String(systemRaw || 'common').trim() || 'common';
  if (!elementKey) return null;

  const platformNode = nodes.find(
    (node) =>
      node.type === 'platform_group' &&
      String(node.parentId) === elementKey &&
      String(getNodeData(node).label || '') === system,
  );
  return platformNode ? String(platformNode.id) : null;
};

/** 收集 selectElements.widgets 关联资源，并按数量决定是否加 _1/_2 */
const collectThemeWidgetAssets = async (
  nodes: FlowNode[],
  selectElements: Record<string, any>,
  options?: ExportBundleOptions,
): Promise<WidgetExportFile[]> => {
  const pushLine = (level: ExportProgressLevel, text: string) => {
    options?.onProgressLine?.({ level, text });
  };

  const widgetKeys = Array.isArray(selectElements?.widgets)
    ? selectElements.widgets.map((key: unknown) => String(key)).filter(Boolean)
    : [];

  if (!widgetKeys.length) {
    pushLine('info', 'selectElements.widgets 为空，跳过 widget 资源收集');
    return [];
  }

  const total = widgetKeys.length;
  pushLine('info', `开始收集关联 widget 资源（${total} 个）...`);
  const result: WidgetExportFile[] = [];

  for (let i = 0; i < widgetKeys.length; i += 1) {
    const selectionKey = widgetKeys[i];
    const index = i + 1;
    const platformGroupId = resolveWidgetPlatformGroupId(nodes, selectionKey);
    if (!platformGroupId) {
      pushLine('warning', `未找到 widget platform: ${selectionKey}`);
      continue;
    }
    pushLine('info', `收集 widget: ${selectionKey}`);
    const files = await collectWidgetExportFiles(
      nodes,
      platformGroupId,
      options,
    );
    if (!files?.length) {
      pushLine('warning', `widget ${selectionKey} 无可导出资源`);
      continue;
    }
    for (const file of files) {
      const filename = withExportIndex(file.filename, index, total);
      result.push({ filename, blob: file.blob });
      pushLine('success', `widget 资源: [${selectionKey}] → ${filename}`);
    }
  }

  pushLine('info', `widget 资源列表共 ${result.length} 个文件`);
  return result;
};

/** 收集 selectElements.wallpaper 关联资源，并按数量决定是否加 _1/_2 */
const collectThemeWallpaperAssets = async (
  nodes: FlowNode[],
  selectElements: Record<string, any>,
  options?: ExportBundleOptions,
): Promise<WallpaperExportFile[]> => {
  const pushLine = (level: ExportProgressLevel, text: string) => {
    options?.onProgressLine?.({ level, text });
  };

  const wallpaperKeys = Array.isArray(selectElements?.wallpaper)
    ? selectElements.wallpaper
        .map((key: unknown) => String(key))
        .filter(Boolean)
    : [];

  if (!wallpaperKeys.length) {
    pushLine('info', 'selectElements.wallpaper 为空，跳过 wallpaper 资源收集');
    return [];
  }

  const total = wallpaperKeys.length;
  pushLine('info', `开始收集关联 wallpaper 资源（${total} 个）...`);
  const result: WallpaperExportFile[] = [];

  for (let i = 0; i < wallpaperKeys.length; i += 1) {
    const elementKey = wallpaperKeys[i];
    const index = i + 1;
    pushLine('info', `收集 wallpaper: ${elementKey}`);
    const files = await collectWallpaperExportFiles(nodes, elementKey, options);
    if (!files?.length) {
      pushLine('warning', `wallpaper ${elementKey} 无可导出资源`);
      continue;
    }
    for (const file of files) {
      // 首套始终保持原名，与导入端「无后缀自成一套」对齐；其余仍是 _2 / _3 …
      const filename =
        i === 0 ? file.filename : withExportIndex(file.filename, index, total);
      result.push({ filename, blob: file.blob });
      pushLine('success', `wallpaper 资源: [${elementKey}] → ${filename}`);
    }
  }

  pushLine('info', `wallpaper 资源列表共 ${result.length} 个文件`);
  return result;
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
          if (!item.source) {
            pushLine('warning', `跳过 ${item.key}（未上传预览图）`);
            continue;
          }
          pushLine('info', `开始处理 ${item.key}...`);
          const previewBlob = await fetchSourceBlob(item.source);
          if (!previewBlob) {
            pushLine('warning', `跳过 ${item.key}（预览图读取失败）`);
            continue;
          }
          // 扩展名跟随上传内容，不再按 isGif 二选一
          const filename = `${item.key}.${resolveSourceExt(item.source, previewBlob)}`;
          zip.file(filename, previewBlob);
          pushLine('success', `生成 ${filename}`);
        }

        // selectElements 关联资源：icon / widget / wallpaper 写入 zip
        const selectElements = resolveThemeSelectElements(rootNode, nodes);
        const iconAssets = await collectThemeIconPackAssets(
          nodes,
          selectElements,
          options,
        );
        for (const file of iconAssets) {
          zip.file(file.filename, file.blob);
          pushLine('success', `写入 zip: ${file.filename}`);
        }

        const widgetAssets = await collectThemeWidgetAssets(
          nodes,
          selectElements,
          options,
        );
        for (const file of widgetAssets) {
          zip.file(file.filename, file.blob);
          pushLine('success', `写入 zip: ${file.filename}`);
        }

        const wallpaperAssets = await collectThemeWallpaperAssets(
          nodes,
          selectElements,
          options,
        );
        for (const file of wallpaperAssets) {
          zip.file(file.filename, file.blob);
          pushLine('success', `写入 zip: ${file.filename}`);
        }

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
