import {
  LOCK_ASSET_SCALE,
  LOCK_CARD_RADIUS,
  LOCK_WEATHER_ICON_KEYS,
} from './base-config';
import { getLockMaskStyle, getLockTextStyle } from './util';
import './style.css';

/**
 * 锁屏天气组件（type 1004 / weatherType 3 / 矩形）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_weather_3_size_1.yml：
 * 五列横排的逐小时预报，每列自上而下是气温、天气图标、时刻。
 * topInfo 管气温那一行，bottomInfo 管时刻那一行。
 *
 * 与 weatherType 2 的差别是每列各有一个下移量（PREVIEW_TIMES 的 paddingTop），
 * 让气温和图标沿折线起伏；时刻那行靠 space-between 仍然贴着卡片底边对齐。
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
  { time: 'NOW', val: '30°', paddingTop: 10 },
  { time: '7pm', val: '33°', paddingTop: 13 },
  { time: '8pm', val: '32°', paddingTop: 7 },
  { time: '9pm', val: '30°', paddingTop: 4 },
  { time: '10pm', val: '26°', paddingTop: 7 },
];
export default function LockWeatherRect_3(props: any) {
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
        padding: `5px ${CARD_PADDING}`,
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
            height: '100%',
            // 图标是正方形，列宽被 flex 压缩会把它挤变形
            flexShrink: 0,
            justifyContent: 'space-between',
            paddingTop: time.paddingTop,
          }}
        >
          <div>
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
          </div>
          <div style={highStyle}>{time.time}</div>
        </div>
      ))}
    </div>
  );
}
