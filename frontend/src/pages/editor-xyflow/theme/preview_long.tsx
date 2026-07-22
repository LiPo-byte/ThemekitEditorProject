import type { ReactNode } from 'react';
import GridSpanLayout from '@/pages/editor-xyflow/components/GridSpanLayout';
import AppIcon from '../icon';
import { CONFIG_SIZE_MAP, TYPE_WIDGET_MAP } from '../widget/base-config';
import { xyFlowTypeNodeType } from '../xyFlowTypeNodeType';

/** 单格固定 180×180；GAP_X/GAP_Y 使中、大精确贴合 */
const CELL = 180;
const GAP_X = 89;
const GAP_Y = 105;
const COLS = 4;
const ROWS = 6;
const PAD_TOP = 100;
const PAD_X = 50;

const DOCK_COLS = 4;
const DOCK_ROWS = 1;
const DOCK_BOTTOM = 20;
const DOCK_SIDE = 10;
const DOCK_GAP = 48;
const DOCK_PADDING = 20;
const DOCK_RADIUS = 48;

const GRID_W = COLS * CELL + (COLS - 1) * GAP_X;
const GRID_H = ROWS * CELL + (ROWS - 1) * GAP_Y;
const DOCK_INNER_W = DOCK_COLS * CELL + (DOCK_COLS - 1) * GAP_X;
const DOCK_INNER_H = CELL;
const DOCK_OUTER_W = DOCK_INNER_W + DOCK_PADDING * 2;
const DOCK_OUTER_H = DOCK_INNER_H + DOCK_PADDING * 2;

const spanPxX = (n: number) => n * CELL + Math.max(0, n - 1) * GAP_X;
const spanPxY = (n: number) => n * CELL + Math.max(0, n - 1) * GAP_Y;

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

const createOccupiedGrid = () =>
  Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => false));

const canPlace = (
  occupied: boolean[][],
  rowStart: number,
  colStart: number,
  rowSpan: number,
  colSpan: number,
) => {
  if (rowStart + rowSpan - 1 > ROWS || colStart + colSpan - 1 > COLS) return false;
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
  colSpan: number,
  rowSpan: number,
): { colStart: number; rowStart: number } | null => {
  for (let rowStart = 1; rowStart <= ROWS; rowStart += 1) {
    for (let colStart = 1; colStart <= COLS; colStart += 1) {
      if (canPlace(occupied, rowStart, colStart, rowSpan, colSpan)) {
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

export default function PreviewLong(props: any) {
  const data = props.data;
  if (!data) return null;

  const showElements = Array.isArray(data.showElements) ? data.showElements : [];
  let wallpaper: any = null;
  const gridSpanLayoutItems: ReactNode[] = [];
  const dockSpanLayoutItems: ReactNode[] = [];
  const occupied = createOccupiedGrid();
  let dockFilled = 0;

  showElements.forEach((element: any) => {
    if (element.category === 'wallpaper') {
      wallpaper = element;
      return;
    }

    if (element.category !== 'iconpack' && element.category !== 'widget') return;

    const { colSpan, rowSpan } = getElementSpan(element);
    const slot = findNextSlot(occupied, colSpan, rowSpan);

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

    // 主网格放不下时：仅 iconpack 1×1 进 Dock（最多 4 格）
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
        {renderIconCell(element)}
      </GridSpanLayout.Item>,
    );
  });

  const width = Number(data.width) > 0 ? Number(data.width) : 887;
  const height = Number(data.height) > 0 ? Number(data.height) : 1920;

  const dockAvailW = Math.max(width - DOCK_SIDE * 2, 1);
  const dockScale = Math.min(dockAvailW / DOCK_OUTER_W, 1);
  const dockDisplayH = DOCK_OUTER_H * dockScale;
  const contentBottom = DOCK_BOTTOM + dockDisplayH + DOCK_GAP;

  const innerW = width - PAD_X * 2;
  const innerH = Math.max(height - PAD_TOP - contentBottom, 1);
  const fitScale = Math.min(innerW / GRID_W, innerH / GRID_H, 1);

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
          top: PAD_TOP,
          left: PAD_X,
          right: PAD_X,
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
              rows={ROWS}
              cols={COLS}
              gap={[GAP_X, GAP_Y]}
              style={{
                position: 'relative',
                zIndex: 2,
                width: GRID_W,
                height: GRID_H,
                // 锁定 1×1 = 180×180，不用 1fr 拉伸
                gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
                gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
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
          bottom: DOCK_BOTTOM,
          left: '50%',
          width: DOCK_OUTER_W * dockScale,
          height: DOCK_OUTER_H * dockScale,
          transform: 'translateX(-50%)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: DOCK_OUTER_W,
            height: DOCK_OUTER_H,
            padding: DOCK_PADDING,
            boxSizing: 'border-box',
            borderRadius: DOCK_RADIUS,
            background: 'rgba(0, 0, 0, 0.55)',
            transform: `scale(${dockScale})`,
            transformOrigin: '0 0',
          }}
        >
          <GridSpanLayout
            rows={DOCK_ROWS}
            cols={DOCK_COLS}
            gap={[GAP_X, 0]}
            style={{
              width: DOCK_INNER_W,
              height: DOCK_INNER_H,
              gridTemplateColumns: `repeat(${DOCK_COLS}, ${CELL}px)`,
              gridTemplateRows: `${CELL}px`,
            }}
          >
            {dockSpanLayoutItems}
          </GridSpanLayout>
        </div>
      </div>
    </div>
  );
}
