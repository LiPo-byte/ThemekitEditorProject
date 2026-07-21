import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react';
import { nanoid } from 'nanoid';

export type GridSize = {
  columns: number;
  rows: number;
};

/** 仅当节点未配置 col/row 时的兜底；有 data 时以节点自身为准 */
export const DEFAULT_PREVIEW_GRID: GridSize = { columns: 4, rows: 5 };

/**
 * 从 preview.data.col / preview.data.row 解析网格尺寸。
 * 每个 preview 各自独立；缺省或非法时用 fallback，不写死所有节点同一尺寸。
 */
export const parseGridSize = (
  col: unknown,
  row: unknown,
  fallback: GridSize = DEFAULT_PREVIEW_GRID,
): GridSize => {
  const columns = Math.floor(Number(col));
  const rows = Math.floor(Number(row));
  return {
    columns:
      Number.isFinite(columns) && columns >= 1 ? columns : fallback.columns,
    rows: Number.isFinite(rows) && rows >= 1 ? rows : fallback.rows,
  };
};

/** 桌面单格 icon 固定边长（不随 gap 变化） */
export const CELL = 180;
/** 组件下方名称占位高度（withName 时计入网格行高） */
export const NAME_HEIGHT = 36;
/** @deprecated 使用 getCellSlotY(withName)；保留兼容 */
export const CELL_SLOT_Y = CELL + NAME_HEIGHT;
/** 水平间距（可单独调） */
export const GAP_X = 20;
/** 垂直间距（可单独调） */
export const GAP_Y = 20;
/** 桌面格栅拖拽开关；先关闭，后续要开改 true 即可 */
export const DESKTOP_DND_ENABLED = false;

/** 主网格上下边距默认值（preview.data.gridPaddingY 未配时用 0） */
export const DEFAULT_GRID_PADDING_Y = 100;
/** 主网格与底部 banner（Dock）之间的间距 */
export const BANNER_GAP = 48;
/** Dock 内边距 */
export const BANNER_PADDING = 20;

/** 从 preview.data.gridPaddingY 解析上下内边距；非法/缺省为 0 */
export const parseGridPaddingY = (value: unknown): number => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
/** @deprecated 使用 GAP_X；保留兼容旧引用 */
export const GAP = GAP_X;

/** 支持的占格：1×1 / 2×2 / 4×2 / 4×4 */
export type CellSpan = 1 | 2 | 4;

export type SpanAxis = 'x' | 'y';

/** withName=false 时为正方形 CELL；true 时为 CELL + NAME_HEIGHT */
export const getCellSlotY = (withName: boolean) =>
  withName ? CELL + NAME_HEIGHT : CELL;

/**
 * span 个格子占用的像素边长。
 * - x：icon 宽 CELL；间距 GAP_X
 * - y：随 withName 决定是否含 name 占位
 */
export const getSpanPixelSize = (
  span: number,
  axis: SpanAxis = 'x',
  withName = true,
) => {
  if (axis === 'x') {
    return span * CELL + Math.max(0, span - 1) * GAP_X;
  }
  const cellY = getCellSlotY(withName);
  return span * cellY + Math.max(0, span - 1) * GAP_Y;
};

/** 组件内容区高度（withName 时不含底部 name 带） */
export const getContentSpanHeight = (rowSpan: number, withName = true) =>
  withName
    ? getSpanPixelSize(rowSpan, 'y', true) - NAME_HEIGHT
    : getSpanPixelSize(rowSpan, 'y', false);

/**
 * 设计稿尺寸等比例适配桌面占格（cover）。
 * - 适配区域为内容区（withName 时不含 name 高度）
 * - scale = max(scaleX, scaleY)，等比例铺满；多出的边会被裁切
 */
export const getDesktopFitMetrics = (
  designWidth: number,
  designHeight: number,
  colSpan: number,
  rowSpan: number = colSpan,
  withName = true,
) => {
  const slotWidth = getSpanPixelSize(colSpan, 'x', withName);
  const slotHeight = getContentSpanHeight(rowSpan, withName);
  const scaleX = slotWidth / designWidth;
  const scaleY = slotHeight / designHeight;
  const scale = Math.max(scaleX, scaleY);
  return {
    slotWidth,
    slotHeight,
    scaleX,
    scaleY,
    scale,
    fittedWidth: designWidth * scale,
    fittedHeight: designHeight * scale,
    cell: CELL,
    gapX: GAP_X,
    gapY: GAP_Y,
    nameHeight: withName ? NAME_HEIGHT : 0,
  };
};

