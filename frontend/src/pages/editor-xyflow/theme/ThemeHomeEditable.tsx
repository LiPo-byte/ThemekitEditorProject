import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { flushSync } from 'react-dom';
import {
  DragDropProvider,
  DragOverlay,
  useDraggable,
  useDroppable,
  useDragDropMonitor,
  type DragEndEvent,
} from '@dnd-kit/react';
import { useViewport } from '@xyflow/react';
import AppIcon from '../icon';
import { useEditorRegisterDesktopEditDraft } from '../context';
import { CONFIG_SIZE_MAP, TYPE_WIDGET_MAP } from '../widget/base-config';
import { xyFlowTypeNodeType } from '../xyFlowTypeNodeType';
import {
  applyThemeHomeDrop,
  canDropThemeHomePlacement,
  resolveThemeHomeDropTargetFromPointer,
  themeHomeDockSlotId,
  themeHomeGridSlotId,
  type ThemeHomeDropTarget,
  type ThemeHomePoint,
} from './themeHomeDnd';
import {
  buildThemeHomePlacements,
  placementPixelStyle,
  placementsToShowElements,
  resolveHomeFrameMetrics,
  resolveThemeHomeElementSpan,
  spanPxX,
  spanPxY,
  type ThemeHomeLayout,
  type ThemeHomePlacement,
  type ThemeHomeSpanResolver,
  type ThemeHomeZone,
} from './themeHomeLayout';

const DROP_PREVIEW_VALID = {
  border: '2px solid rgba(22, 119, 255, 0.95)',
  background: 'rgba(22, 119, 255, 0.28)',
} as const;

const DROP_PREVIEW_DANGER = {
  border: '2px solid rgba(255, 77, 79, 0.95)',
  background: 'rgba(255, 77, 79, 0.28)',
} as const;

export type ThemeHomeEditableProps = {
  data: any;
  cols: number;
  rows: number;
  dockCols: number;
  layout: ThemeHomeLayout;
  dockAlignWithGrid: boolean;
  defaultWidth?: number;
  defaultHeight?: number;
  /** 占位规则；默认主屏格。iPad 等可注入不同 resolveSpan */
  resolveSpan?: ThemeHomeSpanResolver;
  /** 是否显示 Dock；list_view_short 传 false */
  withDock?: boolean;
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

const renderPlacementContent = (placement: ThemeHomePlacement, layout: ThemeHomeLayout) => {
  if (placement.element?.category === 'iconpack') {
    return renderIconCell(placement.element);
  }
  return renderWidgetCell(
    placement.element,
    placement.colSpan,
    placement.rowSpan,
    layout,
  );
};

function GridSlot({
  colStart,
  rowStart,
  layout,
}: {
  colStart: number;
  rowStart: number;
  layout: ThemeHomeLayout;
}) {
  const { ref } = useDroppable({
    id: themeHomeGridSlotId(colStart, rowStart),
  });
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: (colStart - 1) * (layout.cell + layout.gapX),
        top: (rowStart - 1) * (layout.cell + layout.gapY),
        width: layout.cell,
        height: layout.cell,
        boxSizing: 'border-box',
        borderRadius: 12,
        border: '2px dashed rgba(255,255,255,0.72)',
        background: 'rgba(0, 0, 0, 0.18)',
        boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.22)',
      }}
    />
  );
}

function DockSlot({ colStart, layout }: { colStart: number; layout: ThemeHomeLayout }) {
  const { ref } = useDroppable({
    id: themeHomeDockSlotId(colStart),
  });
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: (colStart - 1) * (layout.cell + layout.gapX),
        top: 0,
        width: layout.cell,
        height: layout.cell,
        boxSizing: 'border-box',
        borderRadius: 12,
        border: '2px dashed rgba(255,255,255,0.72)',
        background: 'rgba(0, 0, 0, 0.18)',
        boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.22)',
      }}
    />
  );
}

