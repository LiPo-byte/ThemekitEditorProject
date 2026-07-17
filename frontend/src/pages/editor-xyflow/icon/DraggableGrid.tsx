import { useState, type CSSProperties } from 'react';
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
  GAP,
  ROWS,
  canPlace,
  parseSlotId,
  slotId,
  useDesktopIcons,
  type CellPos,
  type DesktopIcon,
  type PaletteDragData,
} from './desktop-dnd';

function iconPixelStyle(
  icon: Pick<DesktopIcon, 'col' | 'row' | 'colSpan' | 'rowSpan'>,
): CSSProperties {
  const step = CELL + GAP;
  return {
    position: 'absolute',
    left: icon.col * step,
    top: icon.row * step,
    width: icon.colSpan * CELL + (icon.colSpan - 1) * GAP,
    height: icon.rowSpan * CELL + (icon.rowSpan - 1) * GAP,
  };
}

const boardStyle: CSSProperties = {
  position: 'relative',
  width: COLUMNS * CELL + (COLUMNS - 1) * GAP,
  height: ROWS * CELL + (ROWS - 1) * GAP,
};

const slotGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(${COLUMNS}, ${CELL}px)`,
  gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
  gap: GAP,
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

  return (
    <>
      <div style={boardStyle}>
        <div style={slotGridStyle}>
          {Array.from({ length: ROWS * COLUMNS }, (_, index) => {
            const col = index % COLUMNS;
            const row = Math.floor(index / COLUMNS);
            return <Slot key={slotId(col, row)} col={col} row={row} />;
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
  const width = (icon.colSpan * CELL + (icon.colSpan - 1) * GAP) * zoom;
  const height = (icon.rowSpan * CELL + (icon.rowSpan - 1) * GAP) * zoom;

  return (
    <div style={{ width, height }}>
      <IconFace
        label={icon.label}
        style={{
          borderRadius: 40 * zoom,
          fontSize: 20 * zoom,
          cursor: 'grabbing',
        }}
      />
    </div>
  );
}

function Slot({ col, row }: CellPos) {
  const { ref, isDropTarget } = useDroppable({ id: slotId(col, row) });

  return (
    <div
      ref={ref}
      style={{
        ...slotStyle,
        background: isDropTarget ? '#e6f4ff' : slotStyle.background,
        borderColor: isDropTarget ? '#1677ff' : '#c5c5c5',
      }}
    />
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
      <IconFace label={icon.label} />
    </div>
  );
}

function IconFace({
  label,
  style,
}: {
  label: string;
  style?: CSSProperties;
}) {
  return <div style={{ ...iconFaceStyle, ...style }}>{label}</div>;
}
