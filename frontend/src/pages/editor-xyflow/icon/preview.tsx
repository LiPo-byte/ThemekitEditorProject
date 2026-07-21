import { useMemo } from 'react';
import DraggableGrid from './DraggableGrid';
import {
  DesktopDndProvider,
  bannerItemsToDesktopIcons,
  desketopShowToDesktopIcons,
  parseGridPaddingY,
  parseGridSize,
  splitDesketopShowForBanner,
} from './desktop-dnd';

export default function Preview(props: any) {
  const desketopShow = props.data?.desketopShow ?? props.desketopShow;
  // 读当前节点 data.col / data.row；未配时 parseGridSize 内部兜底，不强制全员同一尺寸
  const grid = useMemo(
    () => parseGridSize(props.data?.col, props.data?.row),
    [props.data?.col, props.data?.row],
  );
  // preview 级开关：false 时正方形格子、不显示 name
  const withName = props.data?.withName !== false;
  // preview 级开关：显式 true 才显示底部 Dock
  const withBanner = props.data?.withBanner === true;
  // preview 级：主网格上下内边距（px）
  const gridPaddingY = parseGridPaddingY(props.data?.gridPaddingY);
  // 用内容签名做依赖，避免父级每次新数组引用导致无意义同步
  const desketopShowKey = useMemo(
    () => JSON.stringify(desketopShow ?? []),
    [desketopShow],
  );

  const { initialIcons, initialBannerIcons } = useMemo(() => {
    try {
      const list = JSON.parse(desketopShowKey);
      if (!withBanner) {
        return {
          initialIcons: desketopShowToDesktopIcons(list, grid),
          initialBannerIcons: [],
        };
      }
      const { gridItems, bannerItems } = splitDesketopShowForBanner(
        list,
        grid,
        grid.columns,
      );
      return {
        initialIcons: desketopShowToDesktopIcons(gridItems, grid),
        initialBannerIcons: bannerItemsToDesktopIcons(
          bannerItems,
          grid.columns,
        ),
      };
    } catch {
      return { initialIcons: [], initialBannerIcons: [] };
    }
  }, [desketopShowKey, grid, withBanner]);

  return (
    // key 只用 preview 节点 id：换节点才 remount；选/取消 app 只走 icons 同步
    <DesktopDndProvider
      key={props.id}
      initialIcons={initialIcons}
      initialBannerIcons={initialBannerIcons}
      columns={grid.columns}
      rows={grid.rows}
      withName={withName}
      withBanner={withBanner}
      gridPaddingY={gridPaddingY}
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
