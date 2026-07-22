import type { ReactNode } from 'react';
import GridSpanLayout from '@/pages/editor-xyflow/components/GridSpanLayout';
import AppIcon from '../icon';
import { CONFIG_SIZE_MAP, TYPE_WIDGET_MAP } from '../widget/base-config';
import { xyFlowTypeNodeType } from '../xyFlowTypeNodeType';

const DEFAULT_COLS = 4;
const DEFAULT_ROWS = 6;
const DOCK_COLS = 4;
const DOCK_ROWS = 1;

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

/** list_view 492 宽：略小于手机主屏，收紧间距以保证格子可读、内容完整 */
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

const getGridSize = (cols: number, rows: number, layout: ThemeHomeLayout) => ({
  width: cols * layout.cell + Math.max(0, cols - 1) * layout.gapX,
  height: rows * layout.cell + Math.max(0, rows - 1) * layout.gapY,
});

const spanPxX = (n: number, layout: ThemeHomeLayout) =>
  n * layout.cell + Math.max(0, n - 1) * layout.gapX;
const spanPxY = (n: number, layout: ThemeHomeLayout) =>
  n * layout.cell + Math.max(0, n - 1) * layout.gapY;

/** icon=1×1；widget: small=2×2 / medium=4×2 / large=4×4 */
const getElementSpan = (element: any): { colSpan: number; rowSpan: number } => {
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

const createOccupiedGrid = (cols: number, rows: number) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

const canPlace = (
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

const markOccupied = (
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
const findNextSlot = (
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

const resolveWidgetXyflowType = (type: number, layoutType?: number) => {
  const wt = TYPE_WIDGET_MAP[type];
  if (!wt) return '';
  return `${wt}_${layoutType || 0}`;
};

const renderIconCell = (element: any) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <AppIcon data={element.data} scale={1} />
  </div>
);

const renderWidgetCell = (
  element: any,
  colSpan: number,
  rowSpan: number,
  layout: ThemeHomeLayout,
) => {
  const platformData = element?.data ?? {};
  const sizeItem = Array.isArray(platformData.sizes) ? platformData.sizes[0] : null;
  if (!sizeItem) return null;

  const xyflowType = resolveWidgetXyflowType(
    Number(platformData.type),
    Number(sizeItem.layoutType) || 0,
  );
  const Comp = xyflowType ? xyFlowTypeNodeType[xyflowType] : null;
  if (!Comp) return null;

  const design = CONFIG_SIZE_MAP[sizeItem.size] || CONFIG_SIZE_MAP[1];
  const slotW = spanPxX(colSpan, layout);
  const slotH = spanPxY(rowSpan, layout);
  const scale = Math.min(slotW / design.width, slotH / design.height);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div style={{ width: design.width * scale, height: design.height * scale, overflow: 'hidden' }}>
        <Comp data={sizeItem} scale={scale} parentData={platformData} />
      </div>
    </div>
  );
};

export type ThemeHomePreviewProps = {
  data?: any;
  defaultWidth?: number;
  defaultHeight?: number;
  /** 主网格列数，默认 4 */
  cols?: number;
  /** 主网格行数，默认 6；short 用 5 */
  rows?: number;
  /** Dock 列数，默认 4 */
  dockCols?: number;
  /**
   * Dock 是否与主网格列对齐。
   * - auto（默认）：cols === dockCols 时对齐
   * - true / false：强制开/关（后续 Dock 列数不同时可关）
   */
  dockAlignWithGrid?: boolean | 'auto';
  /** 格子/边距尺度，默认手机主屏；list_view 用 LIST_HOME_LAYOUT */
  layout?: ThemeHomeLayout;
};

export default function ThemeHomePreview(props: ThemeHomePreviewProps) {
  const data = props.data;
  if (!data) return null;

  const layout = props.layout ?? PHONE_HOME_LAYOUT;
  const cols = Number(props.cols) > 0 ? Math.floor(Number(props.cols)) : DEFAULT_COLS;
  const rows = Number(props.rows) > 0 ? Math.floor(Number(props.rows)) : DEFAULT_ROWS;
  const dockCols =
    Number(props.dockCols) > 0 ? Math.floor(Number(props.dockCols)) : DOCK_COLS;
  const dockAlignWithGrid =
    props.dockAlignWithGrid === true
      ? true
      : props.dockAlignWithGrid === false
        ? false
        : cols === dockCols;
  const { width: GRID_W, height: GRID_H } = getGridSize(cols, rows, layout);
  const dockInnerW = dockCols * layout.cell + Math.max(0, dockCols - 1) * layout.gapX;
  const dockOuterW = dockInnerW + layout.dockPadding * 2;
  const dockOuterH = layout.cell + layout.dockPadding * 2;

  const showElements = Array.isArray(data.showElements) ? data.showElements : [];
  let wallpaper: any = null;
  const gridSpanLayoutItems: ReactNode[] = [];
  const dockSpanLayoutItems: ReactNode[] = [];
  const occupied = createOccupiedGrid(cols, rows);
  let dockFilled = 0;

  showElements.forEach((element: any) => {
    if (element.category === 'wallpaper') {
      wallpaper = element;
      return;
    }

    if (element.category !== 'iconpack' && element.category !== 'widget') return;

    const { colSpan, rowSpan } = getElementSpan(element);
    const slot = findNextSlot(occupied, cols, rows, colSpan, rowSpan);

    if (slot) {
      markOccupied(occupied, slot.rowStart, slot.colStart, rowSpan, colSpan);

      const content =
        element.category === 'iconpack'
          ? renderIconCell(element)
          : renderWidgetCell(element, colSpan, rowSpan, layout);

      if (!content) return;

      gridSpanLayoutItems.push(
        <GridSpanLayout.Item
          key={String(element.key ?? `${element.category}-${slot.rowStart}-${slot.colStart}`)}
          colSpan={colSpan}
          rowSpan={rowSpan}
          colStart={slot.colStart}
          rowStart={slot.rowStart}
        >
          {content}
        </GridSpanLayout.Item>,
      );
      return;
    }

    // 主网格放不下时：仅 iconpack 1×1 进 Dock
    if (element.category !== 'iconpack' || dockFilled >= dockCols) return;

    const dockColStart = dockFilled + 1;
    dockFilled += 1;
    dockSpanLayoutItems.push(
      <GridSpanLayout.Item
        key={String(element.key ?? `dock-${dockColStart}`)}
        colSpan={1}
        rowSpan={1}
        colStart={dockColStart}
        rowStart={1}
      >
        {renderIconCell(element)}
      </GridSpanLayout.Item>,
    );
  });

  const width = Number(data.width) > 0 ? Number(data.width) : (props.defaultWidth ?? 887);
  const height = Number(data.height) > 0 ? Number(data.height) : (props.defaultHeight ?? 1920);

  const innerW = width - layout.padX * 2;
  // 预留 Dock 高度后，主网格与（对齐模式下的）Dock 共用同一 fitScale
  const heightBudget = Math.max(height - layout.padTop - layout.dockBottom - layout.dockGap, 1);
  const fitScale = dockAlignWithGrid
    ? Math.min(innerW / GRID_W, heightBudget / (GRID_H + dockOuterH), 1)
    : Math.min(
        innerW / GRID_W,
        Math.max(heightBudget - dockOuterH, 1) / GRID_H,
        1,
      );

  const dockAvailW = Math.max(width - layout.dockSide * 2, 1);
  const dockScale = dockAlignWithGrid
    ? fitScale
    : Math.min(dockAvailW / dockOuterW, 1);
  const dockDisplayW = dockOuterW * dockScale;
  const dockDisplayH = dockOuterH * dockScale;
  const contentBottom = layout.dockBottom + dockDisplayH + layout.dockGap;

  const gridDisplayW = GRID_W * fitScale;
  const gridLeft = layout.padX + Math.max(innerW - gridDisplayW, 0) / 2;
  // 对齐：Dock 内格左缘 = 主网格左缘；不对齐：水平居中
  const dockLeft = dockAlignWithGrid
    ? gridLeft - layout.dockPadding * dockScale
    : (width - dockDisplayW) / 2;

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {wallpaper?.data?.source ? (
        <img
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          src={wallpaper.data.source}
          alt=""
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          top: layout.padTop,
          left: layout.padX,
          right: layout.padX,
          bottom: contentBottom,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: GRID_W * fitScale,
            height: GRID_H * fitScale,
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: GRID_W,
              height: GRID_H,
              transform: `scale(${fitScale})`,
              transformOrigin: '0 0',
            }}
          >
            <GridSpanLayout
              rows={rows}
              cols={cols}
              gap={[layout.gapX, layout.gapY]}
              style={{
                position: 'relative',
                zIndex: 2,
                width: GRID_W,
                height: GRID_H,
                gridTemplateColumns: `repeat(${cols}, ${layout.cell}px)`,
                gridTemplateRows: `repeat(${rows}, ${layout.cell}px)`,
              }}
            >
              {gridSpanLayoutItems}
            </GridSpanLayout>
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          zIndex: 2,
          bottom: layout.dockBottom,
          left: dockLeft,
          width: dockDisplayW,
          height: dockDisplayH,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: dockOuterW,
            height: dockOuterH,
            padding: layout.dockPadding,
            boxSizing: 'border-box',
            borderRadius: layout.dockRadius,
            background: 'rgba(255, 255, 255, 0.22)',
            backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
            border: '1px solid rgba(255, 255, 255, 0.28)',
            transform: `scale(${dockScale})`,
            transformOrigin: '0 0',
          }}
        >
          <GridSpanLayout
            rows={DOCK_ROWS}
            cols={dockCols}
            gap={[layout.gapX, 0]}
            style={{
              width: dockInnerW,
              height: layout.cell,
              gridTemplateColumns: `repeat(${dockCols}, ${layout.cell}px)`,
              gridTemplateRows: `${layout.cell}px`,
            }}
          >
            {dockSpanLayoutItems}
          </GridSpanLayout>
        </div>
      </div>
    </div>
  );
}
