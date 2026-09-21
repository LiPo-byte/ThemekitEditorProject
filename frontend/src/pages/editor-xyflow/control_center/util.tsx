import type { Node as FlowNode } from '@xyflow/react';
import { nanoid } from 'nanoid';
import { ControlCenterDefaultConfig } from '@/editor-core/defaultConfig';
import { PLATFORM_GROUP_STYLE, ROOT_GROUP_STYLE } from '../util/groupNodeStyle';
import {
  CONTROL_CENTER_GROUP_ORDER,
  CONTROL_CENTER_SLOT_LABELS,
  type ControlCenterFileRole,
  type ControlCenterGroup,
  type ControlCenterSlotKind,
  getControlCenterSlot,
  resolveControlCenterGroup,
  resolveControlCenterSlot,
} from './asset-rules';

/** platform_group 的内边距，与 charging_animation 对齐 */
const GAP = 50;
/** config 里没写尺寸时的兜底边长 */
const FALLBACK_SIZE = 100;

const getNodeData = (node?: FlowNode | null) =>
  ((node?.data as Record<string, any> | undefined) ?? {}) as Record<
    string,
    any
  >;

type ConfigAsset = {
  source?: string;
  pagsource?: string;
  ext?: string;
  width?: number;
  height?: number;
};

type SourceItem = {
  key: string;
  /** 该文件在槽位里的角色，只有三级分组用得到，平铺布局不关心 */
  role?: ControlCenterFileRole;
  asset: ConfigAsset;
  width?: number;
  height?: number;
  x: number;
  y: number;
};

/** 组内素材之间的间距 */
const CELL_GAP = 24;
/** 右侧素材区的折行宽度，和左边整屏图的宽度接近，两栏才匀称 */
const MAX_ROW_WIDTH = 1300;
/** 同一行里高度相差超过这个倍数就拆行，免得小图吊在大图旁边 */
const MAX_ROW_HEIGHT_RATIO = 2;

/** 槽位内文件的摆放顺序，缺的 role 跳过 */
const ROLE_ORDER: ControlCenterFileRole[] = [
  'base',
  'select',
  'open',
  'close',
  'track',
  'fill',
  'thumb',
  'preview',
];

type SlotBucket = {
  /** 槽位 key，也是 CONTROL_CENTER_SLOT_LABELS 的索引 */
  slot: string;
  label: string;
  kind: ControlCenterSlotKind;
  items: SourceItem[];
};

/**
 * 三级分组：屏（group）→ 槽位（slot）→ 槽位内的文件。
 * 槽位由 resolveControlCenterSlot 按文件名后缀推出来，
 * 双态（base + select）、带开关动画（+ open/close）、滑条（track + fill + thumb）
 * 都会落在同一个槽位里，画布上就是一格。
 */
const createAssetsGroup = (assets: Record<string, ConfigAsset | undefined>) => {
  const grouped = new Map<ControlCenterGroup, Map<string, SlotBucket>>();
  Object.entries(assets).forEach(([key, asset]) => {
    if (!asset) return;
    // resolveControlCenterGroup 要认 preview.jpg 这种整名，后缀得拼回去
    const fileName = `${key}.${asset.ext ?? ''}`;
    const group = resolveControlCenterGroup(fileName);
    if (!group) return;
    const { slot, role } = resolveControlCenterSlot(fileName);
    const slots = grouped.get(group) ?? new Map<string, SlotBucket>();
    const bucket =
      slots.get(slot) ??
      ({
        slot,
        label: CONTROL_CENTER_SLOT_LABELS[slot] ?? slot,
        kind: getControlCenterSlot(slot)?.kind ?? 'image',
        items: [],
      } as SlotBucket);
    bucket.items.push({
      key,
      role,
      asset,
      width: Number(asset.width) || FALLBACK_SIZE,
      height: Number(asset.height) || FALLBACK_SIZE,
      x: 0,
      y: 0,
    });
    slots.set(slot, bucket);
    grouped.set(group, slots);
  });

  grouped.forEach((slots) => {
    slots.forEach((bucket) => {
      bucket.items.sort(
        (a, b) =>
          ROLE_ORDER.indexOf(a.role ?? 'base') -
          ROLE_ORDER.indexOf(b.role ?? 'base'),
      );
    });
  });

  return grouped;
};

