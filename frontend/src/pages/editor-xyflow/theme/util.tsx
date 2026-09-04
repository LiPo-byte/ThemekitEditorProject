import { nanoid } from 'nanoid';
import type { Node as FlowNode } from '@xyflow/react';
import { DEFAULT_THEME_CONFIG } from '@/editor-core/defaultConfig';
import { resolveShowElements } from './resolveShowElements';
import {
  PLATFORM_GROUP_STYLE,
  ROOT_GROUP_STYLE,
} from '../util/groupNodeStyle';

const GAP = 50;

const getNodeData = (node?: FlowNode | null) =>
  ((node?.data as Record<string, any> | undefined) ?? {}) as Record<string, any>;


const isThemeSurfaceItem = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** 读取 theme config 中各预览面：key 即 node type */
const getThemeSurfaceEntries = (
  config: Record<string, any> | null | undefined,
): Array<{ key: string; item: Record<string, any> }> => {
  if (!config || typeof config !== 'object') return [];
  return Object.entries(config)
    .filter(([key, value]) => key !== 'selectElements' && isThemeSurfaceItem(value))
    .map(([key, item]) => ({ key, item: item as Record<string, any> }));
};

export const themeConfig2Nodes: any = (config: any, elementKey?: any) => {
  const source = config || DEFAULT_THEME_CONFIG;
  const entries = getThemeSurfaceEntries(source);
  if (!entries.length) {
    return { nodes: [], rootNode: null };
  }

  const rootGroupId = elementKey || nanoid();
  const childNodes: any[] = [];
  let cursorX = GAP;
  let maxPlatformHeight = 0;

  entries.forEach(({ key, item }) => {
    const width = Number(item.width) || 887;
    const height = Number(item.height) || 1920;
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
        label: 'common',
        themekitType: key,
      },
      parentId: rootGroupId,
      extent: 'parent',
      draggable: false,
      selectable: false,
      connectable: false,
      focusable: false,
      zIndex: 10,
      style: {
        width: platformWidth,
        height: platformHeight,
        ...PLATFORM_GROUP_STYLE.theme,
      },
    });

    childNodes.push({
      id: nanoid(),
      type: key,
      data: {
        ...item,
        key,
        name: item.name || key,
        width,
        height,
        // 预览图直接上传；老 config 无该字段时兜底，右侧面板才会出现上传框
        source: item.source ?? '',
        selectElements: source.selectElements,
        // showElements: Array.isArray(item.showElements) ? item.showElements : [],
      },
      position: { x: GAP, y: GAP },
      parentId: platformGroupId,
      extent: 'parent',
      draggable: false,
      // selectable: false,
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
    packable: true,
    position: { x: 0, y: 0 },
    data: {
      category: 'theme',
    },
    draggable: false,
    connectable: false,
    focusable: false,
    zIndex: 1,
    style: {
      width: cursorX,
      height: maxPlatformHeight + GAP * 2,
      ...ROOT_GROUP_STYLE.theme,
    },
  };

  return {
    nodes: [rootNode, ...childNodes],
    rootNode,
  };
};

/** 从当前 nodes 组装 theme 的 config_json（按 platform label 还原各预览面） */
export const buildThemeConfigJson = (
  rootNode: FlowNode,
  nodes: FlowNode[],
  sourceConfigMap?: Record<string, any> | null,
): Record<string, any> => {
  const platformNodes = nodes
    .filter(
      (node) =>
        node.type === 'platform_group' && node.parentId === rootNode.id,
    )
    .sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));

  const config: Record<string, any> = {};
  let selectElements = {};

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
    const defaults =
      (DEFAULT_THEME_CONFIG as Record<string, any>)[key] &&
      typeof (DEFAULT_THEME_CONFIG as Record<string, any>)[key] === 'object'
        ? (DEFAULT_THEME_CONFIG as Record<string, any>)[key]
        : {};

    const { key: _key, ...rest } = data;
    if (data.selectElements) {
        selectElements = data.selectElements
    }
    const rawShowElements = Array.isArray(data.showElements) ? data.showElements : [];
    config[key] = {
      ...defaults,
      ...rest,
      name: data.name || key,
      width: Number(data.width) > 0 ? Number(data.width) : Number(defaults.width) || 887,
      height:
        Number(data.height) > 0 ? Number(data.height) : Number(defaults.height) || 1920,
      // 保存时按源组件写回最新 data
      showElements: resolveShowElements(rawShowElements, sourceConfigMap),
    };
  });
  config.selectElements = selectElements;

  return config;
};
