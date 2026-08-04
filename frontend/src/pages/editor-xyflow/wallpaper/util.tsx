import { nanoid } from 'nanoid';
import type { Node as FlowNode } from '@xyflow/react';
import { DEFAULT_CROP_PROPS } from '../widget/base-config';

const GAP = 50;
const DEFAULT_WALLPAPER_WIDTH = 887;
const DEFAULT_WALLPAPER_HEIGHT = 1920;
const WALLPAPERTYPE_SYSTEM:any = {
    "0": 'common',
    "1": "ios",
    "2": "ios",
};

const getNodeData = (node?: FlowNode | null) =>
  ((node?.data as Record<string, any> | undefined) ?? {}) as Record<string, any>;

const isWallpaperItem = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** 读取 config 中所有壁纸条目：wallpaper / wallpaper_ipad / 其它自定义 key */
const getWallpaperEntries = (
  config: Record<string, any> | null | undefined,
): Array<{ key: string; item: Record<string, any> }> => {
  if (!config || typeof config !== 'object') return [];
  return Object.entries(config)
    .filter(([, value]) => isWallpaperItem(value))
    .map(([key, item]) => ({ key, item: item as Record<string, any> }));
};

export const wallpaperConfig2Nodes: any = (config: any, elementKey?: any) => {
  const entries = getWallpaperEntries(config);
  if (!entries.length) {
    return { nodes: [], rootNode: null };
  }

  const rootGroupId = elementKey || nanoid();
  const childNodes: any[] = [];
  let cursorX = GAP;
  let maxPlatformHeight = 0;
  const wallpaperType:any = Number(config?.wallpaperType ?? 0) || 0;

  entries.forEach(({ key, item }) => {
    const width = Number(item.width) || DEFAULT_WALLPAPER_WIDTH;
    const height = Number(item.height) || DEFAULT_WALLPAPER_HEIGHT;
    const platformGroupId = `${nanoid()}_${key}`;
    const platformWidth = width + GAP * 2;
    const platformHeight = height + GAP * 2;
    maxPlatformHeight = Math.max(maxPlatformHeight, platformHeight);

    childNodes.push({
      id: platformGroupId,
      type: 'platform_group',
      className: 'widget-group-node',
      position: { x: cursorX, y: GAP },
      data: {
        label: WALLPAPERTYPE_SYSTEM[wallpaperType],
        themekitType: key,
      },
      parentId: rootGroupId,
      extent: 'parent',
      draggable: false,
    //   selectable: false,
      connectable: false,
      focusable: false,
      zIndex: 10,
      style: {
        width: platformWidth,
        height: platformHeight,
        background: '#eef3ff',
        border: '1px solid #dfe5ff',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(63, 93, 255, 0.06)',
      },
    });

    childNodes.push({
      id: nanoid(),
      type: 'wallpaper',
      data: {
        ...item,
        key,
        name: item.name || key,
        source: item.source || '',
        width,
        height,
        crop_props: item.crop_props || DEFAULT_CROP_PROPS,
      },
      position: { x: GAP, y: GAP },
      parentId: platformGroupId,
      extent: 'parent',
      draggable: false,
      selectable: false,
      connectable: false,
      focusable: false,
      style: {
        border: '2px solid transparent',
      },
    });

    cursorX += platformWidth + GAP;
  });

  const rootWidth = cursorX;
  const rootHeight = maxPlatformHeight + GAP * 2;

  const rootNode = {
    id: rootGroupId,
    type: 'group',
    deleteable: true,
    position: { x: 0, y: 0 },
    data: {
      category: 'wallpaper',
      wallpaperType: wallpaperType,
    },
    packable: true,
    draggable: false,
    connectable: false,
    focusable: false,
    zIndex: 1,
    style: {
      width: rootWidth,
      height: rootHeight,
      background: '#f5f7ff',
      border: '1px solid #b4c0ff',
      borderRadius: 16,
    },
  };

  return {
    nodes: [rootNode, ...childNodes],
    rootNode,
  };
};

/** 从当前 nodes 组装 wallpaper 的 config_json（按 platform label 还原各尺寸） */
export const buildWallpaperConfigJson = (
  rootNode: FlowNode,
  nodes: FlowNode[],
): Record<string, any> => {
  const platformNodes = nodes
    .filter(
      (node) =>
        node.type === 'platform_group' && node.parentId === rootNode.id,
    )
    .sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));

  const rootData = getNodeData(rootNode);
  const config: Record<string, any> = {
    ...rootData,
  };
  platformNodes.forEach((platformNode) => {
    const platformData = getNodeData(platformNode);
    const key = String(platformData.themekitType || platformData.label || 'wallpaper');
    const wallpaperNode = nodes.find(
      (node) => node.type === 'wallpaper' && node.parentId === platformNode.id,
    );
    const data = getNodeData(wallpaperNode);
    const width = Number(data.width) || DEFAULT_WALLPAPER_WIDTH;
    const height = Number(data.height) || DEFAULT_WALLPAPER_HEIGHT;

    config[key] = {
      source: data.source ?? '',
      name: data.name || key,
      width,
      height,
      crop_props: data.crop_props || DEFAULT_CROP_PROPS,
      ...(data.ext ? { ext: data.ext } : {}),
    };
  });

  return config;
};
