import { LOCK_CARD_RADIUS } from './base-config';
import { getLockTextStyle } from './util';
import './style.css';

/**
 * 锁屏天气组件（type 1004 / weatherType 5 / 矩形）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_weather_5_size_1.yml：
 * 左右两个圆盘，分别是日出和日落，盘内自上而下是太阳图标、时刻、AM/PM。
 * topInfo 管时刻那一行，bottomInfo 管 AM/PM 那一行。
 *
 * 这个规格的 required_files 里一张图片都没有，太阳图标不是设计师上传的素材，
 * 由客户端自己画。画布上留空会看不出是什么组件，所以下面用内联 SVG 画了个近似的，
 * 跟着 focusColor 着色。它只是画布预览，和客户端的实际图形不会像素级一致。
 */

/**
 * 圆盘直径取内容高度：时刻 25 + AM/PM 17 + 图标 14 = 56，卡片 62 上下各留 3。
 * 设计稿量出来的圆盘约 50，但配置里 textHeight 25+17 已经占掉 42，
 * 再放一个和设计稿等大的图标就超出 50 了，会顶出圆盘。要严格对齐设计稿
 * 得让设计把 textHeight 调小。
 */
const DISC_SIZE = 56;
const ICON_SIZE = 14;

/**
 * 图标线条的目标粗细（画布 px）。
 *
 * strokeWidth 用的是 viewBox 单位，不是 px：图标 1184 单位画在 14px 里，
 * 1px ≈ 85 单位，所以 strokeWidth={3} 这种值肉眼根本看不出变化。
 * 而且路径本身是填充出来的实心线条（约 51 单位 ≈ 0.6px），描边只用补差额。
 */
const ICON_STROKE_PX = 1.5;
const ICON_VIEW_WIDTH = 1184;
const ICON_VIEW_HEIGHT = 1024;
const ICON_FILLED_STROKE_UNITS = 51;
const ICON_STROKE_UNITS = Math.max(
  0,
  (ICON_STROKE_PX * ICON_VIEW_WIDTH) / ICON_SIZE - ICON_FILLED_STROKE_UNITS,
);
/** 描边往轮廓外扩半个宽度，viewBox 四周留出等量余量，否则贴边的水平线会被裁掉一半 */
const ICON_VIEW_MARGIN = ICON_STROKE_UNITS / 2;
const ICON_VIEW_BOX = [
  -ICON_VIEW_MARGIN,
  -ICON_VIEW_MARGIN,
  ICON_VIEW_WIDTH + ICON_STROKE_UNITS,
  ICON_VIEW_HEIGHT + ICON_STROKE_UNITS,
].join(' ');

/**
 * 圆盘底色 = 卡片底色掺 20% 白，同色系亮一档。
 *
 * 不能用「底色 + 透明度」：同色叠同色，无论 alpha 取多少合成结果都等于底色，
 * 底色不透明时圆盘会整个看不见。
 */
const DISC_WHITE_MIX = '20%';
const getDiscColor = (color: string) =>
  `color-mix(in srgb, #FFFFFF ${DISC_WHITE_MIX}, ${color})`;

/** 画布上的示例日出日落，仅用于预览，不进配置 */
const PREVIEW_SUN_TIMES = [
  { id: 'sunrise', time: '06:20', meridiem: 'AM' },
  { id: 'sunset', time: '08:20', meridiem: 'PM' },
];

