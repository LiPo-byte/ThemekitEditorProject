import type { Node as FlowNode } from '@xyflow/react';
import { nanoid } from 'nanoid';
import {
  PLATFORM_GROUP_STYLE,
  ROOT_GROUP_STYLE,
} from '../util/groupNodeStyle';

const GAP = 50;
const DEFAULT_STICKER_SIZE = 450;
const DEFAULT_LIST_VIEW_SIZE = 192;

/**
 * config 里会被画到画布上的条目，顺序就是画布上的左右顺序。
 * 普通 sticker 只有 sticker 一项，gif 多一个 192×192 的 list_view。
 */
const STICKER_ITEM_KEYS = ['sticker', 'list_view'] as const;

const DEFAULT_ITEM_SIZE: Record<string, number> = {
  sticker: DEFAULT_STICKER_SIZE,
  list_view: DEFAULT_LIST_VIEW_SIZE,
};

const getNodeData = (node?: FlowNode | null) =>
  ((node?.data as Record<string, any> | undefined) ?? {}) as Record<string, any>;

export const isGifStickerConfig = (config: any) => Boolean(config?.sticker_gif);

export const stickerConfig2Nodes: any = (config: any, elementKey?: any) => {
  const entries = STICKER_ITEM_KEYS.filter(
    (key) => config?.[key] && typeof config[key] === 'object',
  ).map((key) => ({ key, item: config[key] as Record<string, any> }));
  if (!entries.length) {
    return { nodes: [], rootNode: null };
  }

  const rootGroupId = elementKey || nanoid();
  const childNodes: any[] = [];
  let cursorX = GAP;
  let maxPlatformHeight = 0;

  entries.forEach(({ key, item }) => {
    // 宽高正常写在各条目里，顶层那一层是给「宽高写在顶层」的外部 config 兜底
    const fallbackSize = DEFAULT_ITEM_SIZE[key] ?? DEFAULT_STICKER_SIZE;
    const width =
      Number(item.width) || Number(config?.width) || fallbackSize;
    const height =
      Number(item.height) || Number(config?.height) || fallbackSize;
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
        label: key,
        themekitType: key,
      },
      parentId: rootGroupId,
      extent: 'parent',
      draggable: false,
      connectable: false,
      focusable: false,
      zIndex: 10,
      style: {
        width: platformWidth,
        height: platformHeight,
        ...PLATFORM_GROUP_STYLE.sticker,
      },
    });

    childNodes.push({
      id: nanoid(),
      type: 'sticker',
      data: {
        ...item,
        width,
        height,
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

  const rootNode = {
    id: rootGroupId,
    type: 'group',
    deleteable: true,
    position: { x: 0, y: 0 },
    data: {
      category: 'sticker',
      name: config?.name ?? 'sticker',
      sticker_gif: isGifStickerConfig(config),
    },
    packable: true,
    draggable: false,
    connectable: false,
    focusable: false,
    zIndex: 1,
    style: {
      width: cursorX,
      height: maxPlatformHeight + GAP * 2,
      ...ROOT_GROUP_STYLE.sticker,
    },
  };

  return {
    nodes: [rootNode, ...childNodes],
    rootNode,
  };
};

/** 从当前 nodes 组装 sticker 的 config_json（按 platform 上的 themekitType 还原条目 key） */
export const buildStickerConfigJson = (
  rootNode: FlowNode,
  nodes: FlowNode[],
): Record<string, any> => {
  const platformNodes = nodes
    .filter(
      (node) => node.type === 'platform_group' && node.parentId === rootNode.id,
    )
    .sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));

  const config: Record<string, any> = { ...getNodeData(rootNode) };
  platformNodes.forEach((platformNode) => {
    const platformData = getNodeData(platformNode);
    const key = String(
      platformData.themekitType || platformData.label || 'sticker',
    );
    const stickerNode = nodes.find(
      (node) => node.type === 'sticker' && node.parentId === platformNode.id,
    );
    config[key] = { ...getNodeData(stickerNode) };
  });

  return config;
};
