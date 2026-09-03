import {
  LOCK_ASSET_SCALE,
  LOCK_CARD_RADIUS,
  LOCK_WEATHER_ICON_KEYS,
} from './base-config';
import { getLockMaskStyle, getLockTextStyle } from './util';
import './style.css';

/**
 * 锁屏天气组件（type 1004 / weatherType 1 / 矩形）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_weather_1_size_1.yml：
 * 周一到周五五列横排，每列自上而下是星期简写、天气图标、最高温、最低温。
 * topInfo 管星期那一行，bottomInfo 管两行温度——最高温取 font_heavy，最低温取 font。
 */

const ICON_SIZE = 42 / LOCK_ASSET_SCALE;
/**
 * 五列要塞进 155pt，留白只能压得很小。这几个值是手调的，
 * 没有跟着 LOCK_ASSET_SCALE 换算：配置里的字号本身就是 @1x 点。
 */
const CARD_PADDING = '15px';
const COLUMN_LINE_GAP = 1;

/** 画布上的示例预报，仅用于预览，不进配置 */
const PREVIEW_DAYS = [
  { weekday: 'Mon', high: '36°', low: '24°' },
  { weekday: 'Tue', high: '34°', low: '23°' },
  { weekday: 'Wed', high: '32°', low: '22°' },
  { weekday: 'Thu', high: '30°', low: '21°' },
  { weekday: 'Fri', high: '28°', low: '20°' },
];

export default function LockWeatherRect_1(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  /**
   * 天气图标运行时按当天天气挑一张，画布上没有依据决定哪天是什么天气，
   * 就把已经传了的依次铺到五列，让每列显示不同的图标、方便一眼核对素材。
   * 配置里没有记录上传先后，所以排序只能按固定的 key 走，不是真正的上传时间。
   */
  const uploadedIcons = LOCK_WEATHER_ICON_KEYS.map(
    (key) => data[key]?.source,
  ).filter(Boolean);

  const bottomInfo = data.bottomInfo;
  const highStyle = getLockTextStyle(
    bottomInfo && {
      ...bottomInfo,
      font: bottomInfo.font_heavy ?? bottomInfo.font,
    },
  );
  const lowStyle = getLockTextStyle(bottomInfo);

  return (
    <div
      className={`lock_size_${data?.size ?? 1002}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor,
        overflow: 'hidden',
        borderRadius: LOCK_CARD_RADIUS,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: CARD_PADDING,
        color: focusColor,
        pointerEvents: 'none',
      }}
    >
      {PREVIEW_DAYS.map((day, index) => (
        <div
          key={day.weekday}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: COLUMN_LINE_GAP,
            // 图标是正方形，列宽被 flex 压缩会把它挤变形
            flexShrink: 0,
          }}
        >
          <div style={getLockTextStyle(data.topInfo)}>{day.weekday}</div>
          <div
            style={{
              ...(uploadedIcons[index]
                ? getLockMaskStyle(uploadedIcons[index], focusColor)
                : undefined),
              width: ICON_SIZE,
              height: ICON_SIZE,
            }}
          />
          <div style={highStyle}>{day.high}</div>
          <div style={lowStyle}>{day.low}</div>
        </div>
      ))}
    </div>
  );
}
