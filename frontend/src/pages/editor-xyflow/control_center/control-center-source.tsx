import { PictureOutlined } from '@ant-design/icons';
import type { CSSProperties } from 'react';
import type { ControlCenterFileRole } from './asset-rules';

type SlotItem = {
  key: string;
  role?: ControlCenterFileRole;
  asset?: {
    source?: string;
    pagsource?: string;
    ext?: string;
  };
  width?: number;
  height?: number;
};

/**
 * 画布上的静态槽位格子：单图、整屏效果图、滑条。
 * 双态槽位不走这里，它要能点，见 control-center-toggle。
 *
 * 素材按真实像素画（和 iconpack、charging_animation 一样 1:1，不归一化），
 * 格子可能比素材宽（见 util 的 MIN_CELL_WIDTH），素材在其中居中，下面跟一行中文名。
 */
export default function ControlCenterSource(props: any) {
  const data = props.data ?? {};
  const items = (data.items ?? []) as SlotItem[];

  const mediaWidth =
    Number(data.mediaWidth) > 0 ? Number(data.mediaWidth) : 100;
  const mediaHeight =
    Number(data.mediaHeight) > 0 ? Number(data.mediaHeight) : 100;
  const labelHeight =
    Number(data.fileNameHeight) > 0 ? Number(data.fileNameHeight) : 40;

  const isSlider = data.kind === 'slider';
  const hasAnySource = items.some((item) => item.asset?.source);

  /** 按素材自己的尺寸在 media 区里居中，滑条的三层才能对齐叠起来 */
  const renderLayer = (item: SlotItem | undefined, extra?: CSSProperties) => {
    const source = item?.asset?.source;
    if (!source) return null;
    const width = item?.width ?? mediaWidth;
    const height = item?.height ?? mediaHeight;
    return (
      <img
        key={item?.key}
        src={source}
        alt=""
        style={{
          position: 'absolute',
          left: (mediaWidth - width) / 2,
          top: (mediaHeight - height) / 2,
          width,
          height,
          display: 'block',
          ...extra,
        }}
      />
    );
  };

  /** 滑条三层一起画：底图 + 填一半的填充层 + 圆点，才看得出是一条进度条 */
  const renderSlider = () => {
    const track = items.find((item) => item.role === 'track');
    const fill = items.find((item) => item.role === 'fill');
    const thumb = items.find((item) => item.role === 'thumb');
    // 竖条（音量、亮度）从下往上填，横条（播放、音量进度）从左往右
    const vertical = (track?.height ?? 0) > (track?.width ?? 0);
    return (
      <>
        {renderLayer(track)}
        {renderLayer(fill, {
          clipPath: vertical ? 'inset(50% 0 0 0)' : 'inset(0 50% 0 0)',
        })}
        {renderLayer(thumb)}
      </>
    );
  };

  const renderMedia = () => {
    if (!hasAnySource) {
      return (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            color: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <PictureOutlined style={{ fontSize: 28 }} />
          <span style={{ fontSize: 12 }}>暂无资源</span>
        </span>
      );
    }
    if (isSlider) return renderSlider();
    return renderLayer(items[0]);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: mediaWidth,
          height: mediaHeight,
          flex: '0 0 auto',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          boxSizing: 'border-box',
        }}
      >
        {renderMedia()}
      </div>
      <div
        title={data.label}
        style={{
          width: '100%',
          height: labelHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          color: 'rgba(0, 0, 0, 0.65)',
          textAlign: 'center',
          padding: '0 4px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {data.label ?? data.name}
      </div>
    </div>
  );
}
