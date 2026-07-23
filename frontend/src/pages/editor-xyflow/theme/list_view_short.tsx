import type { ReactNode } from 'react';
import GridSpanLayout from '@/pages/editor-xyflow/components/GridSpanLayout';
import AppIcon from '../icon';

const COLS = 4;
const ROWS = 3;
const PAD = 50;
const GAP = 20;
const ICON_BASE = 180;
const DEFAULT_WIDTH = 738;
const DEFAULT_HEIGHT = 564;

const createOccupiedGrid = (cols: number, rows: number) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

const canPlace = (
  occupied: boolean[][],
  cols: number,
  rows: number,
  rowStart: number,
  colStart: number,
) => {
  if (rowStart > rows || colStart > cols) return false;
  return !occupied[rowStart - 1][colStart - 1];
};

const markOccupied = (
  occupied: boolean[][],
  rowStart: number,
  colStart: number,
) => {
  occupied[rowStart - 1][colStart - 1] = true;
};

const findNextSlot = (
  occupied: boolean[][],
  cols: number,
  rows: number,
): { colStart: number; rowStart: number } | null => {
  for (let rowStart = 1; rowStart <= rows; rowStart += 1) {
    for (let colStart = 1; colStart <= cols; colStart += 1) {
      if (canPlace(occupied, cols, rows, rowStart, colStart)) {
        return { colStart, rowStart };
      }
    }
  }
  return null;
};

/** 4×3 短列表：上下左右边距 50，无 Dock、无 app name */
export default function ListViewShort(props: any) {
  const data = props.data;
  if (!data) return null;

  const width = Number(data.width) > 0 ? Number(data.width) : DEFAULT_WIDTH;
  const height = Number(data.height) > 0 ? Number(data.height) : DEFAULT_HEIGHT;
  const innerW = Math.max(width - PAD * 2, 1);
  const innerH = Math.max(height - PAD * 2, 1);
  const cellW = (innerW - GAP * (COLS - 1)) / COLS;
  const cellH = (innerH - GAP * (ROWS - 1)) / ROWS;
  const cell = Math.min(cellW, cellH);
  const iconScale = cell / ICON_BASE;

  const showElements = Array.isArray(data.showElements) ? data.showElements : [];
  let wallpaper: any = null;
  const items: ReactNode[] = [];
  const occupied = createOccupiedGrid(COLS, ROWS);

  showElements.forEach((element: any) => {
    if (element?.category === 'wallpaper') {
      wallpaper = element;
      return;
    }
    if (element?.category !== 'iconpack') return;

    const slot = findNextSlot(occupied, COLS, ROWS);
    if (!slot) return;
    markOccupied(occupied, slot.rowStart, slot.colStart);

    items.push(
      <GridSpanLayout.Item
        key={String(element.key ?? `${slot.rowStart}-${slot.colStart}`)}
        colSpan={1}
        rowSpan={1}
        colStart={slot.colStart}
        rowStart={slot.rowStart}
      >
        <div
          style={{
            width: cell,
            height: cell,
            overflow: 'hidden',
          }}
        >
          <AppIcon data={element.data} scale={iconScale} />
        </div>
      </GridSpanLayout.Item>,
    );
  });

  // showElements 中的 wallpaper 优先；否则用 data.source 作背景
  const wallpaperSource = String(wallpaper?.data?.source || '').trim();
  const dataSource = String(data.source || '').trim();
  const backgroundSource = wallpaperSource || dataSource;

  return (
    <div
      style={{
        width,
        height,
        padding: PAD,
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {backgroundSource ? (
        <img
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          src={backgroundSource}
          alt=""
        />
      ) : null}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <GridSpanLayout
          rows={ROWS}
          cols={COLS}
          gap={GAP}
          style={{
            width: cell * COLS + GAP * (COLS - 1),
            height: cell * ROWS + GAP * (ROWS - 1),
            gridTemplateColumns: `repeat(${COLS}, ${cell}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${cell}px)`,
          }}
        >
          {items}
        </GridSpanLayout>
      </div>
    </div>
  );
}
