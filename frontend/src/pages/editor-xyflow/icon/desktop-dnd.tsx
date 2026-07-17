import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react';
import { nanoid } from 'nanoid';

export const COLUMNS = 4;
export const ROWS = 8;
export const CELL = 180;
export const GAP = 20;

/** 支持的占格：1×1 / 2×2 / 4×2 / 4×4 */
export type CellSpan = 1 | 2 | 4;

export interface DesktopIcon {
  id: string;
  label: string;
  col: number;
  row: number;
  colSpan: CellSpan;
  rowSpan: CellSpan;
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

const INITIAL_ICONS: DesktopIcon[] = [
  { id: 'size-22', label: '2×2', col: 2, row: 0, colSpan: 2, rowSpan: 2 },
  { id: 'size-42', label: '4×2', col: 0, row: 2, colSpan: 4, rowSpan: 2 },
  { id: 'a', label: 'A', col: 0, row: 0, colSpan: 1, rowSpan: 1 },
  { id: 'b', label: 'B', col: 1, row: 0, colSpan: 1, rowSpan: 1 },
  { id: 'c', label: 'C', col: 0, row: 1, colSpan: 1, rowSpan: 1 },
  { id: 'd', label: 'D', col: 1, row: 1, colSpan: 1, rowSpan: 1 },
];

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
): boolean {
  if (col < 0 || row < 0) return false;
  if (col + icon.colSpan > COLUMNS || row + icon.rowSpan > ROWS) return false;
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
): DesktopIcon[] {
  const icon = icons.find((item) => item.id === id);
  if (!icon) return icons;
  if (icon.col === col && icon.row === row) return icons;
  if (!canPlace(icons, icon, col, row)) return icons;
  return icons.map((item) =>
    item.id === id ? { ...item, col, row } : item,
  );
}

function isPaletteData(data: unknown): data is PaletteDragData {
  return (
    !!data &&
    typeof data === 'object' &&
    (data as PaletteDragData).type === 'palette'
  );
}

type DesktopDndContextValue = {
  icons: DesktopIcon[];
};

const DesktopDndContext = createContext<DesktopDndContextValue | null>(null);

export function useDesktopIcons() {
  const ctx = useContext(DesktopDndContext);
  if (!ctx) {
    throw new Error('useDesktopIcons must be used within DesktopDndProvider');
  }
  return ctx.icons;
}

export function DesktopDndProvider({ children }: { children: ReactNode }) {
  const [icons, setIcons] = useState<DesktopIcon[]>(INITIAL_ICONS);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
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
        if (!canPlace(prev, nextIcon, slot.col, slot.row)) return prev;
        return [...prev, nextIcon];
      });
      return;
    }

    setIcons((prev) => moveIcon(prev, String(source.id), slot.col, slot.row));
  }, []);

  const value = useMemo(() => ({ icons }), [icons]);

  return (
    <DesktopDndContext.Provider value={value}>
      <DragDropProvider onDragEnd={handleDragEnd}>{children}</DragDropProvider>
    </DesktopDndContext.Provider>
  );
}
