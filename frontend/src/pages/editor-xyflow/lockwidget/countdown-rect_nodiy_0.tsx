import { LOCK_ASSET_SCALE, LOCK_CARD_RADIUS } from './base-config';
import { getLockMaskStyle, getLockTextStyle } from './util';
import './style.css';

/**
 * 锁屏倒数日组件（type 1007 / 矩形 / 不可自定义）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_countdown_layout_0_nodiy.yml
 * 和资源包里的 widgets_rectangle_count_down_preview.jpg：
 * 左边一张 129x126 的节日图，右边两行——上面是节日名（title），
 * 下面是剩余天数的大字（remainDays）加单位小字（days）。
 *
 * 字段和字号的对应关系照 widgets_spec.json 反推：remainDays 是 26、days 是 15，
 * 对上设计稿里"148"大、"Days"小，所以 remainDays 画数字、days 画单位，别按字面名字对调。
 */

/** 图片位尺寸 = yml 里 image_count_down_rectangular 的像素尺寸 ÷ LOCK_ASSET_SCALE */
const IMAGE_WIDTH = 129 / LOCK_ASSET_SCALE;
const IMAGE_HEIGHT = 126 / LOCK_ASSET_SCALE;
/**
 * 内边距和行间距是照设计稿的 465x186 图按 ÷3 估的，手调过，
 * 没有跟着 LOCK_ASSET_SCALE 换算：配置里的字号本身就是 @1x 点。
 */
const CARD_PADDING = '0 14px';
const IMAGE_TEXT_GAP = 7;
const TEXT_LINE_GAP = 2;
const DAYS_GAP = 4;

/** 画布上的示例天数，仅用于预览，不进配置 */
const PREVIEW_REMAIN_DAYS = '148';
/** 单位文案由客户端按语言给，画布上固定按英文预览 */
const PREVIEW_DAYS_UNIT = 'Days';

export default function LockCountDownRectNoDIY_0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  const festivalImage = data.image_count_down_rectangular?.source;

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
        justifyContent: 'flex-start',
        gap: IMAGE_TEXT_GAP,
        padding: CARD_PADDING,
        color: focusColor,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          ...(festivalImage
            ? getLockMaskStyle(festivalImage, focusColor)
            : undefined),
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          // 尺寸写死，被 flex 压缩节日图就会变形
          flexShrink: 0,
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: TEXT_LINE_GAP,
          // 节日名可能比剩余宽度长，让它自己截断而不是把图挤走
          minWidth: 0,
        }}
      >
        <div
          style={{
            ...getLockTextStyle(data.title),
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {data.title?.content ?? ''}
        </div>
        <div
          style={{
            display: 'flex',
            // 大字和单位小字按基线对齐，跟设计稿一致
            alignItems: 'baseline',
            gap: DAYS_GAP,
          }}
        >
          <div style={getLockTextStyle(data.remainDays)}>
            {PREVIEW_REMAIN_DAYS}
          </div>
          <div style={getLockTextStyle(data.days)}>{PREVIEW_DAYS_UNIT}</div>
        </div>
      </div>
    </div>
  );
}