export interface DesktopIcon {
  id: string;
  label: string;
  col: number;
  row: number;
  colSpan: CellSpan;
  rowSpan: CellSpan;
  /** 对应 xyFlowTypeNodeType 的 key，用于渲染真实组件 */
  xyflowType?: string;
  /** 传给对应组件的 data */
  data?: Record<string, any>;
  /** 是否在组件下方显示名称；默认 true，可显式 false 关闭 */
  showName?: boolean;
}

export interface CellPos {
  col: number;
  row: number;
}

export type PaletteDragData = {
  type: 'palette';
  label: string;
  colSpan: CellSpan;
  rowSpan: CellSpan;
};

export const PALETTE_ITEM_ID = 'palette-111';

export const PALETTE_ITEM_DATA: PaletteDragData = {
  type: 'palette',
  label: 'New',
  colSpan: 1,
  rowSpan: 1,
};

export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

export function slotId(col: number, row: number): string {
  return `slot-${col}-${row}`;
}

export function parseSlotId(id: string | number | undefined): CellPos | null {
  if (typeof id !== 'string' || !id.startsWith('slot-')) return null;
  const parts = id.split('-');
  if (parts.length !== 3) return null;
  const col = Number(parts[1]);
  const row = Number(parts[2]);
  if (!Number.isInteger(col) || !Number.isInteger(row)) return null;
  return { col, row };
}

export function bannerSlotId(col: number): string {
  return `banner-slot-${col}`;
}

export function parseBannerSlotId(
  id: string | number | undefined,
): number | null {
  if (typeof id !== 'string' || !id.startsWith('banner-slot-')) return null;
  const col = Number(id.slice('banner-slot-'.length));
  if (!Number.isInteger(col) || col < 0) return null;
  return col;
}

/**
 * 开启 banner 时：按顺序优先往主网格放；主网格放不下的再进 Dock。
 * Dock 最多 bannerSlots 个（通常等于 preview.col）；两边都满则丢弃。
 */
export const splitDesketopShowForBanner = (
  desketopShow: unknown,
  grid: GridSize,
  bannerSlots: number = grid.columns,
): { gridItems: any[]; bannerItems: any[] } => {
  if (!Array.isArray(desketopShow)) {
    return { gridItems: [], bannerItems: [] };
  }
  if (desketopShow.length === 0) {
    return { gridItems: [], bannerItems: [] };
  }

  const gridItems: any[] = [];
  const bannerItems: any[] = [];

  desketopShow.forEach((item) => {
    if (!item || typeof item !== 'object') return;

    // 用现有转换逻辑探测：加入后 icons 变多说明主网格还能放下
    const before = desketopShowToDesktopIcons(gridItems, grid);
    const after = desketopShowToDesktopIcons([...gridItems, item], grid);
    if (after.length > before.length) {
      gridItems.push(item);
      return;
    }

    if (bannerSlots > 0 && bannerItems.length < bannerSlots) {
      bannerItems.push(item);
    }
  });

  return { gridItems, bannerItems };
};

/**
 * banner 项转 DesktopIcon：强制 1×1、单行按序落位，不显示 name。
 */
export const bannerItemsToDesktopIcons = (
  bannerItems: unknown,
  columns: number,
): DesktopIcon[] => {
  if (!Array.isArray(bannerItems) || !(columns > 0)) return [];
  const result: DesktopIcon[] = [];
  bannerItems.slice(0, columns).forEach((item, index) => {
    const converted = desketopShowToDesktopIcons([item], {
      columns: 1,
      rows: 1,
    });
    const icon = converted[0];
    if (!icon) return;
    result.push({
      ...icon,
      col: index,
      row: 0,
      colSpan: 1,
      rowSpan: 1,
      showName: false,
    });
  });
  return result;
};

export function getOccupiedKeys(
  icons: DesktopIcon[],
  excludeId?: string,
): Set<string> {
  const occupied = new Set<string>();
  for (const icon of icons) {
    if (icon.id === excludeId) continue;
    for (let r = icon.row; r < icon.row + icon.rowSpan; r += 1) {
      for (let c = icon.col; c < icon.col + icon.colSpan; c += 1) {
        occupied.add(cellKey(c, r));
      }
    }
  }
  return occupied;
}

