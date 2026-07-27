/** 主屏预览布局尺度；list_view 可传更小 cell */
export type ThemeHomeLayout = {
  cell: number;
  gapX: number;
  gapY: number;
  padTop: number;
  padX: number;
  dockBottom: number;
  dockSide: number;
  dockGap: number;
  dockPadding: number;
  dockRadius: number;
};

export const PHONE_HOME_LAYOUT: ThemeHomeLayout = {
  cell: 180,
  gapX: 89,
  gapY: 105,
  padTop: 100,
  padX: 50,
  dockBottom: 20,
  dockSide: 10,
  dockGap: 48,
  dockPadding: 20,
  dockRadius: 48,
};

/** list_view 492 宽：略小于默认主屏，收紧间距以保证格子可读、内容完整 */
export const LIST_HOME_LAYOUT: ThemeHomeLayout = {
  cell: 112,
  gapX: 14,
  gapY: 22,
  padTop: 56,
  padX: 12,
  dockBottom: 14,
  dockSide: 8,
  dockGap: 28,
  dockPadding: 12,
  dockRadius: 28,
};

/** list_view_short：4×3、无 Dock，四边 50、间距 20 */
export const LIST_VIEW_SHORT_LAYOUT: ThemeHomeLayout = {
  cell: 180,
  gapX: 20,
  gapY: 20,
  padTop: 50,
  padX: 50,
  dockBottom: 50,
  dockSide: 0,
  dockGap: 0,
  dockPadding: 0,
  dockRadius: 0,
};

export const DEFAULT_HOME_COLS = 4;
export const DEFAULT_HOME_ROWS = 6;
export const DEFAULT_DOCK_COLS = 4;
export const DOCK_ROWS = 1;

export type ThemeHomeZone = 'grid' | 'dock';

export type ThemeHomeSpan = {
  colSpan: number;
  rowSpan: number;
};

export type ThemeHomeSpanResolver = (element: any) => ThemeHomeSpan;

export type ThemeHomePlacement = {
  id: string;
  element: any;
  zone: ThemeHomeZone;
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
};

/** icon=1×1；widget: small=2×2 / medium=4×2 / large=4×4（默认主屏格） */
export const resolveThemeHomeElementSpan: ThemeHomeSpanResolver = (element) => {
  if (element?.category === 'iconpack') {
    return { colSpan: 1, rowSpan: 1 };
  }
  if (element?.category === 'widget') {
    const size = Number(element?.data?.sizes?.[0]?.size) || 1;
    if (size === 3) return { colSpan: 4, rowSpan: 4 };
    if (size === 2) return { colSpan: 4, rowSpan: 2 };
    return { colSpan: 2, rowSpan: 2 };
  }
  return { colSpan: 1, rowSpan: 1 };
};

/** list_view_short 仅铺 icon；其它品类给超大 span 使其无法落格 */
export const resolveListViewShortSpan: ThemeHomeSpanResolver = (element) => {
  if (element?.category === 'iconpack') {
    return { colSpan: 1, rowSpan: 1 };
  }
  return { colSpan: 999, rowSpan: 999 };
};

export const getGridSize = (cols: number, rows: number, layout: ThemeHomeLayout) => ({
  width: cols * layout.cell + Math.max(0, cols - 1) * layout.gapX,
  height: rows * layout.cell + Math.max(0, rows - 1) * layout.gapY,
});

export const spanPxX = (n: number, layout: ThemeHomeLayout) =>
  n * layout.cell + Math.max(0, n - 1) * layout.gapX;

export const spanPxY = (n: number, layout: ThemeHomeLayout) =>
  n * layout.cell + Math.max(0, n - 1) * layout.gapY;

export const createOccupiedGrid = (cols: number, rows: number) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