/** 整块落点预览：合法蓝 / 非法红 */
function DropSpanPreview({
  zone,
  draggingId,
  hoverTarget,
  placements,
  cols,
  rows,
  dockCols,
  layout,
}: {
  zone: ThemeHomeZone;
  draggingId: string | null;
  hoverTarget: ThemeHomeDropTarget | null;
  placements: ThemeHomePlacement[];
  cols: number;
  rows: number;
  dockCols: number;
  layout: ThemeHomeLayout;
}) {
  if (!draggingId || !hoverTarget || hoverTarget.zone !== zone) return null;
  const item = placements.find((p) => p.id === draggingId);
  if (!item) return null;

  const valid = canDropThemeHomePlacement({
    placements,
    itemId: draggingId,
    target: hoverTarget,
    cols,
    rows,
    dockCols,
  });

  const preview =
    hoverTarget.zone === 'dock'
      ? {
          colStart: hoverTarget.colStart,
          rowStart: 1,
          colSpan: 1,
          rowSpan: 1,
        }
      : {
          colStart: hoverTarget.colStart,
          rowStart: hoverTarget.rowStart,
          colSpan: item.colSpan,
          rowSpan: item.rowSpan,
        };

  const tone = valid ? DROP_PREVIEW_VALID : DROP_PREVIEW_DANGER;

  return (
    <div
      style={{
        ...placementPixelStyle(preview, layout),
        zIndex: 4,
        pointerEvents: 'none',
        borderRadius: 16,
        boxSizing: 'border-box',
        ...tone,
      }}
    />
  );
}

const readClientPoint = (nativeEvent?: Event): ThemeHomePoint | null => {
  if (!nativeEvent || !('clientX' in nativeEvent) || !('clientY' in nativeEvent)) {
    return null;
  }
  const { clientX, clientY } = nativeEvent as PointerEvent;
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
  return { x: clientX, y: clientY };
};

function HomeDragHoverMonitor({
  gridBoardRef,
  dockBoardRef,
  cols,
  rows,
  dockCols,
  layout,
  gridLogicalW,
  gridLogicalH,
  dockLogicalW,
  dockLogicalH,
  onHoverChange,
}: {
  gridBoardRef: RefObject<HTMLDivElement | null>;
  dockBoardRef: RefObject<HTMLDivElement | null>;
  cols: number;
  rows: number;
  dockCols: number;
  layout: ThemeHomeLayout;
  gridLogicalW: number;
  gridLogicalH: number;
  dockLogicalW: number;
  dockLogicalH: number;
  onHoverChange: (next: {
    draggingId: string | null;
    hoverTarget: ThemeHomeDropTarget | null;
  }) => void;
}) {
  const lastClientRef = useRef<ThemeHomePoint | null>(null);

  const resolveHover = useCallback(
    (draggingId: string | null, client: ThemeHomePoint | null) => {
      if (!draggingId || !client) {
        onHoverChange({ draggingId, hoverTarget: null });
        return;
      }
      const hoverTarget = resolveThemeHomeDropTargetFromPointer({
        pointer: client,
        gridBoardRect: gridBoardRef.current?.getBoundingClientRect() ?? null,
        dockBoardRect: dockBoardRef.current?.getBoundingClientRect() ?? null,
        cols,
        rows,
        dockCols,
        layout,
        gridLogicalW,
        gridLogicalH,
        dockLogicalW,
        dockLogicalH,
      });
      onHoverChange({ draggingId, hoverTarget });
    },
    [
      cols,
      dockBoardRef,
      dockCols,
      dockLogicalH,
      dockLogicalW,
      gridBoardRef,
      gridLogicalH,
      gridLogicalW,
      layout,
      onHoverChange,
      rows,
    ],
  );

  useDragDropMonitor({
    onDragStart(event) {
      const id = event.operation.source?.id;
      const draggingId = id == null ? null : String(id);
      const client =
        readClientPoint(event.nativeEvent) ??
        readClientPoint(event.operation.activatorEvent ?? undefined);
      if (client) lastClientRef.current = client;
      resolveHover(draggingId, client);
    },
    onDragMove(event) {
      const id = event.operation.source?.id;
      const draggingId = id == null ? null : String(id);
      const client = readClientPoint(event.nativeEvent) ?? lastClientRef.current;
      if (client) lastClientRef.current = client;
      resolveHover(draggingId, client);
    },
    onDragOver(event) {
      const id = event.operation.source?.id;
      const draggingId = id == null ? null : String(id);
      resolveHover(draggingId, lastClientRef.current);
    },
    onDragEnd() {
      lastClientRef.current = null;
    },
  });
  return null;
}

