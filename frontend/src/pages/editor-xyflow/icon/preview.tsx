import { useMemo } from 'react';
import DraggableGrid from './DraggableGrid';
import {
  DesktopDndProvider,
  desketopShowToDesktopIcons,
  parseGridSize,
} from './desktop-dnd';

export default function Preview(props: any) {
  const desketopShow = props.data?.desketopShow ?? props.desketopShow;
  // 读当前节点 data.col / data.row；未配时 parseGridSize 内部兜底，不强制全员同一尺寸
  const grid = useMemo(
    () => parseGridSize(props.data?.col, props.data?.row),
    [props.data?.col, props.data?.row],
  );
  // 用内容签名做依赖，避免父级每次新数组引用导致无意义同步
  const desketopShowKey = useMemo(
    () => JSON.stringify(desketopShow ?? []),
    [desketopShow],
  );

  const initialIcons = useMemo(() => {
    try {
      return desketopShowToDesktopIcons(JSON.parse(desketopShowKey), grid);
    } catch {
      return [];
    }
  }, [desketopShowKey, grid]);

  return (
    // key 只用 preview 节点 id：换节点才 remount；选/取消 app 只走 icons 同步
    <DesktopDndProvider
      key={props.id}
      initialIcons={initialIcons}
      columns={grid.columns}
      rows={grid.rows}
    >
      <div
        style={{
          padding: 50,
        }}
      >
        <DraggableGrid />
      </div>
    </DesktopDndProvider>
  );
}
