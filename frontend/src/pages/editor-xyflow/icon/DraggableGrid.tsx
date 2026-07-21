import { useMemo, useState, type CSSProperties } from 'react';
import {
  DragOverlay,
  useDraggable,
  useDroppable,
  useDragDropMonitor,
} from '@dnd-kit/react';
import { useViewport } from '@xyflow/react';
import {
  BANNER_GAP,
  BANNER_PADDING,
  CELL,
  DESKTOP_DND_ENABLED,
  GAP_X,
  GAP_Y,
  NAME_HEIGHT,
  bannerSlotId,
  canPlace,
  cellKey,
  getCellSlotY,
  getContentSpanHeight,
  getDesktopFitMetrics,
  getOccupiedKeys,
  getSpanPixelSize,
  parseBannerSlotId,
  parseSlotId,
  slotId,
  useDesktopBannerIcons,
  useDesktopGridPaddingY,
  useDesktopGridSize,
  useDesktopIcons,
  useDesktopWithBanner,
  useDesktopWithName,
  type CellPos,
  type DesktopIcon,
  type PaletteDragData,
} from './desktop-dnd';
import { xyFlowTypeNodeType } from '../xyFlowTypeNodeType';
import { CONFIG_SIZE_MAP } from '../widget/base-config';

function getSlotSize(
  icon: Pick<DesktopIcon, 'colSpan' | 'rowSpan'>,
  withName: boolean,
) {
  return {
    width: getSpanPixelSize(icon.colSpan, 'x', withName),
    height: getSpanPixelSize(icon.rowSpan, 'y', withName),
  };
}

/** 组件等比例缩放进内容区（withName 时不含 name） */
function getDesktopItemMetrics(icon: DesktopIcon, withName: boolean) {
  if (icon.xyflowType === 'icon') {
    return getDesktopFitMetrics(
      CELL,
      CELL,
      icon.colSpan,
      icon.rowSpan,
      withName,
    );
  }
  const size = Number(icon.data?.size ?? 1);
  const sizeConfig = CONFIG_SIZE_MAP[size] || CONFIG_SIZE_MAP[1];
  return getDesktopFitMetrics(
    sizeConfig.width,
    sizeConfig.height,
    icon.colSpan,
    icon.rowSpan,
    withName,
  );
}

