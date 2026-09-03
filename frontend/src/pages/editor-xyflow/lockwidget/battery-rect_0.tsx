import { LOCK_ASSET_SCALE } from './base-config';
import './style.css';

/**
 * 锁屏电量组件（type 1001）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_battery_size_1.yml：
 * 左侧文案区，右侧圆环区。空环底图和充电图标都是 186x186、整块叠在环区上，
 * 只有电量图标是 36x36，跟在百分比文字前面。
 */

/** 以下尺寸都是在 @3x 素材上量出来的像素，除以 LOCK_ASSET_SCALE 换算到画布的 @1x 点 */
const RING_SIZE = 186 / LOCK_ASSET_SCALE;
const BATTERY_ICON_SIZE = 36 / LOCK_ASSET_SCALE;
const CARD_RADIUS = 24 / LOCK_ASSET_SCALE;
/**
 * 内边距和行间距是手调的，没有跟着 LOCK_ASSET_SCALE 换算：
 * 配置里的 textSize（10/16/8/8）本身就是 @1x 点、不随素材比例缩放，
 * 四行文字加起来已经占掉 62 点里的 42 点，留给上下留白的余量很小。
 */
const CARD_PADDING = 10;
const TEXT_LINE_GAP = 2;
/** 画布上的示例电量，仅用于预览，不进配置 */
const PREVIEW_PERCENT = 20;
/**
 * 空环图里只画了内外两个圈，中间的环带是透明的，没法靠 mask 染色，
 * 所以进度弧要用 radial-gradient 自己抠出这条带子。
 * 实测 186x186 的空环图：内圈描边在半径 48~54，外圈在 63~69，中间空隙是 54~63。
 * 这里各向两侧多压 1px 盖住抗锯齿的接缝，反正会被上层的描边挡住。
 */
const RING_INNER_RADIUS = 53 / LOCK_ASSET_SCALE;
const RING_OUTER_RADIUS = 64 / LOCK_ASSET_SCALE;
/** 只保留内外半径之间的圆环带 */
const RING_BAND_MASK =
  `radial-gradient(circle at center,` +
  ` transparent ${RING_INNER_RADIUS}px,` +
  ` #000 ${RING_INNER_RADIUS}px,` +
  ` #000 ${RING_OUTER_RADIUS}px,` +
  ` transparent ${RING_OUTER_RADIUS}px)`;

/**
 * 图片资源都是透明底 + 纯白图形，用 alpha 通道当遮罩、由 background 上色，
 * 抗锯齿边缘会按 alpha 比例着色所以不会有锯齿。
 * background 传纯色或渐变都可以，传渐变就能只让图形的一部分着色。
 * 必须写成行内样式：导出走 html-to-image，它只内联 node.style 里的 mask url。
 */
const getMaskStyle = (src: string, background: string) => ({
  background,
  maskImage: `url(${src})`,
  WebkitMaskImage: `url(${src})`,
  maskSize: 'contain' as const,
  WebkitMaskSize: 'contain' as const,
  maskRepeat: 'no-repeat' as const,
  WebkitMaskRepeat: 'no-repeat' as const,
  maskPosition: 'center' as const,
  WebkitMaskPosition: 'center' as const,
});

const getTextStyle = (textData?: any) => ({
  fontFamily: textData?.font,
  fontSize: textData?.textSize ?? 12,
  lineHeight: textData?.textHeight ? `${textData.textHeight}px` : 1,
  // color: textData?.textColor ?? '#ffffff',
  whiteSpace: 'nowrap' as const,
});

export default function LockBatteryRect_0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const emptyRing = data.image_empty_ring_rectangle?.source;
  const chargingIcon = data.image_charging_icon_rectangle?.source;
  const batteryIcon = data.image_battery_rectangle?.source;
  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';

  return (
    <div
      className={`lock_size_${data?.size ?? 1002}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor,
        overflow: 'hidden',
        borderRadius: CARD_RADIUS,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: CARD_PADDING,
        color: focusColor,
        paddingRight: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: TEXT_LINE_GAP,
          pointerEvents: 'none',
        }}
      >
        <div style={getTextStyle(data.title)}>Battery</div>
        <div
          style={{
            ...getTextStyle(data.percent),
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {batteryIcon && (
            <div
              style={{
                ...getMaskStyle(batteryIcon, focusColor),
                position: 'relative',
                width: BATTERY_ICON_SIZE,
                height: BATTERY_ICON_SIZE,
              }}
            />
          )}
          {PREVIEW_PERCENT}%
        </div>
        <div style={getTextStyle(data.isCharging)}>Not charging</div>
        <div style={getTextStyle(data.mode)}>Low power mode Off</div>
      </div>
      <div
        style={{
          width: RING_SIZE,
          height: RING_SIZE,
          position: 'relative',
          // 高度是写死的，宽度再被 flex 压缩就成了椭圆，进度弧按正圆算的会跟着错位
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `conic-gradient(${focusColor} ${PREVIEW_PERCENT}%, transparent ${PREVIEW_PERCENT}%)`,
            maskImage: RING_BAND_MASK,
            WebkitMaskImage: RING_BAND_MASK,
          }}
        />
        {emptyRing && (
          <div
            style={{
              ...getMaskStyle(emptyRing, focusColor),
              position: 'absolute',
              inset: 0,
            }}
          />
        )}
        {chargingIcon && (
          <div
            style={{
              ...getMaskStyle(chargingIcon, focusColor),
              position: 'absolute',
              inset: 0,
            }}
          />
        )}
      </div>
    </div>
  );
}
