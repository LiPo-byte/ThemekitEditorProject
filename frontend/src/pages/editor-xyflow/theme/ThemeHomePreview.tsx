import type { ReactNode } from 'react';
import GridSpanLayout from '@/pages/editor-xyflow/components/GridSpanLayout';
import AppIcon from '../icon';
import { CONFIG_SIZE_MAP, TYPE_WIDGET_MAP } from '../widget/base-config';
import { xyFlowTypeNodeType } from '../xyFlowTypeNodeType';
import {
  useEditorDesktopEditOpen,
  useEditorDesktopEditingNodeId,
} from '../context';
import ThemeHomeEditable from './ThemeHomeEditable';
import {
  DEFAULT_DOCK_COLS,
  DEFAULT_HOME_COLS,
  DEFAULT_HOME_ROWS,
  DOCK_ROWS,
  LIST_HOME_LAYOUT,
  PHONE_HOME_LAYOUT,
  buildThemeHomePlacements,
  resolveHomeFrameMetrics,
  resolveThemeHomeElementSpan,
  spanPxX,
  spanPxY,
  type ThemeHomeLayout,
  type ThemeHomeSpanResolver,
} from './themeHomeLayout';

export type { ThemeHomeLayout };
export { PHONE_HOME_LAYOUT, LIST_HOME_LAYOUT };

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
  /** 格子/边距尺度，默认主屏；list_view 用 LIST_HOME_LAYOUT */
  layout?: ThemeHomeLayout;
  /**
   * 是否进入拖拽编辑态。
   * 未传时：若提供 nodeId 且匹配当前 desktopEditingNodeId，则自动为 true。
   */
  editable?: boolean;
  /** 画布节点 id，用于与桌面编辑态联动 */
  nodeId?: string;
  /** 占位规则；默认主屏格，iPad 等可注入 */
  resolveSpan?: ThemeHomeSpanResolver;
  /** 是否显示 Dock；list_view_short 传 false */
  withDock?: boolean;
};

function useResolvedEditable(editable: boolean | undefined, nodeId?: string) {
  const desktopEditOpen = useEditorDesktopEditOpen();
  const desktopEditingNodeId = useEditorDesktopEditingNodeId();
  if (typeof editable === 'boolean') return editable;
  if (!nodeId) return false;
  return desktopEditOpen && desktopEditingNodeId === nodeId;
}

export default function ThemeHomePreview(props: ThemeHomePreviewProps) {
  const data = props.data;
  const isEditable = useResolvedEditable(props.editable, props.nodeId);

  if (!data) return null;

  const layout = props.layout ?? PHONE_HOME_LAYOUT;
  const cols = Number(props.cols) > 0 ? Math.floor(Number(props.cols)) : DEFAULT_HOME_COLS;
  const rows = Number(props.rows) > 0 ? Math.floor(Number(props.rows)) : DEFAULT_HOME_ROWS;
  const withDock = props.withDock !== false;
  const dockCols = withDock
    ? Number(props.dockCols) > 0
      ? Math.floor(Number(props.dockCols))
      : DEFAULT_DOCK_COLS
    : 0;
  const dockAlignWithGrid =
    props.dockAlignWithGrid === true
      ? true
      : props.dockAlignWithGrid === false
        ? false
        : cols === dockCols;
  const resolveSpan = props.resolveSpan ?? resolveThemeHomeElementSpan;

  if (isEditable) {
    return (
      <ThemeHomeEditable
        data={data}
        cols={cols}
        rows={rows}
        dockCols={dockCols}
        layout={layout}
        dockAlignWithGrid={dockAlignWithGrid}
        defaultWidth={props.defaultWidth}
        defaultHeight={props.defaultHeight}
        resolveSpan={resolveSpan}
        withDock={withDock}
      />
    );
  }

  const showElements = Array.isArray(data.showElements) ? data.showElements : [];
  const { placements, wallpaper } = buildThemeHomePlacements(
    showElements,
    cols,
    rows,
    dockCols,
    resolveSpan,
  );

  const gridSpanLayoutItems: ReactNode[] = [];
  const dockSpanLayoutItems: ReactNode[] = [];

  placements.forEach((placement) => {
    const content =
      placement.element?.category === 'iconpack'
        ? renderIconCell(placement.element)
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

  const width = Number(data.width) > 0 ? Number(data.width) : (props.defaultWidth ?? 887);
  const height = Number(data.height) > 0 ? Number(data.height) : (props.defaultHeight ?? 1920);

  const frame = resolveHomeFrameMetrics({
    width,
    height,
    cols,
    rows,
    dockCols,
    layout,
    dockAlignWithGrid,
    withDock,
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
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
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
            <GridSpanLayout
              rows={rows}
              cols={cols}
              gap={[layout.gapX, layout.gapY]}
              style={{
                position: 'relative',
                zIndex: 2,
                width: frame.gridW,
                height: frame.gridH,
                gridTemplateColumns: `repeat(${cols}, ${layout.cell}px)`,
                gridTemplateRows: `repeat(${rows}, ${layout.cell}px)`,
              }}
            >
              {gridSpanLayoutItems}
            </GridSpanLayout>
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
            <GridSpanLayout
              rows={DOCK_ROWS}
              cols={dockCols}
              gap={[layout.gapX, 0]}
              style={{
                width: frame.dockInnerW,
                height: layout.cell,
                gridTemplateColumns: `repeat(${dockCols}, ${layout.cell}px)`,
                gridTemplateRows: `${layout.cell}px`,
              }}
            >
              {dockSpanLayoutItems}
            </GridSpanLayout>
          </div>
        </div>
      ) : null}
    </div>
  );
}