function iconPixelStyle(
  icon: Pick<DesktopIcon, 'col' | 'row' | 'colSpan' | 'rowSpan'>,
  withName: boolean,
): CSSProperties {
  const { width, height } = getSlotSize(icon, withName);
  const cellY = getCellSlotY(withName);
  return {
    position: 'absolute',
    left: icon.col * (CELL + GAP_X),
    top: icon.row * (cellY + GAP_Y),
    width,
    height,
  };
}

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
  cursor: DESKTOP_DND_ENABLED ? 'grab' : 'default',
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
  const bannerIcons = useDesktopBannerIcons();
  const { columns, rows } = useDesktopGridSize();
  const withName = useDesktopWithName();
  const withBanner = useDesktopWithBanner();
  const gridPaddingY = useDesktopGridPaddingY();
  const cellSlotY = getCellSlotY(withName);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [paletteGhost, setPaletteGhost] = useState<DesktopIcon | null>(null);
  const [hoverSlot, setHoverSlot] = useState<CellPos | null>(null);
  const [hoverBannerCol, setHoverBannerCol] = useState<number | null>(null);

  const boardStyle = useMemo<CSSProperties>(
    () => ({
      position: 'relative',
      width: columns * CELL + (columns - 1) * GAP_X,
      height: rows * cellSlotY + (rows - 1) * GAP_Y,
    }),
    [columns, rows, cellSlotY],
  );

  const slotGridStyle = useMemo<CSSProperties>(
    () => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, ${CELL}px)`,
      gridTemplateRows: `repeat(${rows}, ${cellSlotY}px)`,
      columnGap: GAP_X,
      rowGap: GAP_Y,
    }),
    [columns, rows, cellSlotY],
  );

  useDragDropMonitor({
    onDragStart(event) {
      if (!DESKTOP_DND_ENABLED) return;
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
      if (!DESKTOP_DND_ENABLED) return;
      const targetId = event.operation.target?.id;
      const bannerCol = parseBannerSlotId(targetId);
      if (bannerCol != null) {
        setHoverBannerCol(bannerCol);
        setHoverSlot(null);
        return;
      }
      setHoverBannerCol(null);
      setHoverSlot(parseSlotId(targetId));
    },
    onDragEnd() {
      setDraggingId(null);
      setPaletteGhost(null);
      setHoverSlot(null);
      setHoverBannerCol(null);
    },
  });

  const draggingIcon =
    icons.find((icon) => icon.id === draggingId) ??
    bannerIcons.find((icon) => icon.id === draggingId) ??
    paletteGhost;

  const draggingInBanner =
    !!draggingId && bannerIcons.some((icon) => icon.id === draggingId);

  const grid = useMemo(() => ({ columns, rows }), [columns, rows]);
  const bannerGrid = useMemo(() => ({ columns, rows: 1 }), [columns]);

  const hoverValid =
    draggingIcon && hoverSlot && !draggingInBanner
      ? canPlace(icons, draggingIcon, hoverSlot.col, hoverSlot.row, grid)
      : false;

  const bannerHoverValid =
    draggingIcon && hoverBannerCol != null && draggingInBanner
      ? canPlace(bannerIcons, draggingIcon, hoverBannerCol, 0, bannerGrid)
      : false;

  // 拖拽中排除当前项，原占位格子会重新显示，便于落点
  const occupiedKeys = useMemo(
    () => getOccupiedKeys(icons, draggingId ?? undefined),
    [icons, draggingId],
  );

  const bannerOccupiedKeys = useMemo(
    () => getOccupiedKeys(bannerIcons, draggingId ?? undefined),
    [bannerIcons, draggingId],
  );

  const bannerOuterStyle = useMemo<CSSProperties>(
    () => ({
      marginTop: BANNER_GAP,
      // 向左右外扩内边距，主网格不必再 marginLeft
      marginLeft: -BANNER_PADDING,
      width: columns * CELL + (columns - 1) * GAP_X + BANNER_PADDING * 2,
      padding: BANNER_PADDING,
      boxSizing: 'border-box',
      borderRadius: 48,
      background: 'rgba(0, 0, 0, 0.06)',
    }),
    [columns],
  );

  const bannerBoardStyle = useMemo<CSSProperties>(
    () => ({
      position: 'relative',
      width: columns * CELL + (columns - 1) * GAP_X,
      height: CELL,
    }),
    [columns],
  );

  const bannerSlotGridStyle = useMemo<CSSProperties>(
    () => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, ${CELL}px)`,
      gridTemplateRows: `${CELL}px`,
      columnGap: GAP_X,
    }),
    [columns],
  );

  return (
    <>
      <div
        style={{
          paddingTop: gridPaddingY,
          paddingBottom: gridPaddingY,
        }}
      >
        <div style={boardStyle}>
          <div style={slotGridStyle}>
            {Array.from({ length: rows * columns }, (_, index) => {
              const col = index % columns;
              const row = Math.floor(index / columns);
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

          {draggingIcon && hoverSlot && !draggingInBanner && (
            <div
              style={{
                ...iconPixelStyle(
                  {
                    col: hoverSlot.col,
                    row: hoverSlot.row,
                    colSpan: draggingIcon.colSpan,
                    rowSpan: draggingIcon.rowSpan,
                  },
                  withName,
                ),
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
                withName={withName}
              />
            ))}
          </div>
        </div>
      </div>

      {withBanner ? (
        <div style={bannerOuterStyle}>
          <div style={bannerBoardStyle}>
            <div style={bannerSlotGridStyle}>
              {Array.from({ length: columns }, (_, col) => (
                <Slot
                  key={bannerSlotId(col)}
                  id={bannerSlotId(col)}
                  col={col}
                  row={0}
                  occupied={bannerOccupiedKeys.has(cellKey(col, 0))}
                />
              ))}
            </div>

            {draggingIcon && hoverBannerCol != null && draggingInBanner && (
              <div
                style={{
                  ...iconPixelStyle(
                    {
                      col: hoverBannerCol,
                      row: 0,
                      colSpan: 1,
                      rowSpan: 1,
                    },
                    false,
                  ),
                  borderRadius: 40,
                  border: `2px solid ${bannerHoverValid ? '#52c41a' : '#ff4d4f'}`,
                  background: bannerHoverValid
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
              {bannerIcons.map((icon) => (
                <DesktopIconItem
                  key={icon.id}
                  icon={icon}
                  isDragging={draggingId === icon.id}
                  withName={false}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <DragOverlay>
        {(source) => {
          const icon =
            icons.find((item) => item.id === source.id) ??
            bannerIcons.find((item) => item.id === source.id) ??
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
          const overlayWithName = bannerIcons.some(
            (item) => item.id === source.id,
          )
            ? false
            : withName;
          return (
            <OverlayIcon icon={icon} zoom={zoom} withName={overlayWithName} />
          );
        }}
      </DragOverlay>
    </>
  );
}

function OverlayIcon({
  icon,
  zoom,
  withName,
}: {
  icon: DesktopIcon;
  zoom: number;
  withName: boolean;
}) {
  const { width, height } = getSlotSize(icon, withName);

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
          withName={withName}
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
  id,
}: CellPos & { occupied?: boolean; id?: string }) {
  const { ref, isDropTarget } = useDroppable({
    id: id ?? slotId(col, row),
    disabled: !DESKTOP_DND_ENABLED,
  });

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

function DesktopItemName({ icon }: { icon: DesktopIcon }) {
  if (!icon.showName) {
    return <div style={{ height: NAME_HEIGHT, flexShrink: 0 }} />;
  }
  const text =
    icon.xyflowType === 'icon'
      ? String(icon.label || icon.data?.name || '').trim() || 'themekit'
      : 'ThemeKit';

  return (
    <div
      style={{
        height: NAME_HEIGHT,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4px',
        boxSizing: 'border-box',
        color: '#1f1f1f',
        fontSize: 14,
        lineHeight: 1.2,
        fontFamily: 'AvenirNext-Medium, sans-serif',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
      title={text}
    >
      {text}
    </div>
  );
}

function DesktopItemContent({
  icon,
  withName,
  style,
}: {
  icon: DesktopIcon;
  withName: boolean;
  style?: CSSProperties;
}) {
  const { width, height } = getSlotSize(icon, withName);
  const contentHeight = getContentSpanHeight(icon.rowSpan, withName);
  const Comp = icon.xyflowType ? xyFlowTypeNodeType[icon.xyflowType] : null;

  if (Comp && icon.data) {
    const metrics = getDesktopItemMetrics(icon, withName);
    const offsetX = (width - metrics.fittedWidth) / 2;
    const offsetY = (contentHeight - metrics.fittedHeight) / 2;
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          ...style,
        }}
      >
        <div
          style={{
            width,
            height: contentHeight,
            overflow: 'hidden',
            borderRadius: 40,
            position: 'relative',
            flexShrink: 0,
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
        {withName ? <DesktopItemName icon={icon} /> : null}
      </div>
    );
  }

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <div style={{ ...iconFaceStyle, height: contentHeight, flexShrink: 0 }}>
        {icon.label}
      </div>
      {withName ? <DesktopItemName icon={icon} /> : null}
    </div>
  );
}

function DesktopIconItem({
  icon,
  isDragging,
  withName,
}: {
  icon: DesktopIcon;
  isDragging: boolean;
  withName: boolean;
}) {
  const { ref } = useDraggable({
    id: icon.id,
    disabled: !DESKTOP_DND_ENABLED,
  });

  return (
    <div
      ref={ref}
      style={{
        ...iconPixelStyle(icon, withName),
        opacity: isDragging ? 0.35 : 1,
        zIndex: 2,
        cursor: DESKTOP_DND_ENABLED ? 'grab' : 'default',
      }}
    >
      <DesktopItemContent icon={icon} withName={withName} />
    </div>
  );
}
