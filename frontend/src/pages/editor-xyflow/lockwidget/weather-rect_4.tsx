import {
  LOCK_ASSET_SCALE,
  LOCK_CARD_RADIUS,
  LOCK_WEATHER_ICON_KEYS,
} from './base-config';
import { getLockMaskStyle, getLockTextStyle } from './util';
import './style.css';

/**
 * 锁屏天气组件（type 1004 / weatherType 4 / 矩形）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_weather_4_size_1.yml：
 * 左上是当前气温和体感温度两行，右上角一个天气图标，底部一行高温/低温/降水概率。
 *
 * 配置只有 topInfo 和 bottomInfo 两个文本字段（没有 font_heavy），
 * 所以上面两行大字走 topInfo，底部那行小字走 bottomInfo。
 */

const ICON_SIZE = 42 / LOCK_ASSET_SCALE;
/**
 * 内边距和行间距是照设计稿的 465x186 图按 ÷3 估的，手调过，
 * 没有跟着 LOCK_ASSET_SCALE 换算：配置里的字号本身就是 @1x 点。
 */
const CARD_PADDING = '6px 9px';
const TOP_LINE_GAP = 3;
const FEELS_LIKE_GAP = 5;
const BOTTOM_ITEM_GAP = 12;
/** 底部那行的图标跟着小字走，比右上角的主图标小一圈 */
const BOTTOM_ICON_SIZE = 10;
const BOTTOM_ICON_GAP = 2;

/** 画布上的示例天气，仅用于预览，不进配置 */
const PREVIEW_TEMP = '60°';
const PREVIEW_FEELS_LIKE = 'feels like';
const PREVIEW_FEELS_LIKE_TEMP = '50°';
/**
 * 降水概率后面跟 image_rain，这张图配置里有、yaml 的 required_files 里也有。
 *
 * 设计稿里高温后面还跟向上箭头、低温后面跟向下箭头，这两个暂不画：
 * 配置字段和 required_files 里都没有它们的位置，画布上凭空加了客户端渲染不出来，
 * 两边会对不上。之后确认要做的话，在这里补 iconKey 即可。
 */
const PREVIEW_BOTTOM: { id: string; text: string; iconKey?: string }[] = [
  { id: 'high', text: '25°' },
  { id: 'low', text: '25°' },
  { id: 'precipitation', text: '9%', iconKey: 'image_rain' },
];

export default function LockWeatherRect_4(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  /** 这个排版只有一个图标位，取按 key 顺序第一张传了的做预览 */
  const previewIcon = LOCK_WEATHER_ICON_KEYS.map(
    (key) => data[key]?.source,
  ).find(Boolean);

  const topStyle = getLockTextStyle(data.topInfo);
  const bottomStyle = getLockTextStyle(data.bottomInfo);

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
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: CARD_PADDING,
        color: focusColor,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: TOP_LINE_GAP,
          }}
        >
          <div style={topStyle}>{PREVIEW_TEMP}</div>
          <div style={{ ...topStyle, display: 'flex', gap: FEELS_LIKE_GAP }}>
            <span>{PREVIEW_FEELS_LIKE}</span>
            <span>{PREVIEW_FEELS_LIKE_TEMP}</span>
          </div>
        </div>
        <div
          style={{
            ...(previewIcon
              ? getLockMaskStyle(previewIcon, focusColor)
              : undefined),
            width: ICON_SIZE,
            height: ICON_SIZE,
            // 图标是正方形，被 flex 压缩会挤变形
            flexShrink: 0,
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: BOTTOM_ITEM_GAP }}>
        {PREVIEW_BOTTOM.map((item) => {
          const iconSource = item.iconKey
            ? data[item.iconKey]?.source
            : undefined;
          return (
            <div
              key={item.id}
              style={{
                ...bottomStyle,
                display: 'flex',
                alignItems: 'center',
                gap: BOTTOM_ICON_GAP,
              }}
            >
              <span>{item.text}</span>
              {iconSource && (
                <div
                  style={{
                    ...getLockMaskStyle(iconSource, focusColor),
                    width: BOTTOM_ICON_SIZE,
                    height: BOTTOM_ICON_SIZE,
                    // 图标是正方形，被 flex 压缩会挤变形
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
