import type { Node as FlowNode } from '@xyflow/react';
import { IconPackDefaultConfig } from '@/editor-core/defaultConfig';
import { DEFAULT_CROP_PROPS } from '../widget/base-config';

type SerializeCtx = {
  rootNode: FlowNode;
  nodes: FlowNode[];
  platformGroups: FlowNode[];
};

type SectionSerializer = (ctx: SerializeCtx) => Record<string, any> | undefined;

const getNodeData = (node?: FlowNode | null) =>
  ((node?.data as Record<string, any> | undefined) ?? {}) as Record<string, any>;

const findPlatformGroup = (groups: FlowNode[], label: string) =>
  groups.find((node) => getNodeData(node).label === label);

/** apps：icon 节点 → Record<key, appItem> */
const serializeApps: SectionSerializer = ({ rootNode, nodes, platformGroups }) => {
  const group = findPlatformGroup(platformGroups, 'iconpack');
  const parentId = group?.id ?? rootNode.id;
  const iconNodes = nodes.filter(
    (node) => node.type === 'icon' && node.parentId === parentId,
  );

  const apps: Record<string, any> = {};
  iconNodes.forEach((node, index) => {
    const data = getNodeData(node);
    const key = String(data.key ?? data.name ?? node.id ?? index);
    apps[key] = {
      name: data.name ?? key,
      source: data.source ?? '',
      crop_props: data.crop_props ?? DEFAULT_CROP_PROPS,
      radius: typeof data.radius === 'number' ? data.radius : undefined,
    };
  });

  return { apps };
};

/**
 * 预览面：preview_long / preview_short / list_view 等
 * platform_group.label === key，子节点 type === key
 */
const serializeSurfaces: SectionSerializer = ({ nodes, platformGroups }) => {
  const defaults = IconPackDefaultConfig as Record<string, any>;
  const groups = [...platformGroups]
    .filter((node) => getNodeData(node).label !== 'iconpack')
    .sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));

  const surfaces: Record<string, any> = {};
  groups.forEach((platformNode) => {
    const platformData = getNodeData(platformNode);
    const key = String(platformData.label || platformData.themekitType || '');
    if (!key) return;

    const surfaceNode = nodes.find(
      (node) =>
        node.parentId === platformNode.id &&
        (node.type === key || String(getNodeData(node).key ?? '') === key),
    );
    if (!surfaceNode) return;

    const data = getNodeData(surfaceNode);
    const surfaceDefaults =
      defaults[key] && typeof defaults[key] === 'object' ? defaults[key] : {};
    const { key: _key, ...rest } = data;

    surfaces[key] = {
      ...surfaceDefaults,
      ...rest,
      name: data.name || key,
      width:
        Number(data.width) > 0
          ? Number(data.width)
          : Number(surfaceDefaults.width) || 887,
      height:
        Number(data.height) > 0
          ? Number(data.height)
          : Number(surfaceDefaults.height) || 1920,
      selectElements:
        data.selectElements && typeof data.selectElements === 'object'
          ? data.selectElements
          : surfaceDefaults.selectElements || { apps: [] },
      showElements: Array.isArray(data.showElements) ? data.showElements : [],
    };
  });

  return Object.keys(surfaces).length ? surfaces : undefined;
};

/**
 * iconpack config_json 分段序列化器。
 * 新增类型：往数组追加一个 serializer 即可。
 */
const ICONPACK_SECTION_SERIALIZERS: SectionSerializer[] = [
  serializeApps,
  serializeSurfaces,
];

/** 从当前 nodes 组装 iconpack 的 config_json */
export const buildIconPackConfigJson = (
  rootNode: FlowNode,
  nodes: FlowNode[],
): Record<string, any> => {
  const platformGroups = nodes.filter(
    (node) => node.type === 'platform_group' && node.parentId === rootNode.id,
  );
  const ctx: SerializeCtx = { rootNode, nodes, platformGroups };

  return ICONPACK_SECTION_SERIALIZERS.reduce<Record<string, any>>(
    (config, serialize) => {
      const partial = serialize(ctx);
      if (!partial) return config;
      return { ...config, ...partial };
    },
    {},
  );
};