export function canPlace(
  icons: DesktopIcon[],
  icon: Pick<DesktopIcon, 'id' | 'colSpan' | 'rowSpan'>,
  col: number,
  row: number,
  grid: GridSize,
): boolean {
  if (col < 0 || row < 0) return false;
  if (col + icon.colSpan > grid.columns || row + icon.rowSpan > grid.rows) {
    return false;
  }
  const occupied = getOccupiedKeys(icons, icon.id);
  for (let r = row; r < row + icon.rowSpan; r += 1) {
    for (let c = col; c < col + icon.colSpan; c += 1) {
      if (occupied.has(cellKey(c, r))) return false;
    }
  }
  return true;
}

export function moveIcon(
  icons: DesktopIcon[],
  id: string,
  col: number,
  row: number,
  grid: GridSize,
): DesktopIcon[] {
  const icon = icons.find((item) => item.id === id);
  if (!icon) return icons;
  if (icon.col === col && icon.row === row) return icons;
  if (!canPlace(icons, icon, col, row, grid)) return icons;
  return icons.map((item) =>
    item.id === id ? { ...item, col, row } : item,
  );
}

/** pureImage size → 桌面占格（4 列网格） */
const PUREIMAGE_SIZE_SPAN: Record<number, { colSpan: CellSpan; rowSpan: CellSpan }> = {
  1: { colSpan: 2, rowSpan: 2 },
  2: { colSpan: 4, rowSpan: 2 },
  3: { colSpan: 4, rowSpan: 4 },
};

const findFirstAvailableSlot = (
  icons: DesktopIcon[],
  colSpan: CellSpan,
  rowSpan: CellSpan,
  grid: GridSize,
): CellPos | null => {
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.columns; col += 1) {
      if (
        canPlace(icons, { id: '__placing__', colSpan, rowSpan }, col, row, grid)
      ) {
        return { col, row };
      }
    }
  }
  return null;
};

/**
 * 将 preview.data.desketopShow 转为 DesktopIcon[]。
 * - app → 1×1
 * - pureImage size1/2/3 → 2×2 / 4×2 / 4×4
 * 若无 col/row，则按顺序自动找空位摆放。
 */
export const desketopShowToDesktopIcons = (
  desketopShow: unknown,
  grid: GridSize,
): DesktopIcon[] => {
  if (!Array.isArray(desketopShow)) return [];

  const result: DesktopIcon[] = [];

  desketopShow.forEach((item: any, index: number) => {
    if (!item || typeof item !== 'object') return;

    const id = String(item.element_key ?? `desktop-${index}`);
    let label = id;
    let colSpan: CellSpan = 1;
    let rowSpan: CellSpan = 1;
    let xyflowType = typeof item.xyflowType === 'string' ? item.xyflowType : undefined;
    let data: Record<string, any> | undefined;

    let showName: boolean | undefined =
      typeof item.showName === 'boolean' ? item.showName : undefined;

    if (item.app) {
      label = String(item.app.name ?? item.app.key ?? id);
      colSpan = 1;
      rowSpan = 1;
      xyflowType = xyflowType || 'icon';
      data = { ...item.app };
    } else if (item.config?.sizes?.[0]) {
      const sizeItem = item.config.sizes[0];
      const size = Number(sizeItem?.size ?? 1);
      label = String(sizeItem?.name ?? `size_${size}`);
      const span = PUREIMAGE_SIZE_SPAN[size] ?? PUREIMAGE_SIZE_SPAN[1];
      colSpan = span.colSpan;
      rowSpan = span.rowSpan;
      xyflowType = xyflowType || 'pureimage_0';
      data = { ...sizeItem };
    } else {
      label = String(item.name ?? item.label ?? id);
      if (typeof item.colSpan === 'number') colSpan = item.colSpan as CellSpan;
      if (typeof item.rowSpan === 'number') rowSpan = item.rowSpan as CellSpan;
      data = item.data && typeof item.data === 'object' ? { ...item.data } : undefined;
    }
    // 默认都显示名字（含多格组件）；显式 showName: false 可关闭
    if (showName === undefined) showName = true;

    let col = typeof item.col === 'number' ? item.col : null;
    let row = typeof item.row === 'number' ? item.row : null;

    if (
      col == null ||
      row == null ||
      !canPlace(result, { id, colSpan, rowSpan }, col, row, grid)
    ) {
      const slot = findFirstAvailableSlot(result, colSpan, rowSpan, grid);
      if (!slot) return;
      col = slot.col;
      row = slot.row;
    }

    result.push({
      id,
      label,
      col,
      row,
      colSpan,
      rowSpan,
      xyflowType,
      data,
      showName: Boolean(showName),
    });
  });

  return result;
};

