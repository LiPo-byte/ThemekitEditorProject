import type { ReactNode } from 'react';
import GridSpanLayout from '@/pages/editor-xyflow/components/GridSpanLayout';
import AppIcon from '../icon';
import { CONFIG_SIZE_MAP, TYPE_WIDGET_MAP } from '../widget/base-config';
import { xyFlowTypeNodeType } from '../xyFlowTypeNodeType';

/** 手机小格；iPad 大格 = 2×2 小格 */
const PHONE_CELL = 180;
const GAP_X = 89;
const GAP_Y = 105;
const NAME_HEIGHT = 36;

const IPAD_CELL_W = PHONE_CELL * 2 + GAP_X; // 449
const IPAD_CELL_H = PHONE_CELL * 2 + GAP_Y; // 465

const DEFAULT_COLS = 4;
const DEFAULT_ROWS = 6;
const DOCK_COLS = 8;
const DOCK_ROWS = 1;
const DOCK_CELL = PHONE_CELL;

const PAD_TOP = 100;
/** 主网格左右边距（相对画布） */
const PAD_X = 200;
const DOCK_BOTTOM = 20;
const DOCK_SIDE = 10;
const DOCK_GAP = 48;
const DOCK_PADDING = 20;
const DOCK_RADIUS = 48;

const getGridSize = (cols: number, rows: number) => ({
  width: cols * IPAD_CELL_W + Math.max(0, cols - 1) * GAP_X,
  height: rows * IPAD_CELL_H + Math.max(0, rows - 1) * GAP_Y,
});

const spanPxX = (n: number) => n * IPAD_CELL_W + Math.max(0, n - 1) * GAP_X;
const spanPxY = (n: number) => n * IPAD_CELL_H + Math.max(0, n - 1) * GAP_Y;

/** icon=1×1；widget: 1→1×1 / 2→2×1 / 3→2×2（按 iPad 大格） */
const getElementSpan = (element: any): { colSpan: number; rowSpan: number } => {
  if (element?.category === 'iconpack') {
    return { colSpan: 1, rowSpan: 1 };
  }
  if (element?.category === 'widget') {
    const size = Number(element?.data?.sizes?.[0]?.size) || 1;
    if (size === 3) return { colSpan: 2, rowSpan: 2 };
    if (size === 2) return { colSpan: 2, rowSpan: 1 };
    return { colSpan: 1, rowSpan: 1 };
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

const renderIconCell = (element: any) => {
  const name = String(element?.data?.name ?? element?.data?.key ?? '');
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      {/* icon + name 紧贴成组，整体在大格内居中 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: PHONE_CELL,
        }}
      >
        <AppIcon data={element.data} scale={1} />
        <div
          style={{
            marginTop: 6,
            height: NAME_HEIGHT,
            width: IPAD_CELL_W - 16,
            maxWidth: IPAD_CELL_W - 16,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 20,
            fontWeight: 500,
            textAlign: 'center',
            lineHeight: 1.15,
            textShadow: '0 1px 2px rgba(0,0,0,0.45)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
          }}
          title={name}
        >
          {name}
        </div>
      </div>
    </div>
  );
};

const renderDockIconCell = (element: any) => (
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

const renderWidgetCell = (element: any, colSpan: number, rowSpan: number) => {
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
  const slotW = spanPxX(colSpan);
  const slotH = spanPxY(rowSpan);
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

export type ThemeIpadHomePreviewProps = {
  data?: any;
  defaultWidth?: number;
  defaultHeight?: number;
  cols?: number;
  rows?: number;
  /**
   * 边距 / Dock 外壳相对 long_ipad 的缩放。
   * list_view_ipad 画布为一半时传 0.5，左右边距等同步缩小。
   */
  chromeScale?: number;
};

export default function ThemeIpadHomePreview(props: ThemeIpadHomePreviewProps) {
  const data = props.data;
  if (!data) return null;

  const cols = Number(props.cols) > 0 ? Math.floor(Number(props.cols)) : DEFAULT_COLS;
  const rows = Number(props.rows) > 0 ? Math.floor(Number(props.rows)) : DEFAULT_ROWS;
  const chromeScale =
    Number(props.chromeScale) > 0 ? Number(props.chromeScale) : 1;
  const padTop = PAD_TOP * chromeScale;
  const padX = PAD_X * chromeScale;
  const dockBottom = DOCK_BOTTOM * chromeScale;
  const dockSide = DOCK_SIDE * chromeScale;
  const dockGap = DOCK_GAP * chromeScale;
  const dockPadding = DOCK_PADDING * chromeScale;
  const dockRadius = DOCK_RADIUS * chromeScale;

  const { width: GRID_W, height: GRID_H } = getGridSize(cols, rows);

  const dockInnerW = DOCK_COLS * DOCK_CELL + Math.max(0, DOCK_COLS - 1) * GAP_X;
  const dockOuterW = dockInnerW + dockPadding * 2;
  const dockOuterH = DOCK_CELL + dockPadding * 2;

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
          : renderWidgetCell(element, colSpan, rowSpan);
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

    // 主网格放不下：icon 进 Dock（180×180 × 8）
    if (element.category !== 'iconpack' || dockFilled >= DOCK_COLS) return;
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
        {renderDockIconCell(element)}
      </GridSpanLayout.Item>,
    );
  });

  const width = Number(data.width) > 0 ? Number(data.width) : (props.defaultWidth ?? 2048);
  const height = Number(data.height) > 0 ? Number(data.height) : (props.defaultHeight ?? 2732);

  const innerW = width - padX * 2;
  const dockAvailW = Math.max(width - dockSide * 2, 1);
  // 主网格与 Dock 共用同一 scale，保证上下 icon（均为 180 设计尺寸）屏幕上一样大
  const heightBudget = Math.max(height - padTop - dockBottom - dockGap, 1);
  const fitScale = Math.min(
    innerW / GRID_W,
    dockAvailW / dockOuterW,
    heightBudget / (GRID_H + dockOuterH),
    1,
  );
  const dockScale = fitScale;
  const dockDisplayW = dockOuterW * dockScale;
  const dockDisplayH = dockOuterH * dockScale;
  const contentBottom = dockBottom + dockDisplayH + dockGap;
  const dockLeft = (width - dockDisplayW) / 2;

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
          top: padTop,
          left: padX,
          right: padX,
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
              gap={[GAP_X, GAP_Y]}
              style={{
                position: 'relative',
                zIndex: 2,
                width: GRID_W,
                height: GRID_H,
                gridTemplateColumns: `repeat(${cols}, ${IPAD_CELL_W}px)`,
                gridTemplateRows: `repeat(${rows}, ${IPAD_CELL_H}px)`,
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
          bottom: dockBottom,
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
            padding: dockPadding,
            boxSizing: 'border-box',
            borderRadius: dockRadius,
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
            cols={DOCK_COLS}
            gap={[GAP_X, 0]}
            style={{
              width: dockInnerW,
              height: DOCK_CELL,
              gridTemplateColumns: `repeat(${DOCK_COLS}, ${DOCK_CELL}px)`,
              gridTemplateRows: `${DOCK_CELL}px`,
            }}
          >
            {dockSpanLayoutItems}
          </GridSpanLayout>
        </div>
      </div>
    </div>
  );
}