const ICON_BASE_SIZE = 180;

type PlaceholderMetrics = {
  width: number;
  height: number;
  /** 布局坐标系下的圆角 px（与真实 icon/widget 一致） */
  borderRadius: number;
};

/** 跟手占位的尺寸/圆角：对齐真实内容盒，而不是整格 slot */
function getPlaceholderMetrics(
  placement: ThemeHomePlacement,
  layout: ThemeHomeLayout,
): PlaceholderMetrics {
  if (placement.element?.category === 'iconpack') {
    const radius =
      typeof placement.element?.data?.radius === 'number'
        ? placement.element.data.radius
        : 0;
    return {
      width: ICON_BASE_SIZE,
      height: ICON_BASE_SIZE,
      borderRadius: radius,
    };
  }

  const platformData = placement.element?.data ?? {};
  const sizeItem = Array.isArray(platformData.sizes) ? platformData.sizes[0] : null;
  const design = CONFIG_SIZE_MAP[sizeItem?.size] || CONFIG_SIZE_MAP[1];
  const slotW = spanPxX(placement.colSpan, layout);
  const slotH = spanPxY(placement.rowSpan, layout);
  const scale = Math.min(slotW / design.width, slotH / design.height);
  const radius = typeof sizeItem?.radius === 'number' ? sizeItem.radius : 0;

  return {
    width: design.width * scale,
    height: design.height * scale,
    borderRadius: radius * scale,
  };
}

/**
 * 源节点格内占位：在 slot 里居中，圆角用布局 px（会随父级 fitScale 一起缩放）。
 */
function HomeItemPlaceholder({
  placement,
  layout,
}: {
  placement: ThemeHomePlacement;
  layout: ThemeHomeLayout;
}) {
  const metrics = getPlaceholderMetrics(placement, layout);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: metrics.width,
          height: metrics.height,
          borderRadius: metrics.borderRadius,
          boxSizing: 'border-box',
          background: 'rgba(255, 255, 255, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.55)',
          overflow: 'hidden',
        }}
      />
    </div>
  );
}

/**
 * DragOverlay 在屏幕坐标，需按 fitScale/dockScale × xyflow zoom 放大布局圆角与尺寸。
 */
function HomeDragOverlayPlaceholder({
  placement,
  layout,
  boardScale,
  zoom,
}: {
  placement: ThemeHomePlacement;
  layout: ThemeHomeLayout;
  boardScale: number;
  zoom: number;
}) {
  const metrics = getPlaceholderMetrics(placement, layout);
  const overlayScale = boardScale * zoom;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: metrics.width * overlayScale,
          height: metrics.height * overlayScale,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: metrics.width,
            height: metrics.height,
            transform: `scale(${overlayScale})`,
            transformOrigin: '0 0',
            borderRadius: metrics.borderRadius,
            boxSizing: 'border-box',
            background: 'rgba(255, 255, 255, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.55)',
          }}
        />
      </div>
    </div>
  );
}

function DraggableHomeItem({
  placement,
  layout,
}: {
  placement: ThemeHomePlacement;
  layout: ThemeHomeLayout;
}) {
  // isDropping：松手后反馈结束前仍为 true，避免先回到旧位再挂真实内容
  // 仅左上角把手可发起拖拽
  const { ref, handleRef, isDragging, isDropping } = useDraggable({
    id: placement.id,
  });
  const inFlight = isDragging || isDropping;

  const content = inFlight
    ? <HomeItemPlaceholder placement={placement} layout={layout} />
    : renderPlacementContent(placement, layout);
  if (!content) return null;

  const style: CSSProperties = {
    ...placementPixelStyle(placement, layout),
    zIndex: inFlight ? 5 : 2,
    // 拖拽中源节点留在原格，由 DragOverlay 跟手；源节点隐藏避免松手闪回
    opacity: inFlight ? 0 : 1,
    cursor: 'default',
    userSelect: 'none',
  };

  return (
    <div ref={ref} style={style}>
      {content}
      <div
        ref={handleRef}
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          zIndex: 6,
          width: 44,
          height: 44,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontSize: 22,
          lineHeight: 1,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.65)',
        }}
        title="拖拽"
        aria-label="拖拽"
      >
        ⋮⋮
      </div>
    </div>
  );
}

