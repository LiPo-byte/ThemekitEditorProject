import { LOCK_ASSET_SCALE, LOCK_WIDGET_SIZE } from './base-config';
import { getLockMaskStyle } from './util';
import './style.css';

/**
 * 锁屏健康组件（type 1009 / layoutType 1 / 圆形）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_health_layout_1_size_0.yml 和设计稿：
 * 一圈进度环，环内上面一枚鞋子图标、下面步数。
 *
 * 这个组件的 yml 里没有任何文字字段（item_fields 只有 size / name / layoutType），
 * 步数的字体字号由客户端自己定，所以下面的字号只是画布预览用的估值，不是能下发的配置。
 */

/** 圆形画布 62x62，取自 base-config 而不是写死，和 .lock_size_1001 保持同一个来源 */
const CIRCLE_SIZE = LOCK_WIDGET_SIZE.circle.width;
const CIRCLE_CENTER = CIRCLE_SIZE / 2;

/**
 * 进度环尺寸照设计稿的 186x186 图量出来再 ÷ LOCK_ASSET_SCALE：
 * 外径 168px、环厚 13px，也就是四周留 3 点。
 * 描边是压在路径上居中画的，所以路径半径要用外半径再减半个环厚。
 */
const RING_OUTER_DIAMETER = 168 / LOCK_ASSET_SCALE;
const RING_THICKNESS = 13 / LOCK_ASSET_SCALE;
const RING_RADIUS = (RING_OUTER_DIAMETER - RING_THICKNESS) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
/**
 * 未达成那段环的透明度。设计稿里底轨和进度弧是同一个颜色的两档深浅，
 * 按 alpha 合成公式逐通道反解出约 0.44，和 layoutType 0 的勋章（0.43）是同一套约定，
 * 所以取同一个 0.4。
 */
const RING_TRACK_OPACITY = 0.4;

/** 图标位 = yml 里 image_health 的像素尺寸 ÷ LOCK_ASSET_SCALE，60x60 正好 20x20 点 */
const ICON_SIZE = 60 / LOCK_ASSET_SCALE;

/**
 * 图标与步数的间距、以及步数字号，都是照设计稿按 ÷3 量出来再手调的：
 * 图标墨迹 12.0~33.0、步数墨迹 36.7~44.7，字号按数字 cap 约 0.72em 反推得 12。
 */
const CONTENT_GAP = 2;
const STEPS_FONT_SIZE = 10;
const STEPS_LINE_HEIGHT = 13;

/**
 * 画布上的示例进度与步数，仅用于预览，不进配置。
 *
 * 取 0.75 而不是照设计稿量到的 279°：进度弧两端是圆角端帽，
 * 端帽会在路径两头各多描出半个环厚，换成角度是 (RING_THICKNESS / 2) / RING_RADIUS
 * 约 4.8°，两头共 9.6°。扣掉之后路径本身正好是 270°、也就是整 75%，
 * 实测的 -4.5°~274.5° 也正好对上这个推算。
 */
const PREVIEW_PROGRESS = 0.75;
const PREVIEW_STEPS = '20000';

export default function LockHealthCircle_1(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  const shoeImage = data.image_health?.source;
  /**
   * yml 的 required_files 里还有一张 186x186 的 image_static_circular 当底图。
   * 配置里没配这个字段时就只有纯色底，配了就铺在最底层。
   */
  const backgroundImage = data.image_static_circular?.source;

  return (
    <div
      className={`lock_size_${data?.size ?? 1001}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor,
        overflow: 'hidden',
        borderRadius: '8px',
        // borderRadius: '50%',
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: CONTENT_GAP,
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
      {/*
        进度环用 SVG 描边画，而不是 conic-gradient 加遮罩：
        描边的半径和粗细能直接对上量出来的值，而且导出走 html-to-image 时
        内联 SVG 比 conic-gradient + mask 的组合稳。
      */}
      <svg
        width={CIRCLE_SIZE}
        height={CIRCLE_SIZE}
        viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        <circle
          cx={CIRCLE_CENTER}
          cy={CIRCLE_CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke={focusColor}
          strokeOpacity={RING_TRACK_OPACITY}
          strokeWidth={RING_THICKNESS}
        />
        {/* 旋转 -90° 把起点从 3 点挪到 12 点，dasharray 只画出进度那一段 */}
        <circle
          cx={CIRCLE_CENTER}
          cy={CIRCLE_CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke={focusColor}
          strokeWidth={RING_THICKNESS}
          strokeLinecap="round"
          strokeDasharray={`${RING_CIRCUMFERENCE * PREVIEW_PROGRESS} ${RING_CIRCUMFERENCE}`}
          transform={`rotate(-90 ${CIRCLE_CENTER} ${CIRCLE_CENTER})`}
        />
      </svg>
      <div
        style={{
          ...(shoeImage ? getLockMaskStyle(shoeImage, focusColor) : undefined),
          position: 'relative',
          width: ICON_SIZE,
          height: ICON_SIZE,
          // 尺寸写死，被 flex 压缩图标就会变形
          flexShrink: 0,
        }}
      />
      <div
        style={{
          position: 'relative',
          fontSize: STEPS_FONT_SIZE,
          lineHeight: `${STEPS_LINE_HEIGHT}px`,
          whiteSpace: 'nowrap',
        }}
      >
        {PREVIEW_STEPS}
      </div>
    </div>
  );
}
