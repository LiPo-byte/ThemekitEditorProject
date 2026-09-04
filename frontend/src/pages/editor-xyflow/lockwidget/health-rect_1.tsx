import { LOCK_ASSET_SCALE, LOCK_CARD_RADIUS } from './base-config';
import { getLockMaskStyle } from './util';
import './style.css';

/**
 * 锁屏健康组件（type 1009 / layoutType 1 / 矩形）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_health_layout_1_size_1.yml 和设计稿：
 * 左边一枚跑步图标，右边两行——上面步数大字、下面"Steps Today"小字。
 *
 * 和 layoutType 0 的差别：0 是三行文案加一排勋章，1 是左图右两行；
 * 两者的 image_health 尺寸也不同（0 是 24x48 的勋章，1 是 78x72 的跑步图）。
 *
 * 这个组件的 yml 里没有任何文字字段（item_fields 只有 size / name / layoutType，
 * 资源包的 widgets_spec.json 也只有这三个），两行文案的字体字号由客户端自己定，
 * 所以下面的字号只是画布预览用的估值，不是能下发的配置。
 */

/** 图标位 = yml 里 image_health 的像素尺寸 ÷ LOCK_ASSET_SCALE，78x72 正好 26x24 点 */
const ICON_WIDTH = 78 / LOCK_ASSET_SCALE;
const ICON_HEIGHT = 72 / LOCK_ASSET_SCALE;

/**
 * 内边距和间距照设计稿的 465x186 图按 ÷3 量出来的：
 * 图标左边界 20、图标与文字间隙 10.7，两行文字左边界都在 57.0，
 * 20 + 26 + 11 正好等于 57，所以这三个值是自洽的、不用再手调。
 */
const CARD_PADDING_LEFT = 20;
const ICON_TEXT_GAP = 11;
/**
 * 字号按设计稿墨迹高反推：步数墨迹 19 点（数字 cap 约 0.72em）得 26，
 * "Steps Today" 墨迹 16.7 点（含 p/y 降部，约 0.92em）得 18。
 * 行高取 20 / 19，两行合计 39 点，在 62 高的卡片里居中后
 * 落位算下来是 12.3~50，和实测的墨迹 11.3~49.3 对得上。
 */
const STEPS_FONT_SIZE = 26;
const STEPS_LINE_HEIGHT = 20;
const LABEL_FONT_SIZE = 16;
const LABEL_LINE_HEIGHT = 19;

/** 画布上的示例步数与文案，仅用于预览，不进配置 */
const PREVIEW_STEPS = '8686';
const PREVIEW_LABEL = 'Steps Today';

export default function LockHealthRect_1(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  const runnerImage = data.image_health?.source;
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
        // 设计稿里图标和文字块都是垂直居中的，交给 flex 对齐，不用各自算偏移
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: ICON_TEXT_GAP,
        paddingLeft: CARD_PADDING_LEFT,
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
          ...(runnerImage
            ? getLockMaskStyle(runnerImage, focusColor)
            : undefined),
          position: 'relative',
          width: ICON_WIDTH,
          height: ICON_HEIGHT,
          // 尺寸写死，被 flex 压缩跑步图就会变形
          flexShrink: 0,
        }}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          // 文案再长也不许把左边的图标挤走
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: STEPS_FONT_SIZE,
            lineHeight: `${STEPS_LINE_HEIGHT}px`,
            whiteSpace: 'nowrap',
          }}
        >
          {PREVIEW_STEPS}
        </div>
        <div
          style={{
            fontSize: LABEL_FONT_SIZE,
            lineHeight: `${LABEL_LINE_HEIGHT}px`,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {PREVIEW_LABEL}
        </div>
      </div>
    </div>
  );
}
