import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
  useEditorGetParentNodeData,
} from '../context';
import CropEditableImage from '../components/CropEditableImage';
import { resolveWidgetFontFamily } from './util';
import './style.css';

const baseContainerStyle = {
  position: 'relative',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
  padding: '10px 14px',
};
const getContainerStyle: any = (radius: number | undefined, overflow: 'visible' | 'hidden') => ({
  ...baseContainerStyle,
  overflow,
  borderRadius: `${radius ?? 0}px`,
});
const getTextStyle = (parentId?: string, textData?: any) => ({
  fontSize: textData?.textSize ?? 14,
  fontFamily: resolveWidgetFontFamily(parentId, textData?.font),
  opacity: textData?.alpha ?? 1,
  color: textData?.textColor ?? '#111827',
  lineHeight: 1,
  // height: textData?.textHeight ? `${textData.textHeight}px` : 'auto',
  whiteSpace: 'nowrap' as const,
});
export default function WeatherLayout1(props: any) {
  const data = props.data;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const getParentNodeData = useEditorGetParentNodeData();
  const parentData = getParentNodeData(props.id) || {};
  const iconSource = parentData?.imageCloud?.source;
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  if (!data) return null;
  const size = data.size;

  const dayDiv = (iconsource: string, day: string, wmain: string, wsub: string, ) => {
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      ...getTextStyle(props.parentId, data.weatherSub)
    }}>
      { day && <div style={{ marginBottom: 2 }}>{day}</div> }
      { iconsource ? <img  style={{ width: 20, marginBottom: 2 }} src={iconsource} /> : <div style={{ width: 20, height: 20, marginBottom: 2 }}></div> }
      { wmain && <div style={{ marginBottom: 4 }}>{wmain}</div> }
      { wsub && <div>{wsub}</div> }
    </div>
  }
  const days:any = {1: ['Thur', 'Sat'], 2: ['Thur', 'Fri', 'Sat', 'Mon', 'Tues', 'Wed'], 3: ['Thur', 'Fri', 'Sat', 'Mon', 'Tues', 'Wed']}
  return (
    <div
      className={`size_${data?.size}`}
      style={{
        ...getContainerStyle(data.radius, isCropEditingNode ? 'visible' : 'hidden'),
        padding: size === 3 ? '70px 12px' : '10px 12px',
      }}
    >
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', justifyContent: 'space-between' }}>
        {days[size].map((day: any, index: number) => {
          return (
            <div key={day} style={{
              display: 'flex',
              flexDirection: 'column-reverse',
              justifyContent: 'space-between'
            }}>
              {dayDiv(iconSource, day, '14°', '23°', )}
              {index === 0 && dayDiv(iconSource, '', '14°', '', )}
            </div>
          )
        })}
      </div>
      <div style={{
        position: 'absolute',
        zIndex: 2,
        top: size === 3 ? 70 : 10,
        right: 12,
      }}>
        <div style={{
          ...getTextStyle(props.parentId, data.weatherWeekday)
        }}>
          { size === 1 ? 'Thur' : 'Thursday' }
        </div>
        <div style={{
          ...getTextStyle(props.parentId, data.weatherDate)
        }}>
          { size === 1 ? 'Dec1' : 'December' }
        </div>
      </div>
    </div>
  );
}