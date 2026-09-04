import { LOCK_ASSET_SCALE } from './base-config';
import { getLockMaskStyle } from './util';
import './style.css';

/**
 * 锁屏健康组件（type 1009 / layoutType 2 / 圆形）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_health_layout_2_size_0.yml：
 * yml 只约束 size / name / layoutType，没有任何文本字段，
 * 所以下面的步数是写死的预览值，画布上不可编辑。
 */

const ICON_SIZE_WIDTH = 60 / LOCK_ASSET_SCALE;
const ICON_SIZE_HEIGHT = 60 / LOCK_ASSET_SCALE;
const CONTENT_GAP = 2;

/** 画布上的示例步数，仅用于预览，不进配置 */
const PREVIEW_STEPS = '20000';

export default function LockHealthCircle_2(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  const previewIcon = data.image_health?.source;

  return (
    <div
      className={`lock_size_${data?.size ?? 1001}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor,
        overflow: 'hidden',
        borderRadius: '8px',
        // borderRadius: '50%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: CONTENT_GAP,
        color: focusColor,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          ...(previewIcon
            ? getLockMaskStyle(previewIcon, focusColor)
            : undefined),
          width: ICON_SIZE_WIDTH,
          height: ICON_SIZE_HEIGHT,
          flexShrink: 0,
        }}
      />
      <div style={{
        lineHeight: 1,
      }}>{PREVIEW_STEPS}</div>
    </div>
  );
}