/**
 * 用最新 sourceIcons 同步桌面列表：
 * - 仍存在的项保留原 col/row（拖拽位置不丢）
 * - 新增项自动找空位
 * - 已删除项移除
 */
export const mergeDesktopIconsFromSource = (
  prev: DesktopIcon[],
  sourceIcons: DesktopIcon[],
  grid: GridSize,
): DesktopIcon[] => {
  const prevById = new Map(prev.map((item) => [item.id, item]));
  const next: DesktopIcon[] = [];

  sourceIcons.forEach((item) => {
    const old = prevById.get(item.id);
    if (
      old &&
      canPlace(
        next,
        { id: item.id, colSpan: item.colSpan, rowSpan: item.rowSpan },
        old.col,
        old.row,
        grid,
      )
    ) {
      next.push({
        ...item,
        col: old.col,
        row: old.row,
      });
      return;
    }

    const preferredCol = typeof item.col === 'number' ? item.col : null;
    const preferredRow = typeof item.row === 'number' ? item.row : null;
    if (
      preferredCol != null &&
      preferredRow != null &&
      canPlace(
        next,
        { id: item.id, colSpan: item.colSpan, rowSpan: item.rowSpan },
        preferredCol,
        preferredRow,
        grid,
      )
    ) {
      next.push({ ...item, col: preferredCol, row: preferredRow });
      return;
    }

    const slot = findFirstAvailableSlot(next, item.colSpan, item.rowSpan, grid);
    if (!slot) return;
    next.push({ ...item, col: slot.col, row: slot.row });
  });

  return next;
};

function isPaletteData(data: unknown): data is PaletteDragData {
  return (
    !!data &&
    typeof data === 'object' &&
    (data as PaletteDragData).type === 'palette'
  );
}

type DesktopDndContextValue = {
  icons: DesktopIcon[];
  /** 底部 Dock icons；withBanner=false 时为空 */
  bannerIcons: DesktopIcon[];
  columns: number;
  rows: number;
  /** preview 级开关：false 时正方形格子、不渲染 name */
  withName: boolean;
  /** preview 级开关：true 时主网格下方显示 Dock */
  withBanner: boolean;
  /** preview 级：主网格上下内边距（px） */
  gridPaddingY: number;
};

const DesktopDndContext = createContext<DesktopDndContextValue | null>(null);

const isSameIconLayout = (prev: DesktopIcon[], next: DesktopIcon[]) =>
  prev.length === next.length &&
  prev.every((item, index) => {
    const other = next[index];
    return (
      item.id === other.id &&
      item.col === other.col &&
      item.row === other.row &&
      item.colSpan === other.colSpan &&
      item.rowSpan === other.rowSpan &&
      item.xyflowType === other.xyflowType &&
      item.label === other.label
    );
  });

export function useDesktopIcons() {
  const ctx = useContext(DesktopDndContext);
  if (!ctx) {
    throw new Error('useDesktopIcons must be used within DesktopDndProvider');
  }
  return ctx.icons;
}

export function useDesktopBannerIcons() {
  const ctx = useContext(DesktopDndContext);
  if (!ctx) {
    throw new Error(
      'useDesktopBannerIcons must be used within DesktopDndProvider',
    );
  }
  return ctx.bannerIcons;
}

export function useDesktopGridSize(): GridSize {
  const ctx = useContext(DesktopDndContext);
  if (!ctx) {
    throw new Error('useDesktopGridSize must be used within DesktopDndProvider');
  }
  return { columns: ctx.columns, rows: ctx.rows };
}

export function useDesktopWithName() {
  const ctx = useContext(DesktopDndContext);
  if (!ctx) {
    throw new Error('useDesktopWithName must be used within DesktopDndProvider');
  }
  return ctx.withName;
}

