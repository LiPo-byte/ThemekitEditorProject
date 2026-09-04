import { LOCK_ASSET_SCALE, LOCK_CARD_RADIUS } from './base-config';
import { getLockTextStyle } from './util';
import './style.css';

/**
 * 锁屏倒数日组件（type 1007 / layoutType 0 / 可自定义）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_countdown_layout_0_diy.yml 和设计稿：
 * 左边一张翻页卡图、剩余天数压在图上居中，右边是事件名、最多两行。
 *
 * 与 NoDIY 版的差别都写在各自的 yml 里：DIY 没有 festivalName（日期由用户自己选）、
 * 也没有 days 单位小字，title.content 是 required: false（用户没填就空着）。
 *
 * 左图用 <img> 原样画，不像日历/天气那样当遮罩上色：设计稿里卡片是粉色、数字是黑色，
 * 两者不同色说明图自带配色，走 getLockMaskStyle 会被 focusColor 涂成一整片。
 */

/**
 * 尺寸按设计稿的 465x186 图量出来再 ÷ LOCK_ASSET_SCALE。
 * 图位取 141x108 而不是圆角块本身的 135x108：中间那条翻页线左右各支出约 3px，
 * 它和圆角块是同一张图，按窄的算会把线截掉。
 * yml 里 image_count_down_rectangular_customised 是可选文件、没给 file_rules，
 * 所以这个尺寸只能以设计稿为准。
 */
const IMAGE_WIDTH = 141 / LOCK_ASSET_SCALE;
const IMAGE_HEIGHT = 108 / LOCK_ASSET_SCALE;
/** 左右内边距同样是量图得来的：左 36/3、右 (465-423)/3 */
const CARD_PADDING = '0 14px 0 12px';
const IMAGE_TEXT_GAP = 10;
/** 设计稿右侧文案占两行，且是从词中间断开的，所以按字符断行而不是按词 */
const TITLE_MAX_LINES = 2;

/** 画布上的示例天数，仅用于预览，不进配置 */
const PREVIEW_REMAIN_DAYS = '123';

export default function LockCountDownRectDIY_0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  const flipCardImage = data.image_count_down_rectangular_customised?.source;

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
          position: 'relative',
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          // 尺寸写死，被 flex 压缩翻页卡就会变形
          flexShrink: 0,
        }}
      >
        {flipCardImage && (
          <img
            src={flipCardImage}
            alt=""
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        )}
        <div
          style={{
            ...getLockTextStyle(data.remainDays),
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {PREVIEW_REMAIN_DAYS}
        </div>
      </div>
      <div
        style={{
          ...getLockTextStyle(data.title),
          // 覆盖 getLockTextStyle 的 nowrap，按设计稿折成两行、超出截断
          whiteSpace: 'pre-wrap',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: TITLE_MAX_LINES,
          overflow: 'hidden',
          wordBreak: 'break-all',
          // 文案再长也不许把左边的翻页卡挤走
          minWidth: 0,
        }}
      >
        {data.title?.content ?? ''}
      </div>
    </div>
  );
}
