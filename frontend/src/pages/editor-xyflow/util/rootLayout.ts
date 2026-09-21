import type { Node as FlowNode } from '@xyflow/react';

export type LayoutRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LayoutPoint = {
  x: number;
  y: number;
};

/** 列内同类元素的间距（行内横向 & 行间竖向） */
export const LAYOUT_GAP = 100;
/** 不同 category 区域之间的横向间距 */
export const COLUMN_GAP = LAYOUT_GAP * 5;

/**
 * 按 category 分列的固定顺序；空列不占位。
 * 未列入的 category 排在已知类型之后。
 */
export const CATEGORY_COLUMN_ORDER = [
  'widget',
  'lockwidget',
  'iconpack',
  'wallpaper',
  'sticker',
  'charging_animation',
  'control_center',
  'theme',
  'lockpack',
] as const;

/**
 * 各类在区域内每行的「格数」容量；未配置默认 1。
 * 多数类型一格一项；wallpaper 按宽度折算占格（单张≈1、双张≈2）。
 */
export const CATEGORY_ROW_SLOT_CAPACITY: Record<string, number> = {
  widget: 4,
  lockwidget: 6,
  sticker: 4,
  wallpaper: 2,
};

/** 按根节点宽度相对「同类最小宽」估算占格数的类型 */
const WIDTH_BASED_SLOT_CATEGORIES = new Set(['wallpaper']);

export const getRowSlotCapacity = (category: string) => {
  const n = CATEGORY_ROW_SLOT_CAPACITY[category];
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
};

/** 同类里最窄的根宽当作 1 格基准 */
export const resolveSlotUnitWidth = (
  widths: number[],
  fallbackWidth = 0,
): number => {
  let unit = Number.POSITIVE_INFINITY;
  widths.forEach((width) => {
    if (width > 0) unit = Math.min(unit, width);
  });
  if (Number.isFinite(unit)) return unit;
  return fallbackWidth > 0 ? fallbackWidth : 0;
};

export const getEntrySlotCost = (
  category: string,
  width: number,
  unitWidth: number,
): number => {
  if (!WIDTH_BASED_SLOT_CATEGORIES.has(category)) return 1;
  if (!(unitWidth > 0) || !(width > 0)) return 1;
  return Math.max(1, Math.round(width / unitWidth));
};

type RootEntry = {
  id: string;
  category: string;
  rect: LayoutRect;
};

const readNumber = (value: unknown) => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const isRootGroupNode = (node: FlowNode): boolean =>
  node.type === 'group' && !node.parentId;

export const getNodeSize = (node: FlowNode) => {
  const style = (node.style ?? {}) as {
    width?: number | string;
    height?: number | string;
  };
  const measured = ((node as any).measured ?? {}) as {
    width?: number;
    height?: number;
  };
  return {
    width: readNumber(style.width ?? measured.width),
    height: readNumber(style.height ?? measured.height),
  };
};

export const getRootCategory = (node: FlowNode): string => {
  const data = (node.data ?? {}) as { category?: unknown };
  const category = data.category;
  return typeof category === 'string' && category.trim()
    ? category.trim()
    : 'unknown';
};

