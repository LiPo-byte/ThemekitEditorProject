import SurfacePreviewImage from '../theme/SurfacePreviewImage';

/**
 * 锁屏包的三张预览面。
 *
 * 与 theme 的预览面分开注册：theme 那三个组件（preview_long / preview_short /
 * list_view）走的是主屏网格那套编辑态，锁屏包没有 icon 也没有主屏格子，
 * 复用会把主屏逻辑带进来，所以这里只保留「展示上传的成品图」这一条路径。
 */
type LockpackSurfaceProps = {
  data?: Record<string, any>;
  defaultWidth: number;
  defaultHeight: number;
};

const LockpackSurface = ({
  data,
  defaultWidth,
  defaultHeight,
}: LockpackSurfaceProps) => {
  if (!data) return null;
  const width = Number(data.width) > 0 ? Number(data.width) : defaultWidth;
  const height = Number(data.height) > 0 ? Number(data.height) : defaultHeight;
  return (
    <SurfacePreviewImage width={width} height={height} source={data.source} />
  );
};

export function LockpackPreviewLong(props: any) {
  return (
    <LockpackSurface
      data={props.data}
      defaultWidth={887}
      defaultHeight={1920}
    />
  );
}

export function LockpackPreviewShort(props: any) {
  return (
    <LockpackSurface
      data={props.data}
      defaultWidth={887}
      defaultHeight={1578}
    />
  );
}

export function LockpackListView(props: any) {
  return (
    <LockpackSurface
      data={props.data}
      defaultWidth={492}
      defaultHeight={1065}
    />
  );
}
