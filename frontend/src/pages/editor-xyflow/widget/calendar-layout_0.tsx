import './style.css';
import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import { resolveWidgetFontFamily } from './util';

const WEEK_LABELS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAME = 'October';

export default function CalendarLayout_0(props: any) {
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  const data = props.data;
  const scale = props.scale || 1;
  const size = Number(data?.size ?? 1) as 1 | 2 | 3;
  const daySize: any = { 1: 17, 2: 23, 3: 31, 4: 17 };
  const paddingSize: any = { 1: 18, 2: 54, 3: 20 };
  const gapSize:any = {1: '0', 2: '0 10px', 3: '0 12px', 4: 0}
  if (!data) return null;
  const date = data.date;
  // 28天
  const days:any = [];
  for (let index = -1; index <= 28; index++) {
    days.push(index);
  }

  const calendarTable = (size: number) => {
    return <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      position: 'relative',
      zIndex: 2,
    }}
  >
    <div style={{
      width: '100%',
      fontSize: data?.month?.textSize,
      color: data?.month?.textColor,
      textAlign: (data?.month?.textAlignment === 1 ? 'left' : (data?.month?.textAlignment === 2) ? 'center' : 'right'),
      fontFamily: resolveWidgetFontFamily(props.parentId, data?.month?.font),
    }} >{MONTH_NAME}</div>
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: gapSize[size],
      }}
    >
    {data.calendar.textColor_capital_day ? WEEK_LABELS_SHORT.map((i, index) => {
        return <div
          key={index}
          style={{
            width: daySize[size],
            height: daySize[size],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: data.calendar.textSize,
            fontFamily: resolveWidgetFontFamily(props.parentId, data.calendar.font),
          }}>{i}</div>
        }) : null}
    </div>
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: gapSize[size],
      }}
    >
      {days.map((i: number) => {
        const color = i === 17 ? data.calendar.textColor_now : (
          i < 17 ? data.calendar.textColor_past : data.calendar.textColor_future
        )
        return <div
            key={i}
            style={{
              width: daySize[size],
              height: daySize[size],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: data.calendar.textSize,
              fontFamily: resolveWidgetFontFamily(props.parentId, data.calendar.font),
              backgroundColor: i === 17 ? data.calendar.bgColor_now : 'none',
              borderRadius: i === 17 ? '100%' : '0',
              color: color,
            }}>
              {i <= 0 ? '' : i}
            </div>
      })}
    </div>
  </div>
  }

  return (
    <div
      className={`size_${size}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor: '#ffffff',
        overflow: isCropEditingNode ? 'visible' : 'hidden',
        borderRadius: `${data.radius ?? 0}px`,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        padding: `0 ${date && size === 2 ? 34 : paddingSize[size]}px`,
      }}
    >
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      { date && size === 2 ? (
        <div style={{
          display: 'flex',
          height: '100%',
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{
            width: '50%',
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            justifyContent: 'center',
            fontSize: data?.date?.textSize,
            color: data?.date?.textColor,
            fontFamily: resolveWidgetFontFamily(props.parentId, data?.date?.font),
            lineHeight: 1,
          }}>
            <div style={{ width: '100%', textAlign: (data?.date?.textAlignment === 1 ? 'left' : (data?.date?.textAlignment === 2) ? 'center' : 'right')}} >Thu</div>
            <div style={{ width: '100%', textAlign: (data?.date?.textAlignment === 1 ? 'left' : (data?.date?.textAlignment === 2) ? 'center' : 'right')}} >17</div>
          </div>
          {calendarTable(4)}
        </div>
      ) : (
        <>
          {calendarTable(size)}
        </>
      ) }
    </div>
  );
}