/** 太阳跃出水面，日出日落共用一个图形（设计稿里两边也是同一个） */
function SunOverHorizonIcon({ color }: { color: string }) {
  return (
    <svg
      viewBox={ICON_VIEW_BOX}
      width={ICON_SIZE}
      height={ICON_SIZE}
      fill={color}
      stroke={color}
      strokeWidth={ICON_STROKE_UNITS}
      strokeLinecap="round"
      // 描边这么宽时，默认的 miter 连接会在拐角甩出尖刺
      strokeLinejoin="round"
    >
      <title>sun over horizon</title>
      <path
        d="M283.407059 614.339765c14.215529 0 25.780706-11.504941 25.780706-25.640157 0-155.226353 127.016157-281.6 283.286588-281.6s283.286588 126.253176 283.286588 281.6c0 14.135216 11.565176 25.640157 25.800784 25.640157 14.215529 0 25.780706-11.504941 25.780706-25.640157 0-183.516863-150.14651-332.759843-334.747607-332.759843-184.621176 0-335.008627 149.363451-335.008628 332.860235 0 14.155294 11.565176 25.539765 25.800784 25.539765z m308.946823-409.439373c14.235608 0 25.800784-11.504941 25.800785-25.640157V25.640157C618.154667 11.504941 606.58949 0 592.353882 0s-25.800784 11.504941-25.800784 25.640157v153.6c0 14.155294 11.565176 25.660235 25.800784 25.660235z m291.378196 119.908392c6.605804 0 13.191529-2.529882 18.170981-7.469176l109.206588-108.544a25.499608 25.499608 0 0 0 0-36.22149 25.881098 25.881098 0 0 0-36.442353 0l-109.206588 108.544a25.499608 25.499608 0 0 0 0 36.22149c5.099922 4.939294 11.685647 7.469176 18.271372 7.469176z m275.07451 238.351059h-154.403137c-14.255686 0-25.800784 11.504941-25.800784 25.640157 0 14.155294 11.565176 25.640157 25.780706 25.640157h154.543686c14.235608 0 25.800784-11.484863 25.800784-25.640157 0-14.135216-11.685647-25.640157-25.901176-25.640157z m-952.681412 25.640157c0-14.135216-11.565176-25.640157-25.800784-25.640157H25.901176c-14.235608 0-25.800784 11.504941-25.800784 25.640157 0 14.155294 11.565176 25.539765 25.800784 25.539765h154.543687c14.115137 0 25.680314-11.384471 25.680313-25.539765z m76.699608-271.460392a25.740549 25.740549 0 0 0 36.301804 0 25.499608 25.499608 0 0 0 0-36.22149l-109.18651-108.544a25.881098 25.881098 0 0 0-36.442353 0 25.499608 25.499608 0 0 0 0 36.22149l109.306981 108.544z m798.840471 450.600157H103.04251c-14.215529 0-25.780706 11.504941-25.780706 25.640157s11.565176 25.640157 25.780706 25.640156h978.622745c14.215529 0 25.800784-11.504941 25.800784-25.640156s-11.585255-25.640157-25.800784-25.640157z m-180.344471 204.779921H283.407059c-14.235608 0-25.800784 11.504941-25.800784 25.640157S269.151373 1024 283.407059 1024h618.054274c14.235608 0 25.800784-11.504941 25.800785-25.640157s-11.685647-25.640157-25.901177-25.640157z"
        fill={color}
        p-id="1734"
      ></path>
    </svg>
  );
}
export default function LockWeatherRect_5(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  const discColor = getDiscColor(backgroundColor);

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
        // 左右两盘和三段留白等宽，和设计稿的间距分布一致
        justifyContent: 'space-evenly',
        color: focusColor,
        pointerEvents: 'none',
      }}
    >
      {PREVIEW_SUN_TIMES.map((item) => (
        <div
          key={item.id}
          style={{
            width: DISC_SIZE,
            height: DISC_SIZE,
            borderRadius: '50%',
            backgroundColor: discColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            // 圆盘是正圆，被 flex 压缩会挤成椭圆
            flexShrink: 0,
          }}
        >
          <SunOverHorizonIcon color={focusColor} />
          <div style={getLockTextStyle(data.topInfo)}>{item.time}</div>
          <div style={getLockTextStyle(data.bottomInfo)}>{item.meridiem}</div>
        </div>
      ))}
    </div>
  );
}
