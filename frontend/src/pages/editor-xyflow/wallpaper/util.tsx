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
    "6": "ios",
    "7": "ios",
    "8": "ios",
};
const WALLPAPERTYPE_COMPONENTS:any = {
    "0": 'wallpaper',
    "1": "wallpaper",
    "2": "wallpaper",
    "6": "wallpaper",
    "7": "wallpaper",
    "8": "wallpaper",
    "3": "live_wallpaper",
    "4": "live_wallpaper",
    "5": "lottie_wallpaper",
};

const WALLPAPERTYPE_NAME:any = {
  "0": 'normal_wallpaper',
  "1": "photo_shuffle",
  "2": "depth_wallpaper",
  "3": "live_wallpaper",
  "4": "live_wallpaper",
  "5": "diy_live_wallpaper",
  "6": "contact_poster",
  "7": "dynamicisland_wallpaper",
  "8": "chat_wallpaper",
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

type WallpaperEntry = { key: string; item: Record<string, any> };

/**
 * Photo Shuffle：按序号配对成行
 * wallpaper_1 | wallpaper_ipad_1
 * wallpaper_2 | wallpaper_ipad_2
 * ...
 * 预览 wallpaper_preview | wallpaper_preview_ipad 放最后一行
 */
const buildPhotoShuffleRows = (entries: WallpaperEntry[]): WallpaperEntry[][] => {
  const byKey = new Map(entries.map((entry) => [entry.key, entry]));
  const indices = new Set<number>();

  entries.forEach(({ key }) => {
    const phoneMatch = /^wallpaper_(\d+)$/.exec(key);
    const ipadMatch = /^wallpaper_ipad_(\d+)$/.exec(key);
    if (phoneMatch) indices.add(Number(phoneMatch[1]));
    if (ipadMatch) indices.add(Number(ipadMatch[1]));
  });

  const rows: WallpaperEntry[][] = [];
  [...indices]
    .sort((a, b) => a - b)
    .forEach((index) => {
      const row: WallpaperEntry[] = [];
      const phoneKey = `wallpaper_${index}`;
      const ipadKey = `wallpaper_ipad_${index}`;
      const phone = byKey.get(phoneKey);
      const ipad = byKey.get(ipadKey);
      if (phone) {
        row.push(phone);
        byKey.delete(phoneKey);
      }
      if (ipad) {
        row.push(ipad);
        byKey.delete(ipadKey);
      }
      if (row.length) rows.push(row);
    });

  const previewRow: WallpaperEntry[] = [];
  (['wallpaper_preview', 'wallpaper_preview_ipad'] as const).forEach((key) => {
    const entry = byKey.get(key);
    if (!entry) return;
    previewRow.push(entry);
    byKey.delete(key);
  });
  if (previewRow.length) rows.push(previewRow);

  // 未识别 key 各自独占一行，避免漏掉
  byKey.forEach((entry) => {
    rows.push([entry]);
  });

  return rows;
};

export const wallpaperConfig2Nodes: any = (config: any, elementKey?: any) => {
  const entries = getWallpaperEntries(config);
  if (!entries.length) {
    return { nodes: [], rootNode: null };
  }

  const rootGroupId = elementKey || nanoid();
  const childNodes: any[] = [];
  const wallpaperType: any = Number(config?.wallpaperType ?? 0) || 0;

  const appendEntry = (
    entry: WallpaperEntry,
    position: { x: number; y: number },
  ) => {
    const width = Number(entry.item.width) || DEFAULT_WALLPAPER_WIDTH;
    const height = Number(entry.item.height) || DEFAULT_WALLPAPER_HEIGHT;
    const platformGroupId = `${nanoid()}_${entry.key}`;
    const platformWidth = width + GAP * 2;
    const platformHeight = height + GAP * 2;

    childNodes.push({
      id: platformGroupId,
      type: 'platform_group',
      className: 'widget-group-node',
      position,
      data: {
        wallpaperTypeName: WALLPAPERTYPE_NAME[wallpaperType],
        label: WALLPAPERTYPE_SYSTEM[wallpaperType],
        themekitType: entry.key,
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
        ...entry.item,
        key: entry.key,
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

    return { platformWidth, platformHeight };
  };

  let rootWidth = GAP;
  let rootHeight = GAP;

  if (wallpaperType === 1) {
    // Photo Shuffle：每行 phone_i + ipad_i，再换行
    const rows = buildPhotoShuffleRows(entries);
    let cursorY = GAP;

    rows.forEach((row) => {
      let cursorX = GAP;
      let rowHeight = 0;

      row.forEach((entry) => {
        const { platformWidth, platformHeight } = appendEntry(entry, {
          x: cursorX,
          y: cursorY,
        });
        cursorX += platformWidth + GAP;
        rowHeight = Math.max(rowHeight, platformHeight);
      });

      rootWidth = Math.max(rootWidth, cursorX);
      cursorY += rowHeight + GAP;
    });

    rootHeight = cursorY;
  } else {
    // 其它类型：保持原逻辑，同一行从左往右排
    let cursorX = GAP;
    let maxPlatformHeight = 0;

    entries.forEach((entry) => {
      const { platformWidth, platformHeight } = appendEntry(entry, {
        x: cursorX,
        y: GAP,
      });
      cursorX += platformWidth + GAP;
      maxPlatformHeight = Math.max(maxPlatformHeight, platformHeight);
    });

    rootWidth = cursorX;
    rootHeight = maxPlatformHeight + GAP * 2;
  }

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
    .sort((a, b) => {
      const dy = (a.position?.y ?? 0) - (b.position?.y ?? 0);
      if (dy !== 0) return dy;
      return (a.position?.x ?? 0) - (b.position?.x ?? 0);
    });

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