export function useDesktopWithBanner() {
  const ctx = useContext(DesktopDndContext);
  if (!ctx) {
    throw new Error(
      'useDesktopWithBanner must be used within DesktopDndProvider',
    );
  }
  return ctx.withBanner;
}

export function useDesktopGridPaddingY() {
  const ctx = useContext(DesktopDndContext);
  if (!ctx) {
    throw new Error(
      'useDesktopGridPaddingY must be used within DesktopDndProvider',
    );
  }
  return ctx.gridPaddingY;
}

export function DesktopDndProvider({
  children,
  initialIcons = [],
  initialBannerIcons = [],
  columns,
  rows,
  withName = true,
  withBanner = false,
  gridPaddingY = 0,
}: {
  children: ReactNode;
  /** desketopShow 转换后的主网格列表；变化时同步，不整树 remount */
  initialIcons?: DesktopIcon[];
  /** desketopShow 末尾拆出的 Dock 列表 */
  initialBannerIcons?: DesktopIcon[];
  /** 网格列数（来自当前 preview.data.col，每个 preview 各自不同） */
  columns: number;
  /** 网格行数（来自当前 preview.data.row，每个 preview 各自不同） */
  rows: number;
  /**
   * 是否显示组件下方 name。
   * false：正方形格子（仅 CELL），不占 name 高度。
   */
  withName?: boolean;
  /** 是否显示底部 Dock；默认 false，显式 true 开启 */
  withBanner?: boolean;
  /** 主网格上下内边距（px）；默认 0 */
  gridPaddingY?: number;
}) {
  const grid = useMemo(
    () => ({ columns, rows }),
    [columns, rows],
  );
  const bannerGrid = useMemo(
    () => ({ columns, rows: 1 }),
    [columns],
  );
  const [icons, setIcons] = useState<DesktopIcon[]>(initialIcons);
  const [bannerIcons, setBannerIcons] =
    useState<DesktopIcon[]>(initialBannerIcons);

  useEffect(() => {
    setIcons((prev) => {
      const next = mergeDesktopIconsFromSource(prev, initialIcons, grid);
      return isSameIconLayout(prev, next) ? prev : next;
    });
  }, [initialIcons, grid]);

  useEffect(() => {
    setBannerIcons((prev) => {
      if (!withBanner) return prev.length === 0 ? prev : [];
      const next = mergeDesktopIconsFromSource(
        prev,
        initialBannerIcons,
        bannerGrid,
      );
      return isSameIconLayout(prev, next) ? prev : next;
    });
  }, [initialBannerIcons, bannerGrid, withBanner]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!DESKTOP_DND_ENABLED) return;
      const source = event.operation.source;
      if (event.canceled || source?.id == null) return;

      const bannerCol = parseBannerSlotId(event.operation.target?.id);
      if (bannerCol != null) {
        if (isPaletteData(source.data)) return;
        const id = String(source.id);
        setBannerIcons((prev) => {
          if (!prev.some((item) => item.id === id)) return prev;
          return moveIcon(prev, id, bannerCol, 0, bannerGrid);
        });
        return;
      }

      const slot = parseSlotId(event.operation.target?.id);
      if (!slot) return;

      const data = source.data;
      if (isPaletteData(data)) {
        setIcons((prev) => {
          const nextIcon: DesktopIcon = {
            id: nanoid(),
            label: data.label,
            col: slot.col,
            row: slot.row,
            colSpan: data.colSpan,
            rowSpan: data.rowSpan,
          };
          if (!canPlace(prev, nextIcon, slot.col, slot.row, grid)) return prev;
          return [...prev, nextIcon];
        });
        return;
      }

      const id = String(source.id);
      setIcons((prev) => {
        if (!prev.some((item) => item.id === id)) return prev;
        return moveIcon(prev, id, slot.col, slot.row, grid);
      });
    },
    [grid, bannerGrid],
  );

  const value = useMemo(
    () => ({
      icons,
      bannerIcons,
      columns: grid.columns,
      rows: grid.rows,
      withName: Boolean(withName),
      withBanner: Boolean(withBanner),
      gridPaddingY: parseGridPaddingY(gridPaddingY),
    }),
    [icons, bannerIcons, grid, withName, withBanner, gridPaddingY],
  );

  return (
    <DesktopDndContext.Provider value={value}>
      <DragDropProvider onDragEnd={handleDragEnd}>{children}</DragDropProvider>
    </DesktopDndContext.Provider>
  );
}
