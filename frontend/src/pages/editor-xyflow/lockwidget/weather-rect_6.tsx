import { LOCK_ASSET_SCALE, LOCK_CARD_RADIUS } from './base-config';
import './style.css';

/**
 * 锁屏天气组件（type 1004 / weatherType 6 / 矩形）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_weather_6_size_1.yml：
 * 五个圆盘横排，盘内各画一个月相，正中间那个盘放大、画成食相。
 *
 * yaml 强制要求 topInfo / bottomInfo 两个文本字段，但这个排版实际不显示文字
 * （设计稿上五个盘垂直居中，没给文字留位置），所以配置里留着占位、画布上不画。
 *
 * 和 weatherType 5 一样，required_files 里没有任何图片，月相不是上传的素材，
 * 由客户端自己画。下面用 SVG 画，跟着 focusColor 着色，只作画布预览。
 */

/**
 * 圆盘底色，spec 没有这个字段，是编辑器额外加的（yaml allow_extra_fields: true）。
 * 默认给半透明白：设计稿里这圈盘比卡片底色浅，是个淡光晕；
 * 用半透明黑的话叠在卡片上只会更暗，看着像月亮两边有阴影。
 */
const DEFAULT_CONTAINER_COLOR = '#FFFFFF33';

/**
 * 下面这些像素值都是从设计稿那张 465x186 的图上量出来的，
 * ÷ LOCK_ASSET_SCALE 换成画布的 @1x 点。
 */
const DISC_SIZE = 74 / LOCK_ASSET_SCALE;
const ECLIPSE_DISC_SIZE = 96 / LOCK_ASSET_SCALE;
const MOON_SIZE = 71 / LOCK_ASSET_SCALE;
const ECLIPSE_WIDTH = 96 / LOCK_ASSET_SCALE;
const ECLIPSE_HEIGHT = 96 / LOCK_ASSET_SCALE;
/** 首尾两个盘到卡片边的留白，比盘之间的缝大得多，所以不能用 space-evenly */
const CARD_PADDING = 23 / LOCK_ASSET_SCALE;

/**
 * 月相轮廓：右半边是固定的圆弧（受光的一侧），左半边是明暗界线。
 * 界线画成一段椭圆弧，横向半径 = r × |1 - 2 × 受光比例|——
 * 不足半轮时朝右鼓成月牙，正好半轮时收成直线，过了半轮朝左鼓成凸月。
 *
 * 界线那段弧是从底点走回顶点，sweep=1 走左边、sweep=0 走右边：
 * 满月要走左半圆才能合成整圆，月牙要朝右鼓才是细牙，所以过半轮取 1、不足取 0。
 * 写反的话满月会沿右边缘原路折回，面积为零，盘里什么都画不出来。
 */
function getMoonPath(size: number, illumination: number) {
  const r = size / 2;
  const rx = r * Math.abs(1 - 2 * illumination);
  const sweep = illumination < 0.5 ? 0 : 1;
  return `M ${r},0 A ${r},${r} 0 0,1 ${r},${size} A ${rx},${r} 0 0,${sweep} ${r},0 Z`;
}

/**
 * 食相：两段圆弧对扣成的透镜形，比月相窄、比月相高，上下带尖角。
 * 弧半径由目标宽高反推：R = (h² + w²/4) / w，h 取半高、w 取全宽。
 */
function getEclipsePath(width: number, height: number) {
  const h = height / 2;
  const r = (h * h + (width * width) / 4) / width;
  const cx = width / 2;
  return `M ${cx},0 A ${r},${r} 0 0,1 ${cx},${height} A ${r},${r} 0 0,1 ${cx},0 Z`;
}

/**
 * 画布上的示例月相，仅用于预览，不进配置。
 * 受光比例是拿设计稿上每个月相在中心行的白色宽度反推的，不是随手填的。
 */
const PREVIEW_PHASES = [
  { id: 'waxing-crescent', label: 'waxing crescent', illumination: 0.18 },
  { id: 'first-quarter', label: 'first quarter', illumination: 0.5 },
  { id: 'eclipse', label: 'eclipse', eclipse: true },
  { id: 'full-moon', label: 'full moon', illumination: 1 },
  { id: 'waning-gibbous', label: 'waning gibbous', illumination: 0.76 },
];

export default function LockWeatherRect_6(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  const containerColor = data.containerColor ?? DEFAULT_CONTAINER_COLOR;

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
        padding: `0 ${CARD_PADDING}px`,
        color: focusColor,
        pointerEvents: 'none',
      }}
    >
      {PREVIEW_PHASES.map((phase) => {
        const discSize = phase.eclipse ? ECLIPSE_DISC_SIZE : DISC_SIZE;
        return (
          <div
            key={phase.id}
            style={{
              width: discSize,
              height: discSize,
              borderRadius: '50%',
              backgroundColor: containerColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // 圆盘是正圆，被 flex 压缩会挤成椭圆
              flexShrink: 0,
            }}
          >
            {phase.eclipse ? (
              <svg
                viewBox={`0 0 ${ECLIPSE_WIDTH} ${ECLIPSE_HEIGHT}`}
                width={ECLIPSE_WIDTH}
                height={ECLIPSE_HEIGHT}
                fill={focusColor}
              >
                <title>{phase.label}</title>
                <path d={getMoonPath(ECLIPSE_WIDTH, 0.78)} />
              </svg>
            ) : (
              <svg
                viewBox={`0 0 ${MOON_SIZE} ${MOON_SIZE}`}
                width={MOON_SIZE}
                height={MOON_SIZE}
                fill={focusColor}
              >
                <title>{phase.label}</title>
                <path d={getMoonPath(MOON_SIZE, phase.illumination ?? 1)} />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