/** 格子底部文件名那一行的高度 */
const LABEL_HEIGHT = 40;
/** 格子最小宽度，图标只有 90px 宽时下面那行文件名放不下 */
const MIN_CELL_WIDTH = 150;

type SlotCell = SlotBucket & {
  /** 素材区尺寸，取槽位内各文件的最大值：多态是叠在同一个位置切换的 */
  mediaWidth: number;
  mediaHeight: number;
  /** 格子尺寸 = 素材区 + 文件名行，宽度另有下限 */
  width: number;
  height: number;
  /** 组内相对坐标 */
  x: number;
  y: number;
};

const toSlotCell = (bucket: SlotBucket): SlotCell => {
  const mediaWidth = Math.max(
    ...bucket.items.map((item) => item.width ?? FALLBACK_SIZE),
  );
  const mediaHeight = Math.max(
    ...bucket.items.map((item) => item.height ?? FALLBACK_SIZE),
  );
  return {
    ...bucket,
    mediaWidth,
    mediaHeight,
    width: Math.max(mediaWidth, MIN_CELL_WIDTH),
    height: mediaHeight + LABEL_HEIGHT,
    x: 0,
    y: 0,
  };
};

/**
 * 整屏素材：5 张效果图和 home_bg，yaml 里都是 1080x2338。
 * 它们摆在组的左边单独一栏，右边留给零碎素材。
 */
const isFullScreen = (cell: SlotCell) =>
  cell.mediaWidth >= 1080 && cell.mediaHeight >= 2338;

/**
 * 组内两栏：左边整屏图横向排，右边其余槽位按面积从大到小折行成网格。
 * 就地填好每个格子的组内相对坐标，返回 platform_group 该有多大。
 */
const layoutGroupCells = (cells: SlotCell[]) => {
  const fullScreens = cells.filter(isFullScreen);
  const rest = cells.filter((cell) => !isFullScreen(cell));

  // 左栏，保持 CONTROL_CENTER_FILES 原序（亮度那组的最低 / 最高两张挨着）
  let cursorX = GAP;
  let height = 0;
  fullScreens.forEach((cell) => {
    cell.x = cursorX;
    cell.y = GAP;
    cursorX += cell.width + CELL_GAP;
    height = Math.max(height, cell.height);
  });

  // cursorX 末尾多出来的那个 CELL_GAP 正好当两栏的间距
  const gridLeft = fullScreens.length ? cursorX : GAP;

  // 右栏按面积从大到小，同尺寸的保持原序，功能相近的素材仍然挨在一起
  rest.sort((a, b) => b.width * b.height - a.width * a.height);

  const rows: SlotCell[][] = [];
  let row: SlotCell[] = [];
  let rowWidth = 0;
  let rowHeight = 0;

  rest.forEach((cell) => {
    const tooWide =
      rowWidth > 0 && rowWidth + CELL_GAP + cell.width > MAX_ROW_WIDTH;
    const tooTall =
      rowHeight > 0 &&
      (cell.height > rowHeight * MAX_ROW_HEIGHT_RATIO ||
        rowHeight > cell.height * MAX_ROW_HEIGHT_RATIO);
    if (tooWide || tooTall) {
      rows.push(row);
      row = [];
      rowWidth = 0;
      rowHeight = 0;
    }
    row.push(cell);
    rowWidth += (rowWidth ? CELL_GAP : 0) + cell.width;
    rowHeight = Math.max(rowHeight, cell.height);
  });
  if (row.length) rows.push(row);

  let cursorY = GAP;
  let gridWidth = 0;

  rows.forEach((list) => {
    const lineHeight = Math.max(...list.map((cell) => cell.height));
    let lineX = gridLeft;
    list.forEach((cell) => {
      cell.x = lineX;
      // 行内底部对齐，素材从 36x36 到 894x1512，顶部对齐的话小图全吊在最上面
      cell.y = cursorY + lineHeight - cell.height;
      lineX += cell.width + CELL_GAP;
    });
    gridWidth = Math.max(gridWidth, lineX - CELL_GAP - gridLeft);
    cursorY += lineHeight + CELL_GAP;
  });

  if (rows.length) height = Math.max(height, cursorY - CELL_GAP - GAP);

  return {
    width: (rows.length ? gridLeft + gridWidth : cursorX - CELL_GAP) + GAP,
    height: height + GAP * 2,
  };
};