export const canPlace = (
  occupied: boolean[][],
  cols: number,
  rows: number,
  rowStart: number,
  colStart: number,
  rowSpan: number,
  colSpan: number,
) => {
  if (rowStart + rowSpan - 1 > rows || colStart + colSpan - 1 > cols) return false;
  for (let r = rowStart - 1; r < rowStart - 1 + rowSpan; r += 1) {
    for (let c = colStart - 1; c < colStart - 1 + colSpan; c += 1) {
      if (occupied[r][c]) return false;
    }
  }
  return true;
};

export const markOccupied = (
  occupied: boolean[][],
  rowStart: number,
  colStart: number,
  rowSpan: number,
  colSpan: number,
) => {
  for (let r = rowStart - 1; r < rowStart - 1 + rowSpan; r += 1) {
    for (let c = colStart - 1; c < colStart - 1 + colSpan; c += 1) {
      occupied[r][c] = true;
    }
  }
};

/** 从左到右、从上到下找第一个能放下的位置；放不下返回 null */
export const findNextSlot = (
  occupied: boolean[][],
  cols: number,
  rows: number,
  colSpan: number,
  rowSpan: number,
): { colStart: number; rowStart: number } | null => {
  for (let rowStart = 1; rowStart <= rows; rowStart += 1) {
    for (let colStart = 1; colStart <= cols; colStart += 1) {
      if (canPlace(occupied, cols, rows, rowStart, colStart, rowSpan, colSpan)) {
        return { colStart, rowStart };
      }
    }
  }
  return null;
};

export const placementPixelStyle = (
  placement: Pick<ThemeHomePlacement, 'colStart' | 'rowStart' | 'colSpan' | 'rowSpan'>,
  layout: ThemeHomeLayout,
) => ({
  position: 'absolute' as const,
  left: (placement.colStart - 1) * (layout.cell + layout.gapX),
  top: (placement.rowStart - 1) * (layout.cell + layout.gapY),
  width: spanPxX(placement.colSpan, layout),
  height: spanPxY(placement.rowSpan, layout),
});

export const buildGridOccupied = (
  placements: ThemeHomePlacement[],
  cols: number,
  rows: number,
  excludeId?: string,
) => {
  const occupied = createOccupiedGrid(cols, rows);
  placements.forEach((item) => {
    if (item.zone !== 'grid') return;
    if (excludeId && item.id === excludeId) return;
    markOccupied(occupied, item.rowStart, item.colStart, item.rowSpan, item.colSpan);
  });
  return occupied;
};

export const buildDockOccupied = (
  placements: ThemeHomePlacement[],
  dockCols: number,
  excludeId?: string,
) => {
  const occupied = Array.from({ length: dockCols }, () => false);
  placements.forEach((item) => {
    if (item.zone !== 'dock') return;
    if (excludeId && item.id === excludeId) return;
    const idx = item.colStart - 1;
    if (idx >= 0 && idx < dockCols) occupied[idx] = true;
  });
  return occupied;
};

const placementIdFor = (element: any, zone: ThemeHomeZone, colStart: number, rowStart: number) =>
  String(element?.key ?? `${zone}-${element?.category}-${colStart}-${rowStart}`);

const isLayoutElement = (element: any) =>
  element?.category === 'iconpack' || element?.category === 'widget';

/** 读取 showElements 上已存的布局；非法则 null */
export const readStoredThemeHomeLayout = (
  element: any,
): { zone: ThemeHomeZone; colStart: number; rowStart: number } | null => {
  const zone = element?.zone === 'dock' || element?.zone === 'grid' ? element.zone : null;
  if (!zone) return null;
  const colStart = Number(element?.colStart);
  if (!Number.isFinite(colStart) || colStart < 1) return null;
  if (zone === 'dock') {
    return { zone, colStart, rowStart: 1 };
  }
  const rowStart = Number(element?.rowStart);
  if (!Number.isFinite(rowStart) || rowStart < 1) return null;
  return { zone, colStart, rowStart };
};

