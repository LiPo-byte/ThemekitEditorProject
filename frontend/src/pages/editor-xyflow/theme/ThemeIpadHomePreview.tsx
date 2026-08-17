import {
  useEditorDesktopEditOpen,
  useEditorDesktopEditingNodeId,
} from '../context';
import ThemeHomeEditable from './ThemeHomeEditable';
import SurfacePreviewImage from './SurfacePreviewImage';
import {
  DEFAULT_IPAD_DOCK_COLS,
  createIpadHomeLayout,
  resolveIpadHomeElementSpan,
} from './themeHomeLayout';

const DEFAULT_IPAD_COLS = 4;
const DEFAULT_IPAD_ROWS = 4;

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

  if (!data) return null;

  const cols = Number(props.cols) > 0 ? Math.floor(Number(props.cols)) : DEFAULT_IPAD_COLS;
  const rows = Number(props.rows) > 0 ? Math.floor(Number(props.rows)) : DEFAULT_IPAD_ROWS;
  const dockCols =
    Number(props.dockCols) > 0
      ? Math.floor(Number(props.dockCols))
      : DEFAULT_IPAD_DOCK_COLS;
  const chromeScale = Number(props.chromeScale) > 0 ? Number(props.chromeScale) : 1;
  const layout = createIpadHomeLayout(chromeScale);

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

  const width = Number(data.width) > 0 ? Number(data.width) : (props.defaultWidth ?? 2048);
  const height = Number(data.height) > 0 ? Number(data.height) : (props.defaultHeight ?? 2732);

  return <SurfacePreviewImage width={width} height={height} source={data.source} />;
}