/**
 * 双态槽位交给 control_center_toggle（点一下切开关），
 * 其余（单图 / 效果图 / 滑条）都是静态的，用 control_center_source 画。
 */
const NODE_TYPE_BY_KIND: Record<ControlCenterSlotKind, string> = {
  preview: 'control_center_source',
  image: 'control_center_source',
  slider: 'control_center_source',
  toggle: 'control_center_toggle',
  animated_toggle: 'control_center_toggle',
};

/**
 * config → 画布节点。三层结构和其他元素一致：
 * root group → 一屏一个 platform_group → 组内每个槽位一个格子。
 *
 * 格子是槽位而不是文件：双态的四个文件（关 / 开 / 开启动画 / 关闭动画）共用一格，
 * 滑条的三件套也共用一格，所以 44 格而不是 73 格。
 *
 * 素材按 asset key 平铺在格子 data 上（图只有 source，pag 只有 pagsource），
 * 组件用 getControlCenterRoleAssetKey 按 role 去取。
 */
export const controlCenterConfig2Nodes: any = (
  config: any,
  elementKey?: any,
) => {
  const assets = (config?.assets ?? {}) as Record<
    string,
    ConfigAsset | undefined
  >;

  const grouped = createAssetsGroup(assets);

  const rootGroupId = elementKey || nanoid();
  const childNodes: any[] = [];
  let cursorX = GAP;
  let rootHeight = GAP;

  // 按 CONTROL_CENTER_GROUP_ORDER 走，画布上从左到右是封面 → 主页 → 控制 → 亮度 → 音乐
  CONTROL_CENTER_GROUP_ORDER.forEach((groupKey) => {
    const slots = grouped.get(groupKey);
    if (!slots?.size) return;

    const cells = [...slots.values()].map(toSlotCell);
    const { width: groupWidth, height: groupHeight } = layoutGroupCells(cells);
    const platformGroupId = `${nanoid()}_${groupKey}`;

    childNodes.push({
      id: platformGroupId,
      type: 'platform_group',
      className: 'widget-group-node',
      position: { x: cursorX, y: GAP },
      data: {
        /** 控制中心只发安卓，和其他元素的 platform_group 一样这里放平台名 */
        label: 'android',
        themekitType: groupKey,
      },
      parentId: rootGroupId,
      extent: 'parent',
      draggable: false,
      connectable: false,
      focusable: false,
      zIndex: 10,
      style: {
        width: groupWidth,
        height: groupHeight,
        ...PLATFORM_GROUP_STYLE.control_center,
      },
    });

    cells.forEach((cell) => {
      // 素材按 asset key 平铺在 data 上，组件用 getControlCenterSlot(key) 自己找 role
      const files = Object.fromEntries(
        cell.items.map((item) => {
          // 字段跟 defaultConfig 走：图只有 source，pag 只有 pagsource，不要交叉抄成 undefined
          const file: ConfigAsset = { ext: item.asset.ext };
          if (item.asset.ext === 'pag') {
            file.pagsource = item.asset.pagsource ?? '';
          } else {
            file.source = item.asset.source ?? '';
            file.width = item.asset.width;
            file.height = item.asset.height;
          }
          return [item.key, file];
        }),
      );
      childNodes.push({
        id: nanoid(),
        type: NODE_TYPE_BY_KIND[cell.kind],
        data: {
          /** 回写 config 时靠平铺的 asset key 找回素材，这里存槽位名 */
          key: cell.slot,
          kind: cell.kind,
          mediaWidth: cell.mediaWidth,
          mediaHeight: cell.mediaHeight,
          fileNameHeight: LABEL_HEIGHT,
          /** 中文名，title / 静态格底部用；toggle 底下那行用的是当前文件的 key */
          label: cell.label,
          ...files,
        },
        position: { x: cell.x, y: cell.y },
        parentId: platformGroupId,
        extent: 'parent',
        draggable: false,
        // selectable: false,
        connectable: false,
        focusable: false,
        style: {
          width: cell.width,
          height: cell.height,
        },
      });
    });

    cursorX += groupWidth + GAP;
    rootHeight = Math.max(groupHeight + 2 * GAP, rootHeight);
  });

  if (!childNodes.length) return { nodes: [], rootNode: null };
  const rootNode = {
    id: rootGroupId,
    type: 'group',
    deleteable: true,
    position: { x: 0, y: 0 },
    data: {
      category: 'control_center',
      name: config?.name ?? 'Control_Center',
      /** control_spec.json 是整包共用的配色，挂根节点不进素材 */
      spec: config?.spec ?? {},
    },
    packable: true,
    draggable: false,
    connectable: false,
    focusable: false,
    zIndex: 1,
    style: {
      width: cursorX,
      height: rootHeight,
      ...ROOT_GROUP_STYLE.control_center,
    },
  };

  return { nodes: [rootNode, ...childNodes], rootNode };
};

