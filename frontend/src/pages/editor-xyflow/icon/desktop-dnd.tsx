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
/** 水平间距（可单独调） */
export const GAP_X = 20;
/** 垂直间距（可单独调） */
export const GAP_Y = 20;
/** @deprecated 使用 GAP_X；保留兼容旧引用 */
export const GAP = GAP_X;

/** 支持的占格：1×1 / 2×2 / 4×2 / 4×4 */
export type CellSpan = 1 | 2 | 4;

export type SpanAxis = 'x' | 'y';

/**
 * span 个格子占用的像素边长。
 * icon 恒为 CELL(180)；间距按轴向用 GAP_X / GAP_Y。
 * 例：colSpan=2 → 2*180 + GAP_X
 * 例：rowSpan=2 → 2*180 + GAP_Y
 */
export const getSpanPixelSize = (span: number, axis: SpanAxis = 'x') => {
  const gap = axis === 'x' ? GAP_X : GAP_Y;
  return span * CELL + Math.max(0, span - 1) * gap;
};

/**
 * 设计稿尺寸等比例适配桌面占格（cover）。
 * - icon 格子本身仍是 180×180
 * - scale = max(scaleX, scaleY)，等比例铺满格子；多出的边会被裁切
 * - 大尺寸 329×345 进 4×4 时，原先用 min 会被高度卡住导致宽度留白
 */
export const getDesktopFitMetrics = (
  designWidth: number,
  designHeight: number,
  colSpan: number,
  rowSpan: number = colSpan,
) => {
  const slotWidth = getSpanPixelSize(colSpan, 'x');
  const slotHeight = getSpanPixelSize(rowSpan, 'y');
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
  columns: number;
  rows: number;
};

const DesktopDndContext = createContext<DesktopDndContextValue | null>(null);

export function useDesktopIcons() {
  const ctx = useContext(DesktopDndContext);
  if (!ctx) {
    throw new Error('useDesktopIcons must be used within DesktopDndProvider');
  }
  return ctx.icons;
}

export function useDesktopGridSize(): GridSize {
  const ctx = useContext(DesktopDndContext);
  if (!ctx) {
    throw new Error('useDesktopGridSize must be used within DesktopDndProvider');
  }
  return { columns: ctx.columns, rows: ctx.rows };
}

export function DesktopDndProvider({
  children,
  initialIcons = [],
  columns,
  rows,
}: {
  children: ReactNode;
  /** desketopShow 转换后的列表；变化时同步，不整树 remount */
  initialIcons?: DesktopIcon[];
  /** 网格列数（来自当前 preview.data.col，每个 preview 各自不同） */
  columns: number;
  /** 网格行数（来自当前 preview.data.row，每个 preview 各自不同） */
  rows: number;
}) {
  const grid = useMemo(
    () => ({ columns, rows }),
    [columns, rows],
  );
  const [icons, setIcons] = useState<DesktopIcon[]>(initialIcons);

  useEffect(() => {
    setIcons((prev) => {
      const next = mergeDesktopIconsFromSource(prev, initialIcons, grid);
      const unchanged =
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
      return unchanged ? prev : next;
    });
  }, [initialIcons, grid]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const source = event.operation.source;
      const slot = parseSlotId(event.operation.target?.id);
      if (event.canceled || source?.id == null || !slot) return;

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

      setIcons((prev) =>
        moveIcon(prev, String(source.id), slot.col, slot.row, grid),
      );
    },
    [grid],
  );

  const value = useMemo(
    () => ({ icons, columns: grid.columns, rows: grid.rows }),
    [icons, grid],
  );

  return (
    <DesktopDndContext.Provider value={value}>
      <DragDropProvider onDragEnd={handleDragEnd}>{children}</DragDropProvider>
    </DesktopDndContext.Provider>
  );
}