/** 去掉写回用的布局字段，保留业务数据 */
export const stripThemeHomeLayoutFields = (element: any) => {
  if (!element || typeof element !== 'object') return element;
  const { zone: _zone, colStart: _colStart, rowStart: _rowStart, ...rest } = element;
  return rest;
};

const findNextDockSlot = (dockOccupied: boolean[], dockCols: number) => {
  for (let colStart = 1; colStart <= dockCols; colStart += 1) {
    if (!dockOccupied[colStart - 1]) return colStart;
  }
  return null;
};

/**
 * 从 showElements 生成 placements：
 * - 有合法存盘坐标且不冲突 → 用存盘坐标
 * - 否则自动找位（主网格 → 1×1 icon 进 dock）
 */
export const buildThemeHomePlacements = (
  showElements: any[],
  cols: number,
  rows: number,
  dockCols: number,
  resolveSpan: ThemeHomeSpanResolver = resolveThemeHomeElementSpan,
): { placements: ThemeHomePlacement[]; wallpaper: any | null } => {
  const placements: ThemeHomePlacement[] = [];
  let wallpaper: any = null;
  const occupied = createOccupiedGrid(cols, rows);
  const dockOccupied = Array.from({ length: dockCols }, () => false);

  showElements.forEach((element: any) => {
    if (element?.category === 'wallpaper') {
      wallpaper = element;
      return;
    }
    if (!isLayoutElement(element)) return;

    const { colSpan, rowSpan } = resolveSpan(element);
    const stored = readStoredThemeHomeLayout(element);

    if (stored?.zone === 'grid') {
      if (
        canPlace(occupied, cols, rows, stored.rowStart, stored.colStart, rowSpan, colSpan)
      ) {
        markOccupied(occupied, stored.rowStart, stored.colStart, rowSpan, colSpan);
        placements.push({
          id: placementIdFor(element, 'grid', stored.colStart, stored.rowStart),
          element,
          zone: 'grid',
          colStart: stored.colStart,
          rowStart: stored.rowStart,
          colSpan,
          rowSpan,
        });
        return;
      }
    }

    if (stored?.zone === 'dock') {
      const canDock =
        element.category === 'iconpack' &&
        colSpan === 1 &&
        rowSpan === 1 &&
        stored.colStart >= 1 &&
        stored.colStart <= dockCols &&
        !dockOccupied[stored.colStart - 1];
      if (canDock) {
        dockOccupied[stored.colStart - 1] = true;
        placements.push({
          id: placementIdFor(element, 'dock', stored.colStart, 1),
          element,
          zone: 'dock',
          colStart: stored.colStart,
          rowStart: 1,
          colSpan: 1,
          rowSpan: 1,
        });
        return;
      }
    }

    const slot = findNextSlot(occupied, cols, rows, colSpan, rowSpan);
    if (slot) {
      markOccupied(occupied, slot.rowStart, slot.colStart, rowSpan, colSpan);
      placements.push({
        id: placementIdFor(element, 'grid', slot.colStart, slot.rowStart),
        element,
        zone: 'grid',
        colStart: slot.colStart,
        rowStart: slot.rowStart,
        colSpan,
        rowSpan,
      });
      return;
    }

    if (element.category !== 'iconpack' || colSpan !== 1 || rowSpan !== 1) return;
    const dockColStart = findNextDockSlot(dockOccupied, dockCols);
    if (dockColStart == null) return;
    dockOccupied[dockColStart - 1] = true;
    placements.push({
      id: placementIdFor(element, 'dock', dockColStart, 1),
      element,
      zone: 'dock',
      colStart: dockColStart,
      rowStart: 1,
      colSpan: 1,
      rowSpan: 1,
    });
  });

  return { placements, wallpaper };
};

/**
 * Confirm 写回：wallpaper 等非布局项在前，已放置项带坐标，放不下的 icon/widget 去布局字段后挂末尾。
 */
