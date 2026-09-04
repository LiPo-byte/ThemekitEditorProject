import { nanoid } from 'nanoid';
import type { Node as FlowNode } from '@xyflow/react';
import { DEFAULT_CROP_PROPS } from '../widget/base-config';
import {
  PLATFORM_GROUP_STYLE,
  ROOT_GROUP_STYLE,
} from '../util/groupNodeStyle';

const GAP = 50;
const DEFAULT_WALLPAPER_WIDTH = 887;
const DEFAULT_WALLPAPER_HEIGHT = 1920;
const WALLPAPERTYPE_SYSTEM:any = {
    "0": 'common',
    "1": "ios",
    "2": "ios",
    "3": "ios",
    "4": "android",
    "5": "common",
};
const WALLPAPERTYPE_COMPONENTS:any = {
    "0": 'wallpaper',
    "1": "wallpaper",
    "2": "wallpaper",
    "3": "live_wallpaper",
    "4": "live_wallpaper",
    "5": "lottie_wallpaper",
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
        ...PLATFORM_GROUP_STYLE.wallpaper,
      },
    });

    childNodes.push({
      id: nanoid(),
      type: WALLPAPERTYPE_COMPONENTS[wallpaperType],
      data: {
        ...item,
        key,
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
      ...ROOT_GROUP_STYLE.wallpaper,
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
    const liveWallpaperNode = nodes.find(
      (node) => node.type === 'live_wallpaper' && node.parentId === platformNode.id,
    );
    const diyliveWallpaperNode = nodes.find(
      (node) => node.type === 'lottie_wallpaper' && node.parentId === platformNode.id,
    );
    const liveWallpaperData = getNodeData(liveWallpaperNode);
    const data = getNodeData(wallpaperNode);
    const diyliveWallpaperData = getNodeData(diyliveWallpaperNode)
    config[key] = {
      ...data,
      ...liveWallpaperData,
      ...diyliveWallpaperData,
    };
  });

  return config;
};
