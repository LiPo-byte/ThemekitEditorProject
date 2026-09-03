import { LOCK_ASSET_SCALE, LOCK_CARD_RADIUS } from './base-config';
import { getLockMaskStyle, getLockTextJustify, getLockTextStyle } from './util';
import './style.css';

/**
 * 锁屏日历组件（type 1002）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_calendar_size_1.yml：
 * 左侧文案列（title / date / weekday），右侧 186x186 的方形图区，
 * calendar 文字叠在图上，按它自己的 textAlignment 对齐。
 */

const IMAGE_AREA_SIZE = 186 / LOCK_ASSET_SCALE;
/**
 * 内边距和行间距是手调的，没有跟着 LOCK_ASSET_SCALE 换算：
 * 配置里的 textSize 本身就是 @1x 点、不随素材比例缩放。
 */
const CARD_PADDING = 10;
const TEXT_LINE_GAP = 2;

export default function LockCalendarRect_0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const calendarImage = data.image_calendar_rectangle?.source;
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
        borderRadius: LOCK_CARD_RADIUS,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: CARD_PADDING,
        paddingRight: 0,
        color: focusColor,
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
        <div style={getLockTextStyle(data.title)}>Calendar</div>
        <div style={getLockTextStyle(data.date)}>June 23</div>
        <div style={getLockTextStyle(data.weekday)}>Thursday</div>
      </div>
      <div
        style={{
          width: IMAGE_AREA_SIZE,
          height: IMAGE_AREA_SIZE,
          position: 'relative',
          // 高度写死，宽度再被 flex 压缩图形就会变形
          flexShrink: 0,
        }}
      >
        {calendarImage && (
          <div
            style={{
              ...getLockMaskStyle(calendarImage, focusColor),
              position: 'absolute',
              inset: 0,
            }}
          />
        )}
        <div
          style={{
            ...getLockTextStyle(data.calendar),
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: getLockTextJustify(data.calendar?.textAlignment),
            pointerEvents: 'none',
            marginTop: 15,
          }}
        >
          23
        </div>
      </div>
    </div>
  );
}
