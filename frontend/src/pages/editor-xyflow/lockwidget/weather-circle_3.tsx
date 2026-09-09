import { LOCK_ASSET_SCALE, LOCK_WEATHER_ICON_KEYS } from './base-config';
import { getLockMaskStyle, getLockTextStyle } from './util';
import './style.css';

/**
 * 锁屏天气组件（type 1004 / weatherType 3 / 圆形）。
 */

const ICON_SIZE = 60 / LOCK_ASSET_SCALE;
const CONTENT_GAP = 8;

const PREVIEW_TEMP = '36°F';

export default function LockWeatherCircle_3(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
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
        gap: CONTENT_GAP,
        color: focusColor,
        pointerEvents: 'none',
      }}
    >
      <svg viewBox="0 0 1147 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="20725" width={ICON_SIZE} height={ICON_SIZE}><path d="M23.637333 728.021333h1100.8v106.282667H23.637333z m217.984 189.696h660.181334V1024H241.621333z m471.637334-445.696l-138.538667-149.333333-52.352 56.490667-85.333333 91.690666 52.352 56.362667 49.066666-52.821333v179.754666h74.026667v-177.706666l48.213333 51.925333z" p-id="20726" fill={focusColor}></path><path d="M988.288 667.605333l-88.874667-7.082666c0.597333-8.533333 0.896-17.066667 0.896-25.898667a327.125333 327.125333 0 1 0-652.8 0c0 8.832 0.298667 17.066667 0.896 25.941333l-88.874666 7.04c-0.768-10.965333-1.109333-21.76-1.109334-32.938666 0-246.314667 185.984-445.952 415.402667-445.952S989.44 388.266667 989.44 634.624c0 11.221333-0.384 22.016-1.152 32.981333z m35.968-3.541333v-95.658667h123.733333v95.658667z m-100.394667-355.797333L860.842667 240.64l87.509333-93.866667 63.018667 67.626667z m-305.322666-175.402667h-89.088V0h89.088zM287.146667 240.64L224.128 308.266667l-87.509333-93.866667L199.637333 146.773333z m-163.370667 327.765333v95.658667h-123.733333v-95.658667z" p-id="20727" fill={focusColor}></path></svg>
      <div style={getLockTextStyle(data.bottomInfo)}>06:20am</div>
    </div>
  );
}
