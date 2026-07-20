import type { Node as FlowNode } from '@xyflow/react';
import { DEFAULT_CROP_PROPS } from '../widget/base-config';

type SerializeCtx = {
  rootNode: FlowNode;
  nodes: FlowNode[];
  platformGroups: FlowNode[];
};

type SectionSerializer = (ctx: SerializeCtx) => Record<string, any> | undefined;

const PLATFORM_META_KEYS = new Set(['label', 'themekitType']);

const getNodeData = (node?: FlowNode | null) =>
  ((node?.data as Record<string, any> | undefined) ?? {}) as Record<string, any>;

const findPlatformGroup = (
  groups: FlowNode[],
  label: string,
  idSuffix?: string,
) =>
  groups.find((node) => getNodeData(node).label === label) ??
  (idSuffix
    ? groups.find((node) => String(node.id).endsWith(idSuffix))
    : undefined);

const omitPlatformMeta = (data: Record<string, any>) => {
  const next: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    if (PLATFORM_META_KEYS.has(key)) return;
    next[key] = data[key];
  });
  return next;
};

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
 * widget 类分组通用序列化：platform_group + metaable children → { ...platformData, sizes }
 * 新增同类配置（如未来其它 layout）只需注册一项。
 */
const createMetaableSectionSerializer = (options: {
  configKey: string;
  label: string;
  idSuffix?: string;
}): SectionSerializer => {
  return ({ nodes, platformGroups }) => {
    const group = findPlatformGroup(
      platformGroups,
      options.label,
      options.idSuffix,
    );
    if (!group) return undefined;

    const platformData = omitPlatformMeta(getNodeData(group));
    const sizes = nodes
      .filter((node: any) => node.parentId === group.id && node.metaable)
      .map((node) => ({ ...getNodeData(node) }))
      .sort((a, b) => Number(a.size ?? 0) - Number(b.size ?? 0));

    return {
      [options.configKey]: {
        ...platformData,
        sizes,
      },
    };
  };
};

/** preview：支持多个桌面预览（4×3 / 4×8 等），序列化为数组 */
const serializePreview: SectionSerializer = ({
  rootNode,
  nodes,
  platformGroups,
}) => {
  const previewGroups = platformGroups.filter(
    (node) =>
      getNodeData(node).label === 'preview' ||
      String(node.id).includes('_preview'),
  );
  const groupIds = new Set(previewGroups.map((node) => String(node.id)));
  const groupX = new Map(
    previewGroups.map((node) => [String(node.id), Number(node.position?.x ?? 0)]),
  );

  const previewNodes = nodes
    .filter((node) => {
      if (node.type !== 'preview') return false;
      if (groupIds.size > 0) return groupIds.has(String(node.parentId));
      return node.parentId === rootNode.id;
    })
    .sort(
      (a, b) =>
        (groupX.get(String(a.parentId)) ?? 0) -
        (groupX.get(String(b.parentId)) ?? 0),
    );

  if (!previewNodes.length) return undefined;

  const preview = previewNodes.map((previewNode) => {
    const data = getNodeData(previewNode);
    return {
      name: data.name ?? 'short_preview',
      targetElementKeys: Array.isArray(data.targetElementKeys)
        ? data.targetElementKeys
        : [rootNode.id],
      desketopShow: Array.isArray(data.desketopShow) ? data.desketopShow : [],
      row: Number(data.row) > 0 ? Number(data.row) : undefined,
      col: Number(data.col) > 0 ? Number(data.col) : undefined,
      size: Array.isArray(data.size) ? data.size : undefined,
    };
  });

  return { preview };
};

/**
 * iconpack config_json 分段序列化器。
 * 新增类型：往数组追加一个 serializer 即可。
 */
const ICONPACK_SECTION_SERIALIZERS: SectionSerializer[] = [
  serializeApps,
  createMetaableSectionSerializer({
    configKey: 'pureImage',
    label: 'pureImage',
    idSuffix: '_pureImage',
  }),
  serializePreview,
  // 例：未来其它 metaable 分组
  // createMetaableSectionSerializer({ configKey: 'xxx', label: 'xxx', idSuffix: '_xxx' }),
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
