import { LOCK_ASSET_SCALE, LOCK_WEATHER_ICON_KEYS } from './base-config';
import { getLockTextStyle } from './util';
import './style.css';

/**
 * 锁屏天气组件（type 1004 / weatherType 4 / 圆形）。
 */

// const ICON_SIZE = 60 / LOCK_ASSET_SCALE;
const CONTENT_GAP = 2;
// const MOON_SIZE = 108 / LOCK_ASSET_SCALE;
// const DISC_SIZE = 108 / LOCK_ASSET_SCALE;
const MOON_SIZE = 52;
const DISC_SIZE = 52;

// const PREVIEW_TEMP = '36°F';
function getMoonPath(size: number, illumination: number) {
  const r = size / 2;
  const rx = r * Math.abs(1 - 2 * illumination);
  const sweep = illumination < 0.5 ? 0 : 1;
  return `M ${r},0 A ${r},${r} 0 0,1 ${r},${size} A ${rx},${r} 0 0,${sweep} ${r},0 Z`;
}

export default function LockWeatherCircle_4(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  const containerColor = data.containerColor ?? '#ffffff66';
  
  return (
    <div
      className={`lock_size_${data?.size ?? 1001}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor,
        overflow: 'hidden',
        borderRadius: '8px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: focusColor,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: DISC_SIZE,
          height: DISC_SIZE,
          borderRadius: '50%',
          backgroundColor: containerColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // 圆盘是正圆，被 flex 压缩会挤成椭圆
          flexShrink: 0,
        }}
      >
        <svg
          viewBox={`0 0 ${MOON_SIZE} ${MOON_SIZE}`}
          width={MOON_SIZE}
          height={MOON_SIZE}
          fill={focusColor}
        >
          <path d={getMoonPath(MOON_SIZE, 0.15)} />
        </svg>

      </div>
    </div>
  );
}
