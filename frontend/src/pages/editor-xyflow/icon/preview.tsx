import { useMemo } from 'react';
import DraggableGrid from './DraggableGrid';
import {
  DesktopDndProvider,
  desketopShowToDesktopIcons,
} from './desktop-dnd';

export default function Preview(props: any) {
  const desketopShow = props.data?.desketopShow ?? props.desketopShow;
  // 用内容签名做依赖，避免父级每次新数组引用导致无意义同步
  const desketopShowKey = useMemo(
    () => JSON.stringify(desketopShow ?? []),
    [desketopShow],
  );

  const initialIcons = useMemo(() => {
    try {
      return desketopShowToDesktopIcons(JSON.parse(desketopShowKey));
    } catch {
      return [];
    }
  }, [desketopShowKey]);

  return (
    // key 只用 preview 节点 id：换节点才 remount；选/取消 app 只走 icons 同步
    <DesktopDndProvider key={props.id} initialIcons={initialIcons}>
      <DraggableGrid />
    </DesktopDndProvider>
  );
}
