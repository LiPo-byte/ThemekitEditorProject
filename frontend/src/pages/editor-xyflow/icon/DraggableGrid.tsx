import { useMemo, useState, type CSSProperties } from 'react';
import {
  DragOverlay,
  useDraggable,
  useDroppable,
  useDragDropMonitor,
} from '@dnd-kit/react';
import { useViewport } from '@xyflow/react';
import {
  CELL,
  COLUMNS,
  GAP_X,
  GAP_Y,
  ROWS,
  canPlace,
  cellKey,
  getDesktopFitMetrics,
  getOccupiedKeys,
  getSpanPixelSize,
  parseSlotId,
  slotId,
  useDesktopIcons,
  type CellPos,
  type DesktopIcon,
  type PaletteDragData,
} from './desktop-dnd';
import { xyFlowTypeNodeType } from '../xyFlowTypeNodeType';
import { CONFIG_SIZE_MAP } from '../widget/base-config';

function getSlotSize(icon: Pick<DesktopIcon, 'colSpan' | 'rowSpan'>) {
  return {
    width: getSpanPixelSize(icon.colSpan, 'x'),
    height: getSpanPixelSize(icon.rowSpan, 'y'),
  };
}

/** 组件等比例缩放进格子；icon 本身固定 180×180 */
function getDesktopItemMetrics(icon: DesktopIcon) {
  if (icon.xyflowType === 'icon') {
    return getDesktopFitMetrics(CELL, CELL, icon.colSpan, icon.rowSpan);
  }
  const size = Number(icon.data?.size ?? 1);
  const sizeConfig = CONFIG_SIZE_MAP[size] || CONFIG_SIZE_MAP[1];
  return getDesktopFitMetrics(
    sizeConfig.width,
    sizeConfig.height,
    icon.colSpan,
    icon.rowSpan,
  );
}

function iconPixelStyle(
  icon: Pick<DesktopIcon, 'col' | 'row' | 'colSpan' | 'rowSpan'>,
): CSSProperties {
  const { width, height } = getSlotSize(icon);
  return {
    position: 'absolute',
    left: icon.col * (CELL + GAP_X),
    top: icon.row * (CELL + GAP_Y),
    width,
    height,
  };
}

const boardStyle: CSSProperties = {
  position: 'relative',
  width: COLUMNS * CELL + (COLUMNS - 1) * GAP_X,
  height: ROWS * CELL + (ROWS - 1) * GAP_Y,
};

const slotGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(${COLUMNS}, ${CELL}px)`,
  gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
  columnGap: GAP_X,
  rowGap: GAP_Y,
};

const slotStyle: CSSProperties = {
  borderRadius: 40,
  border: '1px dashed #c5c5c5',
  background: '#f3f3f3',
  boxSizing: 'border-box',
};

const iconFaceStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: 40,
  background: '#000000',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  fontFamily: 'AvenirNext-HeavyItalic',
  userSelect: 'none',
  cursor: 'grab',
  boxSizing: 'border-box',
};

function isPaletteData(data: unknown): data is PaletteDragData {
  return (
    !!data &&
    typeof data === 'object' &&
    (data as PaletteDragData).type === 'palette'
  );
}

export default function DraggableGrid() {
  const { zoom } = useViewport();
  const icons = useDesktopIcons();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [paletteGhost, setPaletteGhost] = useState<DesktopIcon | null>(null);
  const [hoverSlot, setHoverSlot] = useState<CellPos | null>(null);

  useDragDropMonitor({
    onDragStart(event) {
      const source = event.operation.source;
      const id = source?.id;
      setDraggingId(id == null ? null : String(id));
      if (isPaletteData(source?.data)) {
        setPaletteGhost({
          id: String(id),
          label: source.data.label,
          col: 0,
          row: 0,
          colSpan: source.data.colSpan,
          rowSpan: source.data.rowSpan,
        });
      } else {
        setPaletteGhost(null);
      }
    },
    onDragOver(event) {
      setHoverSlot(parseSlotId(event.operation.target?.id));
    },
    onDragEnd() {
      setDraggingId(null);
      setPaletteGhost(null);
      setHoverSlot(null);
    },
  });

  const draggingIcon =
    icons.find((icon) => icon.id === draggingId) ?? paletteGhost;

  const hoverValid =
    draggingIcon && hoverSlot
      ? canPlace(icons, draggingIcon, hoverSlot.col, hoverSlot.row)
      : false;

  // 拖拽中排除当前项，原占位格子会重新显示，便于落点
  const occupiedKeys = useMemo(
    () => getOccupiedKeys(icons, draggingId ?? undefined),
    [icons, draggingId],
  );

  return (
    <>
      <div style={boardStyle}>
        <div style={slotGridStyle}>
          {Array.from({ length: ROWS * COLUMNS }, (_, index) => {
            const col = index % COLUMNS;
            const row = Math.floor(index / COLUMNS);
            return (
              <Slot
                key={slotId(col, row)}
                col={col}
                row={row}
                occupied={occupiedKeys.has(cellKey(col, row))}
              />
            );
          })}
        </div>

        {draggingIcon && hoverSlot && (
          <div
            style={{
              ...iconPixelStyle({
                col: hoverSlot.col,
                row: hoverSlot.row,
                colSpan: draggingIcon.colSpan,
                rowSpan: draggingIcon.rowSpan,
              }),
              borderRadius: 40,
              border: `2px solid ${hoverValid ? '#52c41a' : '#ff4d4f'}`,
              background: hoverValid
                ? 'rgba(82, 196, 26, 0.12)'
                : 'rgba(255, 77, 79, 0.12)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: draggingId ? 'none' : 'auto',
          }}
        >
          {icons.map((icon) => (
            <DesktopIconItem
              key={icon.id}
              icon={icon}
              isDragging={draggingId === icon.id}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {(source) => {
          const icon =
            icons.find((item) => item.id === source.id) ??
            (isPaletteData(source.data)
              ? {
                  id: String(source.id),
                  label: source.data.label,
                  col: 0,
                  row: 0,
                  colSpan: source.data.colSpan,
                  rowSpan: source.data.rowSpan,
                }
              : null);
          if (!icon) return null;
          return <OverlayIcon icon={icon} zoom={zoom} />;
        }}
      </DragOverlay>
    </>
  );
}

function OverlayIcon({ icon, zoom }: { icon: DesktopIcon; zoom: number }) {
  const { width, height } = getSlotSize(icon);

  return (
    <div style={{ width: width * zoom, height: height * zoom }}>
      <div
        style={{
          width,
          height,
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <DesktopItemContent
          icon={icon}
          style={{
            borderRadius: 40,
            cursor: 'grabbing',
          }}
        />
      </div>
    </div>
  );
}

function Slot({
  col,
  row,
  occupied,
}: CellPos & { occupied?: boolean }) {
  const { ref, isDropTarget } = useDroppable({ id: slotId(col, row) });

  return (
    <div
      ref={ref}
      style={{
        ...slotStyle,
        opacity: occupied && !isDropTarget ? 0 : 1,
        background: isDropTarget ? '#e6f4ff' : slotStyle.background,
        borderColor: isDropTarget ? '#1677ff' : '#c5c5c5',
      }}
    />
  );
}

function DesktopItemContent({
  icon,
  style,
}: {
  icon: DesktopIcon;
  style?: CSSProperties;
}) {
  const Comp = icon.xyflowType ? xyFlowTypeNodeType[icon.xyflowType] : null;
  if (Comp && icon.data) {
    const { width, height } = getSlotSize(icon);
    const metrics = getDesktopItemMetrics(icon);
    const offsetX = (width - metrics.fittedWidth) / 2;
    const offsetY = (height - metrics.fittedHeight) / 2;
    return (
      <div
        style={{
          width,
          height,
          overflow: 'hidden',
          borderRadius: 40,
          position: 'relative',
          ...style,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: offsetX,
            top: offsetY,
            width: metrics.fittedWidth,
            height: metrics.fittedHeight,
            overflow: 'hidden',
          }}
        >
          <Comp id={icon.id} data={icon.data} scale={metrics.scale} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...iconFaceStyle, ...style }}>{icon.label}</div>
  );
}

function DesktopIconItem({
  icon,
  isDragging,
}: {
  icon: DesktopIcon;
  isDragging: boolean;
}) {
  const { ref } = useDraggable({ id: icon.id });

  return (
    <div
      ref={ref}
      style={{
        ...iconPixelStyle(icon),
        opacity: isDragging ? 0.35 : 1,
        zIndex: 2,
      }}
    >
      <DesktopItemContent icon={icon} />
    </div>
  );
}
