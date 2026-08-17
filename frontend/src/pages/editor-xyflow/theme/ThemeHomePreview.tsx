import {
  useEditorDesktopEditOpen,
  useEditorDesktopEditingNodeId,
} from '../context';
import ThemeHomeEditable from './ThemeHomeEditable';
import SurfacePreviewImage from './SurfacePreviewImage';
import {
  DEFAULT_DOCK_COLS,
  DEFAULT_HOME_COLS,
  DEFAULT_HOME_ROWS,
  LIST_HOME_LAYOUT,
  PHONE_HOME_LAYOUT,
  resolveThemeHomeElementSpan,
  type ThemeHomeLayout,
  type ThemeHomeSpanResolver,
} from './themeHomeLayout';

export type { ThemeHomeLayout };
export { PHONE_HOME_LAYOUT, LIST_HOME_LAYOUT };

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
  /** 主网格 icon 是否显示名称；Dock 内始终不显示 */
  showIconName?: boolean;
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
  const showIconName = props.showIconName === true;

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
        showIconName={showIconName}
      />
    );
  }

  const width = Number(data.width) > 0 ? Number(data.width) : (props.defaultWidth ?? 887);
  const height = Number(data.height) > 0 ? Number(data.height) : (props.defaultHeight ?? 1920);

  return <SurfacePreviewImage width={width} height={height} source={data.source} />;
}
