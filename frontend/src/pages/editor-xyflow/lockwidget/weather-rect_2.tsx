import {
  LOCK_ASSET_SCALE,
  LOCK_CARD_RADIUS,
  LOCK_WEATHER_ICON_KEYS,
} from './base-config';
import { getLockMaskStyle, getLockTextStyle } from './util';
import './style.css';

/**
 * 锁屏天气组件（type 1004 / weatherType 2 / 矩形）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_weather_2_size_1.yml：
 * 五列横排的逐小时预报，每列自上而下是气温、天气图标、时刻。
 * topInfo 管气温那一行，bottomInfo 管时刻那一行。
 *
 * 图标六张，和同为 weatherType 2 的圆形不是一套：矩形要 image_temp、不要 image_wind，
 * 圆形正好相反。两边的 required_files 别照抄。
 */

const ICON_SIZE = 42 / LOCK_ASSET_SCALE;
/**
 * 五列要塞进 155pt，留白只能压得很小。这几个值是手调的，
 * 没有跟着 LOCK_ASSET_SCALE 换算：配置里的字号本身就是 @1x 点。
 */
const CARD_PADDING = '15px';
const COLUMN_LINE_GAP = 1;

/** 画布上的示例预报，仅用于预览，不进配置 */
const PREVIEW_TIMES = [
  { time: '15:00', val: '30°' },
  { time: '16:00', val: '33°' },
  { time: '17:00', val: '32°' },
  { time: '18:00', val: '30°' },
  { time: '19:00', val: '26°' },
];

export default function LockWeatherRect_2(props: any) {
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
      {PREVIEW_TIMES.map((time, index) => (
        <div
          key={time.time}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: COLUMN_LINE_GAP,
            // 图标是正方形，列宽被 flex 压缩会把它挤变形
            flexShrink: 0,
          }}
        >
          <div style={getLockTextStyle(data.topInfo)}>{time.val}</div>
          <div
            style={{
              ...(uploadedIcons[index]
                ? getLockMaskStyle(uploadedIcons[index], focusColor)
                : undefined),
              width: ICON_SIZE,
              height: ICON_SIZE,
            }}
          />
          <div style={highStyle}>{time.time}</div>
        </div>
      ))}
    </div>
  );
}
