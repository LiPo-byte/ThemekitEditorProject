import { LOCK_ASSET_SCALE, LOCK_CARD_RADIUS } from './base-config';
import { getLockMaskStyle } from './util';
import './style.css';

/**
 * 锁屏健康组件（type 1009 / layoutType 0 / 矩形）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_health_layout_0_size_1.yml 和设计稿：
 * 左对齐三行——"Today"、"已完成/目标"、一排 10 枚勋章，达成的部分实色、未达成的降透明度。
 *
 * 这个组件的 yml 里没有任何文字字段（item_fields 只有 size / name / layoutType），
 * 两行文案的字体字号由客户端自己定，配置管不着，所以下面的字号只是画布预览用的估值，
 * 不要当成能下发的配置——真要让设计师调，得先让客户端支持对应字段。
 */

/** 勋章位 = yml 里 image_health 的像素尺寸 ÷ LOCK_ASSET_SCALE，24x48 的图正好是 8x16 点 */
const ICON_WIDTH = 24 / LOCK_ASSET_SCALE;
const ICON_HEIGHT = 48 / LOCK_ASSET_SCALE;
/**
 * 勋章间距：设计稿上整排占 117.7 点、10 枚，反解 (117.7 - 8*10) / 9 得 4.2。
 * 写死这个值而不是用 space-between，避免卡片宽度变化时勋章跟着散开。
 */
const ICON_GAP = 4.2;
const ICON_COUNT = 10;
/** 画布上的示例进度，仅用于预览，不进配置 */
const PREVIEW_ACTIVE_COUNT = 6;
const PREVIEW_TITLE = 'Today';
const PREVIEW_PROGRESS = '1233/2399';
/** 未达成勋章的透明度，取自设计稿反解（逐通道算出约 0.43） */
const INACTIVE_ICON_OPACITY = 0.4;

/**
 * 内边距、字号、行高都是照设计稿的 465x186 图按 ÷3 量出来再手调的。
 * 三行的落位对得上实测：Today 墨迹 4.7~15.3、进度 21.3~34.3、勋章 39~55。
 */
const CARD_PADDING = '4px 10px';
const TITLE_FONT_SIZE = 12;
const TITLE_LINE_HEIGHT = 13;
const PROGRESS_FONT_SIZE = 16;
const PROGRESS_LINE_HEIGHT = 18;
const TEXT_ICON_GAP = 4;

export default function LockHealthRect_0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  const medalImage = data.image_health?.source;
  /**
   * yml 的 required_files 里还有一张 465x186 的 image_static_rectangle 当卡片底图。
   * 配置里没配这个字段时就只有纯色底，配了就铺在最底层。
   */
  const backgroundImage = data.image_static_rectangle?.source;

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
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: CARD_PADDING,
        color: focusColor,
        pointerEvents: 'none',
      }}
    >
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          fontSize: TITLE_FONT_SIZE,
          lineHeight: `${TITLE_LINE_HEIGHT}px`,
          whiteSpace: 'nowrap',
        }}
      >
        {PREVIEW_TITLE}
      </div>
      <div
        style={{
          position: 'relative',
          fontSize: PROGRESS_FONT_SIZE,
          lineHeight: `${PROGRESS_LINE_HEIGHT}px`,
          whiteSpace: 'nowrap',
        }}
      >
        {PREVIEW_PROGRESS}
      </div>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: ICON_GAP,
          marginTop: TEXT_ICON_GAP,
        }}
      >
        {Array.from({ length: ICON_COUNT }, (_, index) => (
          <div
            // 勋章没有各自的配置字段，是同一张图重复 ICON_COUNT 次，用下标当 key
            key={index}
            style={{
              ...(medalImage
                ? getLockMaskStyle(medalImage, focusColor)
                : undefined),
              width: ICON_WIDTH,
              height: ICON_HEIGHT,
              opacity:
                index < PREVIEW_ACTIVE_COUNT ? 1 : INACTIVE_ICON_OPACITY,
              // 尺寸写死，被 flex 压缩勋章就会变形
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