export default function ThemeHomeEditable(props: ThemeHomeEditableProps) {
  const {
    data,
    cols,
    rows,
    dockCols,
    layout,
    dockAlignWithGrid,
    defaultWidth,
    defaultHeight,
    resolveSpan = resolveThemeHomeElementSpan,
    withDock = true,
  } = props;

  const { zoom } = useViewport();
  const registerDesktopEditDraft = useEditorRegisterDesktopEditDraft();
  const width = Number(data.width) > 0 ? Number(data.width) : (defaultWidth ?? 887);
  const height = Number(data.height) > 0 ? Number(data.height) : (defaultHeight ?? 1920);
  const showElements = Array.isArray(data.showElements) ? data.showElements : [];
  const showElementsKey = useMemo(() => JSON.stringify(showElements), [showElements]);

  const [placements, setPlacements] = useState<ThemeHomePlacement[]>(() =>
    buildThemeHomePlacements(showElements, cols, rows, dockCols, resolveSpan).placements,
  );
  const [wallpaper, setWallpaper] = useState<any | null>(
    () => buildThemeHomePlacements(showElements, cols, rows, dockCols, resolveSpan).wallpaper,
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverTarget, setHoverTarget] = useState<ThemeHomeDropTarget | null>(null);
  const hoverTargetRef = useRef<ThemeHomeDropTarget | null>(null);
  const gridBoardRef = useRef<HTMLDivElement | null>(null);
  const dockBoardRef = useRef<HTMLDivElement | null>(null);
  const placementsRef = useRef(placements);
  const showElementsRef = useRef(showElements);
  placementsRef.current = placements;
  showElementsRef.current = showElements;

  useEffect(() => {
    const next = buildThemeHomePlacements(showElements, cols, rows, dockCols, resolveSpan);
    setPlacements(next.placements);
    setWallpaper(next.wallpaper);
  }, [showElementsKey, cols, rows, dockCols, resolveSpan, showElements]);

  useEffect(() => {
    registerDesktopEditDraft(() =>
      placementsToShowElements(placementsRef.current, showElementsRef.current),
    );
    return () => {
      registerDesktopEditDraft(null);
    };
  }, [registerDesktopEditDraft]);

  const handleHoverChange = useCallback(
    (next: { draggingId: string | null; hoverTarget: ThemeHomeDropTarget | null }) => {
      hoverTargetRef.current = next.hoverTarget;
      setDraggingId(next.draggingId);
      setHoverTarget(next.hoverTarget);
    },
    [],
  );

  const clearDragHover = useCallback(() => {
    hoverTargetRef.current = null;
    setDraggingId(null);
    setHoverTarget(null);
  }, []);

  const frame = useMemo(
    () =>
      resolveHomeFrameMetrics({
        width,
        height,
        cols,
        rows,
        dockCols,
        layout,
        dockAlignWithGrid,
        withDock,
      }),
    [width, height, cols, rows, dockCols, layout, dockAlignWithGrid, withDock],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      try {
        const source = event.operation.source;
        if (event.canceled || source?.id == null) return;
        // 与预览一致：按鼠标位置解析出的落点
        const target = hoverTargetRef.current;
        if (!target) return;
        const itemId = String(source.id);
        flushSync(() => {
          setPlacements((prev) =>
            applyThemeHomeDrop({
              placements: prev,
              itemId,
              target,
              cols,
              rows,
              dockCols,
            }),
          );
        });
      } finally {
        clearDragHover();
      }
    },
    [clearDragHover, cols, rows, dockCols],
  );

  const gridSlots = useMemo(() => {
    const nodes = [];
    for (let rowStart = 1; rowStart <= rows; rowStart += 1) {
      for (let colStart = 1; colStart <= cols; colStart += 1) {
        nodes.push(
          <GridSlot
            key={themeHomeGridSlotId(colStart, rowStart)}
            colStart={colStart}
            rowStart={rowStart}
            layout={layout}
          />,
        );
      }
    }
    return nodes;
  }, [cols, rows, layout]);

  const dockSlots = useMemo(() => {
    const nodes = [];
    for (let colStart = 1; colStart <= dockCols; colStart += 1) {
      nodes.push(
        <DockSlot key={themeHomeDockSlotId(colStart)} colStart={colStart} layout={layout} />,
      );
    }
    return nodes;
  }, [dockCols, layout]);

  const gridItems = placements.filter((p) => p.zone === 'grid');
  const dockItems = placements.filter((p) => p.zone === 'dock');

  const wallpaperSource = String(wallpaper?.data?.source || '').trim();
  const dataSource = String(data.source || '').trim();
  const backgroundSource = wallpaperSource || dataSource;

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <HomeDragHoverMonitor
        gridBoardRef={gridBoardRef}
        dockBoardRef={dockBoardRef}
        cols={cols}
        rows={rows}
        dockCols={dockCols}
        layout={layout}
        gridLogicalW={frame.gridW}
        gridLogicalH={frame.gridH}
        dockLogicalW={frame.dockInnerW}
        dockLogicalH={layout.cell}
        onHoverChange={handleHoverChange}
      />
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
            position: 'absolute',
            top: layout.padTop,
            left: layout.padX,
            right: layout.padX,
            bottom: frame.contentBottom,
            display: 'flex',
            justifyContent: 'center',
            alignItems: withDock ? 'flex-start' : 'center',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: frame.gridW * frame.fitScale,
              height: frame.gridH * frame.fitScale,
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <div
              style={{
                width: frame.gridW,
                height: frame.gridH,
                transform: `scale(${frame.fitScale})`,
                transformOrigin: '0 0',
              }}
            >
              <div
                ref={gridBoardRef}
                style={{ position: 'relative', width: frame.gridW, height: frame.gridH }}
              >
                {gridSlots}
                <DropSpanPreview
                  zone="grid"
                  draggingId={draggingId}
                  hoverTarget={hoverTarget}
                  placements={placements}
                  cols={cols}
                  rows={rows}
                  dockCols={dockCols}
                  layout={layout}
                />
                {gridItems.map((item) => (
                  <DraggableHomeItem key={item.id} placement={item} layout={layout} />
                ))}
              </div>
            </div>
          </div>
        </div>
        {withDock ? (
          <div
            style={{
              position: 'absolute',
              zIndex: 2,
              bottom: layout.dockBottom,
              left: frame.dockLeft,
              width: frame.dockDisplayW,
              height: frame.dockDisplayH,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: frame.dockOuterW,
                height: frame.dockOuterH,
                padding: layout.dockPadding,
                boxSizing: 'border-box',
                borderRadius: layout.dockRadius,
                background: 'rgba(255, 255, 255, 0.22)',
                backdropFilter: 'blur(28px) saturate(160%)',
                WebkitBackdropFilter: 'blur(28px) saturate(160%)',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                transform: `scale(${frame.dockScale})`,
                transformOrigin: '0 0',
              }}
            >
              <div
                ref={dockBoardRef}
                style={{ position: 'relative', width: frame.dockInnerW, height: layout.cell }}
              >
                {dockSlots}
                <DropSpanPreview
                  zone="dock"
                  draggingId={draggingId}
                  hoverTarget={hoverTarget}
                  placements={placements}
                  cols={cols}
                  rows={rows}
                  dockCols={dockCols}
                  layout={layout}
                />
                {dockItems.map((item) => (
                  <DraggableHomeItem key={item.id} placement={item} layout={layout} />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {/* 跟手层只用占位；关掉 drop 动画，避免松手先弹回旧位 */}
      <DragOverlay dropAnimation={null}>
        {(source) => {
          const item = placements.find((p) => p.id === String(source.id));
          if (!item) return null;
          const boardScale = item.zone === 'dock' ? frame.dockScale : frame.fitScale;
          return (
            <HomeDragOverlayPlaceholder
              placement={item}
              layout={layout}
              boardScale={boardScale}
              zoom={zoom}
            />
          );
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}