const categoryOrderIndex = (category: string) => {
  const index = (CATEGORY_COLUMN_ORDER as readonly string[]).indexOf(category);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const compareCategory = (a: string, b: string) => {
  const orderDiff = categoryOrderIndex(a) - categoryOrderIndex(b);
  if (orderDiff !== 0) return orderDiff;
  return a.localeCompare(b);
};

/** 取出画布上所有可参与排布的 root group（需能算出尺寸） */
export const collectRootEntries = (nodes: FlowNode[]): RootEntry[] => {
  const entries: RootEntry[] = [];
  nodes.forEach((node) => {
    if (!isRootGroupNode(node)) return;
    const { width, height } = getNodeSize(node);
    if (!(width > 0) || !(height > 0)) return;
    entries.push({
      id: node.id,
      category: getRootCategory(node),
      rect: {
        x: readNumber(node.position?.x),
        y: readNumber(node.position?.y),
        width,
        height,
      },
    });
  });
  return entries;
};

/**
 * 把同 category 的元素按格数容量折成多行。
 * 占格超过整行容量时独占一行（例如超宽 wallpaper）。
 */
export const packCategoryRows = (
  group: RootEntry[],
  category: string,
): RootEntry[][] => {
  if (!group.length) return [];

  const capacity = getRowSlotCapacity(category);
  const unitWidth = resolveSlotUnitWidth(group.map((entry) => entry.rect.width));
  const rows: RootEntry[][] = [];
  let current: RootEntry[] = [];
  let used = 0;

  group.forEach((entry) => {
    const cost = getEntrySlotCost(category, entry.rect.width, unitWidth);

    if (cost >= capacity) {
      if (current.length) {
        rows.push(current);
        current = [];
        used = 0;
      }
      rows.push([entry]);
      return;
    }

    if (used + cost > capacity && current.length) {
      rows.push(current);
      current = [];
      used = 0;
    }

    current.push(entry);
    used += cost;
  });

  if (current.length) rows.push(current);
  return rows;
};

/**
 * 为新元素挑落点：同 category 接到当前最后一行右侧（剩余格数够时）；
 * 行已满或不夠格则换到下一行最左；尚无该列则在现有内容最右侧新开一列。
 * 只决定新元素坐标，不移动已有节点。
 */
export const resolveNextRootPosition = (
  existingNodes: FlowNode[],
  targetRoot: FlowNode,
): LayoutPoint => {
  const occupied = collectRootEntries(existingNodes);
  if (!occupied.length) return { x: 0, y: 0 };

  const category = getRootCategory(targetRoot);
  const sameColumn = occupied.filter((entry) => entry.category === category);
  const targetSize = getNodeSize(targetRoot);

  if (sameColumn.length) {
    let colX = Number.POSITIVE_INFINITY;
    let colBottom = Number.NEGATIVE_INFINITY;
    let lastRowY = Number.NEGATIVE_INFINITY;
    sameColumn.forEach(({ rect }) => {
      colX = Math.min(colX, rect.x);
      colBottom = Math.max(colBottom, rect.y + rect.height);
      lastRowY = Math.max(lastRowY, rect.y);
    });

    const lastRow = sameColumn.filter(({ rect }) => rect.y === lastRowY);
    const capacity = getRowSlotCapacity(category);
    const unitWidth = resolveSlotUnitWidth(
      [
        ...sameColumn.map((entry) => entry.rect.width),
        targetSize.width,
      ],
      targetSize.width,
    );
    const used = lastRow.reduce(
      (sum, entry) =>
        sum + getEntrySlotCost(category, entry.rect.width, unitWidth),
      0,
    );
    const cost = getEntrySlotCost(category, targetSize.width, unitWidth);

    if (cost < capacity && used + cost <= capacity) {
      let rowRight = Number.NEGATIVE_INFINITY;
      lastRow.forEach(({ rect }) => {
        rowRight = Math.max(rowRight, rect.x + rect.width);
      });
      return { x: rowRight + LAYOUT_GAP, y: lastRowY };
    }

    return { x: colX, y: colBottom + LAYOUT_GAP };
  }

  // 新 category：开在所有已有内容的右侧，顶部与现有内容对齐
  let minY = Number.POSITIVE_INFINITY;
  let maxRight = Number.NEGATIVE_INFINITY;
  occupied.forEach(({ rect }) => {
    minY = Math.min(minY, rect.y);
    maxRight = Math.max(maxRight, rect.x + rect.width);
  });
  return { x: maxRight + COLUMN_GAP, y: minY };
};

/**
 * 整理排列：按 category 分区域，区域内按格数容量折行，回收增删留下的空洞。
 *
 * 列顺序见 CATEGORY_COLUMN_ORDER；空列不占位。
 * wallpaper 单张占 1 格、双张占 2 格，每行 2 格，避免一宽一窄叠着不齐。
 * 区域宽取各行「元素宽 + 间距」的最大值（按内容算，不定宽）。
 * 整体锚定在原来的左上角，避免整理完画布整个跑掉。
 * 位置没有变化时返回传入的原数组，调用方据此跳过提交，不污染撤销栈。
 */
export const relayoutRootNodes = (nodes: FlowNode[]): FlowNode[] => {
  const entries = collectRootEntries(nodes);
  if (entries.length < 2) return nodes;

  let originX = Number.POSITIVE_INFINITY;
  let originY = Number.POSITIVE_INFINITY;
  entries.forEach(({ rect }) => {
    originX = Math.min(originX, rect.x);
    originY = Math.min(originY, rect.y);
  });

  const byCategory = new Map<string, RootEntry[]>();
  entries.forEach((entry) => {
    const list = byCategory.get(entry.category);
    if (list) {
      list.push(entry);
    } else {
      byCategory.set(entry.category, [entry]);
    }
  });

  const categories = [...byCategory.keys()].sort(compareCategory);

  const placed = new Map<string, LayoutPoint>();
  let cursorX = originX;

  categories.forEach((category) => {
    const group = byCategory.get(category) ?? [];
    group.sort((a, b) =>
      a.rect.y !== b.rect.y ? a.rect.y - b.rect.y : a.rect.x - b.rect.x,
    );

    const rows = packCategoryRows(group, category);
    let cursorY = originY;
    let colWidth = 0;

    rows.forEach((row) => {
      let rowX = cursorX;
      let rowHeight = 0;

      row.forEach(({ id, rect }) => {
        placed.set(id, { x: rowX, y: cursorY });
        rowX += rect.width + LAYOUT_GAP;
        rowHeight = Math.max(rowHeight, rect.height);
      });

      colWidth = Math.max(colWidth, rowX - cursorX - LAYOUT_GAP);
      cursorY += rowHeight + LAYOUT_GAP;
    });

    cursorX += colWidth + COLUMN_GAP;
  });

  let changed = false;
  const next = nodes.map((node) => {
    const point = placed.get(node.id);
    if (!point) return node;
    if (
      readNumber(node.position?.x) === point.x &&
      readNumber(node.position?.y) === point.y
    ) {
      return node;
    }
    changed = true;
    return { ...node, position: point };
  });

  return changed ? next : nodes;
};