/**
 * 从当前 nodes 组装 control_center 的 config_json。
 * assets 先拿模板铺满 73 条空位再回填，保证导出结构完整、缺图是空串而不是少 key，
 * 字段名（source / pagsource）也跟着模板走，不用在这里再判一次格式。
 */
export const buildControlCenterConfigJson = (
  rootNode: FlowNode,
  nodes: FlowNode[],
): Record<string, any> => {
  const rootData = getNodeData(rootNode);

  const assets = structuredClone(ControlCenterDefaultConfig.assets) as Record<
    string,
    ConfigAsset
  >;

  const platformIds = new Set(
    nodes
      .filter(
        (node) =>
          node.type === 'platform_group' && node.parentId === rootNode.id,
      )
      .map((node) => node.id),
  );

  const SLOT_NODE_TYPES = new Set(Object.values(NODE_TYPE_BY_KIND));
  /** 格子 data 上的元数据，剩下的对象才是按 asset key 平铺的素材 */
  const SLOT_META_KEYS = new Set([
    'key',
    'kind',
    'label',
    'mediaWidth',
    'mediaHeight',
    'fileNameHeight',
  ]);

  nodes.forEach((node) => {
    if (!node.type || !SLOT_NODE_TYPES.has(node.type)) return;
    if (!node.parentId || !platformIds.has(node.parentId)) return;
    const data = getNodeData(node);
    Object.entries(data).forEach(([assetKey, value]) => {
      if (SLOT_META_KEYS.has(assetKey)) return;
      if (!value || typeof value !== 'object') return;
      const asset = assets[assetKey];
      if (!asset) return;
      const file = value as ConfigAsset;
      if (file.ext === 'pag') {
        asset.pagsource = file.pagsource ?? '';
        return;
      }
      asset.source = file.source ?? '';
    });
  });

  return {
    name: rootData.name ?? 'Control_Center',
    assets,
    spec: rootData.spec ?? {},
  };
};
