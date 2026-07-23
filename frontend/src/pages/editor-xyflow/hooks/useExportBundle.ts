import { useMemo } from 'react';
import { useEditorNodes } from '../context';
import {
  resolveExportCategory,
  type ExportBundleApi,
} from './exportBundleShared';
import { useWidgetExportBundle } from './useWidgetExportBundle';
import { useIconPackExportBundle } from './useIconPackExportBundle';
import { useWallpaperExportBundle } from './useWallpaperExportBundle';
import { useThemeExportBundle } from './useThemeExportBundle';

const DEFAULT_EXPORT_CATEGORY = 'widget';

/**
 * 统一导出入口：根据选中节点所属根 category 分发到对应导出器。
 * ActionPopover 等调用方只依赖本 hook，不必写死类型分支。
 *
 * 新增类型：
 * 1. 实现 useXxxExportBundle
 * 2. 下方无条件调用该 hook（React hooks 规则）
 * 3. 写入 byCategory
 */
export const useExportBundle = (nodeId?: string): ExportBundleApi & {
  category: string;
} => {
  const nodes = useEditorNodes();
  const category = useMemo(
    () => resolveExportCategory(nodes, nodeId),
    [nodes, nodeId],
  );

  // 必须无条件调用所有已注册 hook（React hooks 规则）
  const widgetExport = useWidgetExportBundle(
    category === 'widget' ? nodeId : undefined,
  );
  const iconPackExport = useIconPackExportBundle(
    category === 'iconpack' ? nodeId : undefined,
  );
  const wallpaperExport = useWallpaperExportBundle(
    category === 'wallpaper' ? nodeId : undefined,
  );
  const themeExport = useThemeExportBundle(
    category === 'theme' ? nodeId : undefined,
  );

  const byCategory: Record<string, ExportBundleApi> = {
    widget: widgetExport,
    iconpack: iconPackExport,
    wallpaper: wallpaperExport,
    theme: themeExport,
  };

  const active =
    byCategory[category] ??
    byCategory[DEFAULT_EXPORT_CATEGORY] ??
    widgetExport;

  return {
    category,
    exporting: active.exporting,
    exportBundle: active.exportBundle,
  };
};

/** 供外部查看当前已注册的导出 category */
export const listRegisteredExportCategories = () => [
  'widget',
  'iconpack',
  'wallpaper',
  'theme',
];
