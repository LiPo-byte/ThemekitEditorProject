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
  const size = Number(data?.size ?? 1) as 1 | 2 | 3;
  const daySize = { 1: 17, 2: 23, 3: 31 };
  const paddingSize = { 1: 18, 2: 54, 3: 20 };
  const gapSize = {1: '0', 2: '0 10px', 3: '0 12px'};
  const monthTop = { 1: 35, 2: 23, 3: 100 };
  const weekMarginBottom = { 1: 0, 2: 0, 3: 31 };
  if (!data) return null;
  // 28天
  const days = [];
  for (let index = -1; index <= 28; index++) {
    days.push(index);
  }

  return (
    <div
      className={`size_${size}`}
      style={{
        backgroundColor: '#ffffff',
        overflow: isCropEditingNode ? 'visible' : 'hidden',
        borderRadius: `${data.radius ?? 0}px`,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        padding: `0 ${paddingSize[size]}px`,
      }}
    >
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      <div
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
          position: 'absolute',
          top: monthTop[size],
          fontSize: data.month.textSize,
          color: data.month.textColor,
          left: paddingSize[size],
          right: paddingSize[size],
          textAlign: (data.month.textAlignment === 1 ? 'left' : (data.month.textAlignment === 2) ? 'center' : 'right'),
          fontFamily: resolveWidgetFontFamily(props.parentId, data.month.font),
          opacity: data.month.alpha,
        }} >{MONTH_NAME}</div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: gapSize[size],
            marginBottom: weekMarginBottom[size],
          }}
        >
        {WEEK_LABELS_SHORT.map((i, index) => {
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
            })}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: gapSize[size],
          }}
        >
          {days.map(i => {
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
    </div>
  );
}
