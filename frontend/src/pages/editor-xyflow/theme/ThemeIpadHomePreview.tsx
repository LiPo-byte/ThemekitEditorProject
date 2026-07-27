import type { ReactNode } from 'react';
import GridSpanLayout from '@/pages/editor-xyflow/components/GridSpanLayout';
import AppIcon from '../icon';
import { CONFIG_SIZE_MAP, TYPE_WIDGET_MAP } from '../widget/base-config';
import { xyFlowTypeNodeType } from '../xyFlowTypeNodeType';
import {
  useEditorDesktopEditOpen,
  useEditorDesktopEditingNodeId,
  useEditorGetElementsConfigMap,
} from '../context';
import ThemeHomeEditable from './ThemeHomeEditable';
import { resolveShowElements } from './resolveShowElements';
import {
  DEFAULT_IPAD_DOCK_COLS,
  DOCK_ROWS,
  buildThemeHomePlacements,
  createIpadHomeLayout,
  dockCellOf,
  gridCellH,
  gridCellW,
  resolveHomeFrameMetrics,
  resolveIpadHomeElementSpan,
  spanPxX,
  spanPxY,
  type ThemeHomeLayout,
} from './themeHomeLayout';

const IPAD_ICON_NAME_HEIGHT = 36;
const DEFAULT_IPAD_COLS = 4;
const DEFAULT_IPAD_ROWS = 4;

const resolveWidgetXyflowType = (type: number, layoutType?: number) => {
  const wt = TYPE_WIDGET_MAP[type];
  if (!wt) return '';
  return `${wt}_${layoutType || 0}`;
};

const renderIconCell = (element: any, layout: ThemeHomeLayout) => {
  const name = String(element?.data?.name ?? element?.data?.key ?? '');
  const cellW = gridCellW(layout);
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: layout.cell,
        }}
      >
        <AppIcon data={element.data} scale={1} />
        <div
          style={{
            marginTop: 6,
            height: IPAD_ICON_NAME_HEIGHT,
            width: cellW - 16,
            maxWidth: cellW - 16,
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

function useResolvedEditable(editable: boolean | undefined, nodeId?: string) {
  const desktopEditOpen = useEditorDesktopEditOpen();
  const desktopEditingNodeId = useEditorDesktopEditingNodeId();
  if (typeof editable === 'boolean') return editable;
  if (!nodeId) return false;
  return desktopEditOpen && desktopEditingNodeId === nodeId;
}

export type ThemeIpadHomePreviewProps = {
  data?: any;
  defaultWidth?: number;
  defaultHeight?: number;
  cols?: number;
  rows?: number;
  dockCols?: number;
  /**
   * 边距 / Dock 外壳相对 long_ipad 的缩放。
   * list_view_ipad 画布为一半时传 0.5，左右边距等同步缩小。
   */
  chromeScale?: number;
  /**
   * 是否进入拖拽编辑态。
   * 未传时：若提供 nodeId 且匹配当前 desktopEditingNodeId，则自动为 true。
   */
  editable?: boolean;
  /** 画布节点 id，用于与桌面编辑态联动 */
  nodeId?: string;
};

export default function ThemeIpadHomePreview(props: ThemeIpadHomePreviewProps) {
  const data = props.data;
  const isEditable = useResolvedEditable(props.editable, props.nodeId);
  const getElementsConfigMap = useEditorGetElementsConfigMap();

  if (!data) return null;

  const cols = Number(props.cols) > 0 ? Math.floor(Number(props.cols)) : DEFAULT_IPAD_COLS;
  const rows = Number(props.rows) > 0 ? Math.floor(Number(props.rows)) : DEFAULT_IPAD_ROWS;
  const dockCols =
    Number(props.dockCols) > 0
      ? Math.floor(Number(props.dockCols))
      : DEFAULT_IPAD_DOCK_COLS;
  const chromeScale = Number(props.chromeScale) > 0 ? Number(props.chromeScale) : 1;
  const layout = createIpadHomeLayout(chromeScale);
  const cellW = gridCellW(layout);
  const cellH = gridCellH(layout);
  const dockCell = dockCellOf(layout);

  if (isEditable) {
    return (
      <ThemeHomeEditable
        data={data}
        cols={cols}
        rows={rows}
        dockCols={dockCols}
        layout={layout}
        dockAlignWithGrid={false}
        defaultWidth={props.defaultWidth}
        defaultHeight={props.defaultHeight}
        resolveSpan={resolveIpadHomeElementSpan}
        withDock
        showIconName
        scaleWithDockWidth
      />
    );
  }

  const showElements = resolveShowElements(
    Array.isArray(data.showElements) ? data.showElements : [],
    getElementsConfigMap(),
  );
  const { placements, wallpaper } = buildThemeHomePlacements(
    showElements,
    cols,
    rows,
    dockCols,
    resolveIpadHomeElementSpan,
  );

  const gridSpanLayoutItems: ReactNode[] = [];
  const dockSpanLayoutItems: ReactNode[] = [];

  placements.forEach((placement) => {
    const content =
      placement.element?.category === 'iconpack'
        ? placement.zone === 'dock'
          ? renderDockIconCell(placement.element)
          : renderIconCell(placement.element, layout)
        : renderWidgetCell(
            placement.element,
            placement.colSpan,
            placement.rowSpan,
            layout,
          );
    if (!content) return;

    const item = (
      <GridSpanLayout.Item
        key={placement.id}
        colSpan={placement.colSpan}
        rowSpan={placement.rowSpan}
        colStart={placement.colStart}
        rowStart={placement.rowStart}
      >
        {content}
      </GridSpanLayout.Item>
    );

    if (placement.zone === 'dock') {
      dockSpanLayoutItems.push(item);
    } else {
      gridSpanLayoutItems.push(item);
    }
  });

  const width = Number(data.width) > 0 ? Number(data.width) : (props.defaultWidth ?? 2048);
  const height = Number(data.height) > 0 ? Number(data.height) : (props.defaultHeight ?? 2732);

  const frame = resolveHomeFrameMetrics({
    width,
    height,
    cols,
    rows,
    dockCols,
    layout,
    dockAlignWithGrid: false,
    withDock: true,
    scaleWithDockWidth: true,
  });

  const wallpaperSource = String(wallpaper?.data?.source || '').trim();
  const dataSource = String(data.source || '').trim();
  const backgroundSource = wallpaperSource || dataSource;

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
          alignItems: 'flex-start',
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
            <GridSpanLayout
              rows={rows}
              cols={cols}
              gap={[layout.gapX, layout.gapY]}
              style={{
                position: 'relative',
                zIndex: 2,
                width: frame.gridW,
                height: frame.gridH,
                gridTemplateColumns: `repeat(${cols}, ${cellW}px)`,
                gridTemplateRows: `repeat(${rows}, ${cellH}px)`,
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
          <GridSpanLayout
            rows={DOCK_ROWS}
            cols={dockCols}
            gap={[layout.gapX, 0]}
            style={{
              width: frame.dockInnerW,
              height: dockCell,
              gridTemplateColumns: `repeat(${dockCols}, ${dockCell}px)`,
              gridTemplateRows: `${dockCell}px`,
            }}
          >
            {dockSpanLayoutItems}
          </GridSpanLayout>
        </div>
      </div>
    </div>
  );
}
