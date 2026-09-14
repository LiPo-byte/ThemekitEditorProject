import type { Node as FlowNode } from '@xyflow/react';
import { nanoid } from 'nanoid';
import {
  PLATFORM_GROUP_STYLE,
  ROOT_GROUP_STYLE,
} from '../util/groupNodeStyle';

const GAP = 50;
/** 与端上充电动画画布一致，preview / mp4 共用同一套尺寸 */
const DEFAULT_WIDTH = 886;
const DEFAULT_HEIGHT = 1920;

/**
 * config 里会画到画布上的条目，顺序就是左右顺序。
 * origin / style / calendar 挂在根节点 data，不单独成格。
 */
const CHARGING_ITEM_KEYS = ['preview', 'charging_wallpaper'] as const;

const getNodeData = (node?: FlowNode | null) =>
  ((node?.data as Record<string, any> | undefined) ?? {}) as Record<string, any>;

export const chargingAnimationConfig2Nodes: any = (
  config: any,
  elementKey?: any,
) => {
  const entries = CHARGING_ITEM_KEYS.filter(
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
    const width = Number(item.width) || DEFAULT_WIDTH;
    const height = Number(item.height) || DEFAULT_HEIGHT;
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
        ...PLATFORM_GROUP_STYLE.charging_animation,
      },
    });

    childNodes.push({
      id: nanoid(),
      type: 'charging_animation',
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
      category: 'charging_animation',
      name: config?.name ?? 'Charging_Animation',
      origin: config?.origin,
      style: config?.style,
      calendar: config?.calendar,
    },
    packable: true,
    draggable: false,
    connectable: false,
    focusable: false,
    zIndex: 1,
    style: {
      width: cursorX,
      height: maxPlatformHeight + GAP * 2,
      ...ROOT_GROUP_STYLE.charging_animation,
    },
  };

  return {
    nodes: [rootNode, ...childNodes],
    rootNode,
  };
};

/** 从当前 nodes 组装 charging_animation 的 config_json */
export const buildChargingAnimationConfigJson = (
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
      platformData.themekitType || platformData.label || 'preview',
    );
    const mediaNode = nodes.find(
      (node) =>
        node.type === 'charging_animation' &&
        node.parentId === platformNode.id,
    );
    config[key] = { ...getNodeData(mediaNode) };
  });

  return config;
};
