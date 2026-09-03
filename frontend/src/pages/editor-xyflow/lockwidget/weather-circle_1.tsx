import { LOCK_ASSET_SCALE, LOCK_WEATHER_ICON_KEYS } from './base-config';
import { getLockMaskStyle, getLockTextStyle } from './util';
import './style.css';

/**
 * 锁屏天气组件（type 1004 / weatherType 1 / 圆形）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_weather_1_size_0.yml：
 * 圆形只有 bottomInfo 一个文本字段（没有矩形那边的 topInfo 和 font_heavy），
 * 所以是上图标下文字的居中两行；图标集比矩形多一张 image_temp，共七张。
 */

const ICON_SIZE = 42 / LOCK_ASSET_SCALE;
const CONTENT_GAP = 2;

/**
 * 画布上的示例温度，仅用于预览，不进配置。
 * 用 °F 两个字符而不是单字符 ℉：后者在 CJK 兼容区，自定义字体基本没有这个字形，
 * 缺字形会回退到系统字体，和旁边的数字不是一套，导出截图时也会跟着走样。
 */
const PREVIEW_TEMP = '36°F';

export default function LockWeatherCircle_1(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  /** 圆形只有一个图标位，取按 key 顺序第一张传了的做预览 */
  const previewIcon = LOCK_WEATHER_ICON_KEYS.map(
    (key) => data[key]?.source,
  ).find(Boolean);

  return (
    <div
      className={`lock_size_${data?.size ?? 1001}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor,
        overflow: 'hidden',
        // 圆形规格的卡片本身就是个正圆，不走矩形那套固定圆角
        borderRadius: '50%',
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
          width: ICON_SIZE,
          height: ICON_SIZE,
          flexShrink: 0,
        }}
      />
      <div style={getLockTextStyle(data.bottomInfo)}>{PREVIEW_TEMP}</div>
    </div>
  );
}
