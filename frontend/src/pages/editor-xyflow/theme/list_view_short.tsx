import ThemeHomePreview from './ThemeHomePreview';
import {
  LIST_VIEW_SHORT_LAYOUT,
  resolveListViewShortSpan,
} from './themeHomeLayout';

/** 4×3 短列表：无 Dock、仅 icon，支持桌面拖拽编辑 */
export default function ListViewShort(props: any) {
  return (
    <ThemeHomePreview
      nodeId={props.id}
      data={props.data}
      defaultWidth={738}
      defaultHeight={564}
      cols={4}
      rows={3}
      withDock={false}
      layout={LIST_VIEW_SHORT_LAYOUT}
      resolveSpan={resolveListViewShortSpan}
    />
  );
}
