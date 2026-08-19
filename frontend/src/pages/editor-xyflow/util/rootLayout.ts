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

/** 元素之间的固定留白 */
export const LAYOUT_GAP = 100;
/** 各类元素根宽度差一个数量级（widget 几百，iconpack 上万），只按个数封顶会让某些行被拉得极长 */
export const ROW_MAX_WIDTH = 10000;
/** 同一水平带上最多并排多少个元素 */
export const ROW_MAX_COUNT = 6;

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

/** 取出画布上所有 root group 的占位矩形，尺寸算不出来的节点无法参与碰撞判断，直接跳过 */
export const collectRootRects = (nodes: FlowNode[]): LayoutRect[] => {
  const rects: LayoutRect[] = [];
  nodes.forEach((node) => {
    if (!isRootGroupNode(node)) return;
    const { width, height } = getNodeSize(node);
    if (!(width > 0) || !(height > 0)) return;
    rects.push({
      x: readNumber(node.position?.x),
      y: readNumber(node.position?.y),
      width,
      height,
    });
  });
  return rects;
};

export const rectsIntersect = (a: LayoutRect, b: LayoutRect): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

export const findOverlappingPair = (
  rects: LayoutRect[],
): [LayoutRect, LayoutRect] | null => {
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      if (rectsIntersect(rects[i], rects[j])) return [rects[i], rects[j]];
    }
  }
  return null;
};

/**
 * 为新元素挑一个不与任何已有元素相交的落点。
 *
 * 不从坐标反推「行」，而是直接拿候选点跟真实矩形做相交测试：候选点来自每个已有元素的右边缘
 * （同一带继续往右排）和下边缘（另起一带），按从上到下、从左到右取第一个放得下的位置。
 * 已有元素的位置是会落库的权威数据，所以这里只决定新元素放哪，不会去动别人。
 */
export const resolveRootPlacement = (
  occupied: LayoutRect[],
  size: { width: number; height: number },
): LayoutPoint => {
  if (!occupied.length) return { x: 0, y: 0 };

  const width = size.width > 0 ? size.width : 0;
  const height = size.height > 0 ? size.height : 0;

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxBottom = Number.NEGATIVE_INFINITY;
  occupied.forEach((rect) => {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxBottom = Math.max(maxBottom, rect.y + rect.height);
  });

  // 所有元素下方一定是空的，作为永远成立的兜底落点
  const fallback: LayoutPoint = { x: minX, y: maxBottom + LAYOUT_GAP };
  // 尺寸未知的元素没法做碰撞判断，直接丢到最下面，避免压到别人身上
  if (!(width > 0) || !(height > 0)) return fallback;

  const sortedByX = [...occupied].sort((a, b) => a.x - b.x);

  const candidates: LayoutPoint[] = [{ x: minX, y: minY }];
  occupied.forEach((rect) => {
    candidates.push({ x: rect.x + rect.width + LAYOUT_GAP, y: rect.y });
    candidates.push({ x: minX, y: rect.y + rect.height + LAYOUT_GAP });
  });

  const seen = new Set<string>();
  const ordered = candidates
    .filter((point) => {
      if (point.x < minX || point.y < minY) return false;
      // 行宽上限按「离最左边多远」算，避免一整行横向拉到看不见头
      if (point.x + width - minX > ROW_MAX_WIDTH) return false;
      const key = `${point.x}|${point.y}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));

  for (const point of ordered) {
    const candidate: LayoutRect = { x: point.x, y: point.y, width, height };

    let blocked = false;
    for (const rect of sortedByX) {
      // sortedByX 按 x 升序，一旦越过候选右边界，后面的都不可能相交
      if (rect.x >= candidate.x + width) break;
      if (rectsIntersect(candidate, rect)) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    let sameBandCount = 0;
    for (const rect of occupied) {
      if (rect.y < candidate.y + height && candidate.y < rect.y + rect.height) {
        sameBandCount += 1;
      }
    }
    if (sameBandCount >= ROW_MAX_COUNT) continue;

    return point;
  }

  return fallback;
};

/** 直接给一批 nodes 用的入口：找出新元素 root 该放的位置 */
export const resolveNextRootPosition = (
  existingNodes: FlowNode[],
  targetRoot: FlowNode,
): LayoutPoint =>
  resolveRootPlacement(
    collectRootRects(existingNodes),
    getNodeSize(targetRoot),
  );

/**
 * 整理排列：把所有 root 元素按当前的阅读顺序重新码放，回收增删留下的空洞。
 *
 * 一行一行往下铺，行高取行内最高的元素，所以行与行不可能相交；行内元素首尾相接，
 * 行内也不可能相交。整体锚定在原来的左上角，避免整理完画布整个跑掉。
 * 位置没有变化时返回传入的原数组，调用方据此跳过提交，不污染撤销栈。
 */
export const relayoutRootNodes = (nodes: FlowNode[]): FlowNode[] => {
  const entries: Array<{ id: string; rect: LayoutRect }> = [];
  nodes.forEach((node) => {
    if (!isRootGroupNode(node)) return;
    const { width, height } = getNodeSize(node);
    // 尺寸算不出来的元素无法参与排布，保持原位不动
    if (!(width > 0) || !(height > 0)) return;
    entries.push({
      id: node.id,
      rect: {
        x: readNumber(node.position?.x),
        y: readNumber(node.position?.y),
        width,
        height,
      },
    });
  });
  if (entries.length < 2) return nodes;

  let originX = Number.POSITIVE_INFINITY;
  let originY = Number.POSITIVE_INFINITY;
  entries.forEach(({ rect }) => {
    originX = Math.min(originX, rect.x);
    originY = Math.min(originY, rect.y);
  });

  const ordered = [...entries].sort((a, b) =>
    a.rect.y !== b.rect.y ? a.rect.y - b.rect.y : a.rect.x - b.rect.x,
  );

  const placed = new Map<string, LayoutPoint>();
  let cursorX = originX;
  let cursorY = originY;
  let rowHeight = 0;
  let rowCount = 0;

  ordered.forEach(({ id, rect }) => {
    const overflowed =
      rowCount >= ROW_MAX_COUNT ||
      cursorX + rect.width - originX > ROW_MAX_WIDTH;
    // rowCount 为 0 时不换行，保证超宽元素独占一行而不是空转
    if (rowCount > 0 && overflowed) {
      cursorY += rowHeight + LAYOUT_GAP;
      cursorX = originX;
      rowHeight = 0;
      rowCount = 0;
    }
    placed.set(id, { x: cursorX, y: cursorY });
    cursorX += rect.width + LAYOUT_GAP;
    rowHeight = Math.max(rowHeight, rect.height);
    rowCount += 1;
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
