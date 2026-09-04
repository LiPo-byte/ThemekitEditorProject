import { getLockMaskStyle, getLockTextStyle } from './util';
import { LOCK_ASSET_SCALE } from './base-config';
import './style.css';

const ICON_WIDTH = 51 / LOCK_ASSET_SCALE;
const ICON_HEIGHT = 54 / LOCK_ASSET_SCALE;

export default function LockHealthInLine_0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  const icon = data.image_health?.source;

  return (
    <div
      className={`lock_size_${data?.size ?? 1003}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor,
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: focusColor,
        pointerEvents: 'none',
        borderRadius: '5px'
      }}
    >
      <div
        style={{
          // 只有一行，装不下的部分按 iOS 的表现截断
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: focusColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
        }}
      >
        8Tue
        <div
          style={{
            ...(icon
              ? getLockMaskStyle(icon, focusColor)
              : undefined),
            position: 'relative',
            width: ICON_WIDTH,
            height: ICON_HEIGHT,
            // 尺寸写死，被 flex 压缩跑步图就会变形
            flexShrink: 0,
          }}
        />
        2688 steps
      </div>
    </div>
  );
}