export const placementsToShowElements = (
  placements: ThemeHomePlacement[],
  prevShowElements: any[],
): any[] => {
  const prev = Array.isArray(prevShowElements) ? prevShowElements : [];
  const placedRefs = new Set(placements.map((item) => item.element));
  const placedKeys = new Set(
    placements
      .map((item) => item.element?.key)
      .filter((key) => key != null && key !== ''),
  );

  const isPlaced = (element: any) => {
    if (placedRefs.has(element)) return true;
    const key = element?.key;
    return key != null && key !== '' && placedKeys.has(key);
  };

  const nonLayout: any[] = [];
  const leftovers: any[] = [];

  prev.forEach((element) => {
    if (!isLayoutElement(element)) {
      nonLayout.push(stripThemeHomeLayoutFields(element));
      return;
    }
    if (!isPlaced(element)) {
      leftovers.push(stripThemeHomeLayoutFields(element));
    }
  });

  const laidOut = placements.map((item) => ({
    ...stripThemeHomeLayoutFields(item.element),
    zone: item.zone,
    colStart: item.colStart,
    rowStart: item.rowStart,
  }));

  return [...nonLayout, ...laidOut, ...leftovers];
};

export const resolveHomeFrameMetrics = (params: {
  width: number;
  height: number;
  cols: number;
  rows: number;
  dockCols: number;
  layout: ThemeHomeLayout;
  dockAlignWithGrid: boolean;
  /** false 时不预留/渲染 Dock（如 list_view_short） */
  withDock?: boolean;
}) => {
  const {
    width,
    height,
    cols,
    rows,
    dockCols,
    layout,
    dockAlignWithGrid,
    withDock = true,
  } = params;
  const { width: gridW, height: gridH } = getGridSize(cols, rows, layout);
  const dockInnerW = dockCols * layout.cell + Math.max(0, dockCols - 1) * layout.gapX;
  const dockOuterW = dockInnerW + layout.dockPadding * 2;
  const dockOuterH = layout.cell + layout.dockPadding * 2;

  const innerW = width - layout.padX * 2;

  if (!withDock) {
    const heightBudget = Math.max(height - layout.padTop - layout.dockBottom, 1);
    const fitScale = Math.min(innerW / gridW, heightBudget / gridH, 1);
    const gridDisplayW = gridW * fitScale;
    const gridLeft = layout.padX + Math.max(innerW - gridDisplayW, 0) / 2;
    return {
      gridW,
      gridH,
      dockInnerW: 0,
      dockOuterW: 0,
      dockOuterH: 0,
      fitScale,
      dockScale: 1,
      dockDisplayW: 0,
      dockDisplayH: 0,
      contentBottom: layout.dockBottom,
      dockLeft: 0,
      gridLeft,
    };
  }

  const heightBudget = Math.max(height - layout.padTop - layout.dockBottom - layout.dockGap, 1);
  const fitScale = dockAlignWithGrid
    ? Math.min(innerW / gridW, heightBudget / (gridH + dockOuterH), 1)
    : Math.min(innerW / gridW, Math.max(heightBudget - dockOuterH, 1) / gridH, 1);

  const dockAvailW = Math.max(width - layout.dockSide * 2, 1);
  const dockScale = dockAlignWithGrid ? fitScale : Math.min(dockAvailW / dockOuterW, 1);
  const dockDisplayW = dockOuterW * dockScale;
  const dockDisplayH = dockOuterH * dockScale;
  const contentBottom = layout.dockBottom + dockDisplayH + layout.dockGap;

  const gridDisplayW = gridW * fitScale;
  const gridLeft = layout.padX + Math.max(innerW - gridDisplayW, 0) / 2;
  const dockLeft = dockAlignWithGrid
    ? gridLeft - layout.dockPadding * dockScale
    : (width - dockDisplayW) / 2;

  return {
    gridW,
    gridH,
    dockInnerW,
    dockOuterW,
    dockOuterH,
    fitScale,
    dockScale,
    dockDisplayW,
    dockDisplayH,
    contentBottom,
    dockLeft,
    gridLeft,
  };
};
