import {
  buildDockOccupied,
  buildGridOccupied,
  canPlace,
  dockCellOf,
  gridCellH,
  gridCellW,
  type ThemeHomeLayout,
  type ThemeHomePlacement,
  type ThemeHomeZone,
} from './themeHomeLayout';

export type ThemeHomePoint = { x: number; y: number };

const GRID_SLOT_PREFIX = 'theme-home-grid:';
const DOCK_SLOT_PREFIX = 'theme-home-dock:';

export type ThemeHomeDropTarget =
  | { zone: 'grid'; colStart: number; rowStart: number }
  | { zone: 'dock'; colStart: number; rowStart: 1 };

export const themeHomeGridSlotId = (colStart: number, rowStart: number) =>
  `${GRID_SLOT_PREFIX}${colStart}:${rowStart}`;

export const themeHomeDockSlotId = (colStart: number) =>
  `${DOCK_SLOT_PREFIX}${colStart}`;

export const parseThemeHomeDropTarget = (
  rawId: string | number | undefined | null,
): ThemeHomeDropTarget | null => {
  if (rawId == null) return null;
  const id = String(rawId);

  if (id.startsWith(GRID_SLOT_PREFIX)) {
    const rest = id.slice(GRID_SLOT_PREFIX.length);
    const [colRaw, rowRaw] = rest.split(':');
    const colStart = Number(colRaw);
    const rowStart = Number(rowRaw);
    if (!Number.isFinite(colStart) || !Number.isFinite(rowStart)) return null;
    if (colStart < 1 || rowStart < 1) return null;
    return { zone: 'grid', colStart, rowStart };
  }

  if (id.startsWith(DOCK_SLOT_PREFIX)) {
    const colStart = Number(id.slice(DOCK_SLOT_PREFIX.length));
    if (!Number.isFinite(colStart) || colStart < 1) return null;
    return { zone: 'dock', colStart, rowStart: 1 };
  }

  return null;
};

const containsPoint = (rect: DOMRect, point: ThemeHomePoint) =>
  point.x >= rect.left &&
  point.x < rect.right &&
  point.y >= rect.top &&
  point.y < rect.bottom;

/** 将板内未缩放坐标映射为格子起点（1-based）；越界返回 null */
const mapPointToCell = (
  x: number,
  y: number,
  cols: number,
  rows: number,
  cellW: number,
  cellH: number,
  gapX: number,
  gapY: number,
): { colStart: number; rowStart: number } | null => {
  const gridW = cols * cellW + Math.max(0, cols - 1) * gapX;
  const gridH = rows * cellH + Math.max(0, rows - 1) * gapY;
  if (x < 0 || y < 0 || x >= gridW || y >= gridH) return null;
  const strideX = cellW + gapX;
  const strideY = cellH + gapY;
  const colStart = Math.min(cols, Math.floor(x / strideX) + 1);
  const rowStart = Math.min(rows, Math.floor(y / strideY) + 1);
  return { colStart, rowStart };
};

/**
 * 用鼠标【屏幕/client】坐标解析落点。
 * 板面 rect 已包含 fitScale + xyflow zoom，用「逻辑尺寸 / 屏幕尺寸」换算。
 */
export const resolveThemeHomeDropTargetFromPointer = (params: {
  pointer: ThemeHomePoint;
  gridBoardRect: DOMRect | null;
  dockBoardRect: DOMRect | null;
  cols: number;
  rows: number;
  dockCols: number;
  layout: ThemeHomeLayout;
  /** 主网格未缩放逻辑宽高（与 board 节点 style width/height 一致） */
  gridLogicalW: number;
  gridLogicalH: number;
  /** Dock 内格未缩放逻辑宽高 */
  dockLogicalW: number;
  dockLogicalH: number;
}): ThemeHomeDropTarget | null => {
  const {
    pointer,
    gridBoardRect,
    dockBoardRect,
    cols,
    rows,
    dockCols,
    layout,
    gridLogicalW,
    gridLogicalH,
    dockLogicalW,
    dockLogicalH,
  } = params;

  if (
    dockBoardRect &&
    containsPoint(dockBoardRect, pointer) &&
    dockBoardRect.width > 0 &&
    dockBoardRect.height > 0
  ) {
    const x =
      ((pointer.x - dockBoardRect.left) * dockLogicalW) / dockBoardRect.width;
    const y =
      ((pointer.y - dockBoardRect.top) * dockLogicalH) / dockBoardRect.height;
    const dCell = dockCellOf(layout);
    const cell = mapPointToCell(x, y, dockCols, 1, dCell, dCell, layout.gapX, 0);
    if (!cell) return null;
    return { zone: 'dock', colStart: cell.colStart, rowStart: 1 };
  }

  if (
    gridBoardRect &&
    containsPoint(gridBoardRect, pointer) &&
    gridBoardRect.width > 0 &&
    gridBoardRect.height > 0
  ) {
    const x =
      ((pointer.x - gridBoardRect.left) * gridLogicalW) / gridBoardRect.width;
    const y =
      ((pointer.y - gridBoardRect.top) * gridLogicalH) / gridBoardRect.height;
    const cell = mapPointToCell(
      x,
      y,
      cols,
      rows,
      gridCellW(layout),
      gridCellH(layout),
      layout.gapX,
      layout.gapY,
    );
    if (!cell) return null;
    return { zone: 'grid', colStart: cell.colStart, rowStart: cell.rowStart };
  }

  return null;
};

export const isThemeHomeDockEligible = (item: ThemeHomePlacement) =>
  item.element?.category === 'iconpack' && item.colSpan === 1 && item.rowSpan === 1;

export const canDropThemeHomePlacement = (params: {
  placements: ThemeHomePlacement[];
  itemId: string;
  target: ThemeHomeDropTarget;
  cols: number;
  rows: number;
  dockCols: number;
}): boolean => {
  const { placements, itemId, target, cols, rows, dockCols } = params;
  const item = placements.find((p) => p.id === itemId);
  if (!item) return false;

  if (target.zone === 'dock') {
    if (!isThemeHomeDockEligible(item)) return false;
    if (target.colStart < 1 || target.colStart > dockCols) return false;
    const dockOccupied = buildDockOccupied(placements, dockCols, itemId);
    return !dockOccupied[target.colStart - 1];
  }

  const occupied = buildGridOccupied(placements, cols, rows, itemId);
  return canPlace(
    occupied,
    cols,
    rows,
    target.rowStart,
    target.colStart,
    item.rowSpan,
    item.colSpan,
  );
};

/** 合法则返回新 placements；非法返回原数组引用 */
export const applyThemeHomeDrop = (params: {
  placements: ThemeHomePlacement[];
  itemId: string;
  target: ThemeHomeDropTarget;
  cols: number;
  rows: number;
  dockCols: number;
}): ThemeHomePlacement[] => {
  const { placements, itemId, target, cols, rows, dockCols } = params;
  if (!canDropThemeHomePlacement(params)) return placements;

  return placements.map((item) => {
    if (item.id !== itemId) return item;
    if (target.zone === 'dock') {
      return {
        ...item,
        zone: 'dock' as ThemeHomeZone,
        colStart: target.colStart,
        rowStart: 1,
        colSpan: 1,
        rowSpan: 1,
      };
    }
    return {
      ...item,
      zone: 'grid' as ThemeHomeZone,
      colStart: target.colStart,
      rowStart: target.rowStart,
      colSpan: item.colSpan,
      rowSpan: item.rowSpan,
    };
  });
};
