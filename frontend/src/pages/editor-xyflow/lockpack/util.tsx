import type { Node as FlowNode } from '@xyflow/react';
import { nanoid } from 'nanoid';
import { DEFAULT_LOCKPACK_CONFIG } from '@/editor-core/defaultConfig';
import { resolveShowElements } from '../theme/resolveShowElements';
import { PLATFORM_GROUP_STYLE, ROOT_GROUP_STYLE } from '../util/groupNodeStyle';

const GAP = 50;

/**
 * 预览面的 config key 与画布节点 type 不同名：theme 的节点 type 直接用了
 * preview_long / preview_short / list_view，锁屏包这边加 lockpack_ 前缀避开撞名，
 * 导出时再按 config key 落成 preview_long.jpg 这样的文件名。
 */
export const LOCKPACK_SURFACE_KEYS = [
  'preview_long',
  'preview_short',
  'list_view',
] as const;

export const getLockpackSurfaceNodeType = (key: string) => `lockpack_${key}`;

const getNodeData = (node?: FlowNode | null) =>
  ((node?.data as Record<string, any> | undefined) ?? {}) as Record<
    string,
    any
  >;

const isSurfaceItem = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** 按 LOCKPACK_SURFACE_KEYS 的顺序取预览面，config 里没有的面跳过 */
const getSurfaceEntries = (
  config: Record<string, any> | null | undefined,
): Array<{ key: string; item: Record<string, any> }> => {
  if (!config || typeof config !== 'object') return [];
  return LOCKPACK_SURFACE_KEYS.filter((key) => isSurfaceItem(config[key])).map(
    (key) => ({ key, item: config[key] as Record<string, any> }),
  );
};

export const lockpackConfig2Nodes: any = (config: any, elementKey?: any) => {
  const source = config || DEFAULT_LOCKPACK_CONFIG;
  const entries = getSurfaceEntries(source);
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
        // 锁屏包只有 iOS 一个平台，与 lockwidget 的 platform_group 保持一致
        label: 'ios',
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
        ...PLATFORM_GROUP_STYLE.lockpack,
      },
    });

    childNodes.push({
      id: nanoid(),
      type: getLockpackSurfaceNodeType(key),
      data: {
        ...item,
        key,
        name: item.name || key,
        width,
        height,
        // 预览图直接上传；老 config 无该字段时兜底，右侧面板才会出现上传框
        source: item.source ?? '',
        selectElements: source.selectElements,
      },
      position: { x: GAP, y: GAP },
      parentId: platformGroupId,
      extent: 'parent',
      draggable: false,
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
      category: 'lockpack',
    },
    draggable: false,
    connectable: false,
    focusable: false,
    zIndex: 1,
    style: {
      width: cursorX,
      height: maxPlatformHeight + GAP * 2,
      ...ROOT_GROUP_STYLE.lockpack,
    },
  };

  return {
    nodes: [rootNode, ...childNodes],
    rootNode,
  };
};

/** 从当前 nodes 组装 lockpack 的 config_json（按 platform 的 themekitType 还原各预览面） */
export const buildLockpackConfigJson = (
  rootNode: FlowNode,
  nodes: FlowNode[],
  sourceConfigMap?: Record<string, any> | null,
): Record<string, any> => {
  const platformNodes = nodes
    .filter(
      (node) => node.type === 'platform_group' && node.parentId === rootNode.id,
    )
    .sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));

  const config: Record<string, any> = {};
  let selectElements = {};

  platformNodes.forEach((platformNode) => {
    const platformData = getNodeData(platformNode);
    const key = String(platformData.themekitType || '');
    if (!key) return;

    const nodeType = getLockpackSurfaceNodeType(key);
    const surfaceNode = nodes.find(
      (node) =>
        node.parentId === platformNode.id &&
        (node.type === nodeType || String(getNodeData(node).key ?? '') === key),
    );
    const data = getNodeData(surfaceNode);
    const defaults =
      (DEFAULT_LOCKPACK_CONFIG as Record<string, any>)[key] &&
      typeof (DEFAULT_LOCKPACK_CONFIG as Record<string, any>)[key] === 'object'
        ? (DEFAULT_LOCKPACK_CONFIG as Record<string, any>)[key]
        : {};

    const { key: _key, ...rest } = data;
    if (data.selectElements) {
      selectElements = data.selectElements;
    }
    const rawShowElements = Array.isArray(data.showElements)
      ? data.showElements
      : [];
    config[key] = {
      ...defaults,
      ...rest,
      name: data.name || key,
      width:
        Number(data.width) > 0
          ? Number(data.width)
          : Number(defaults.width) || 887,
      height:
        Number(data.height) > 0
          ? Number(data.height)
          : Number(defaults.height) || 1920,
      // 保存时按源组件写回最新 data
      showElements: resolveShowElements(rawShowElements, sourceConfigMap),
    };
  });
  config.selectElements = selectElements;

  return config;
};
