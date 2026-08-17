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
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
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
  whiteSpace: 'nowrap' as const,
});

const resolveAlignmentStyle = (alignment?: number) => {
  if (alignment === 2) {
    return { textAlign: 'center' as const, alignItems: 'center' as const };
  }
  if (alignment === 3) {
    return { textAlign: 'right' as const, alignItems: 'flex-end' as const };
  }
  return { textAlign: 'left' as const, alignItems: 'flex-start' as const };
};

export default function WeatherLayout2(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const getParentNodeData = useEditorGetParentNodeData();
  const parentData = getParentNodeData(props.id) ?? props.parentData ?? {};
  const iconSource = parentData?.imageCloud?.source;
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  if (!data) return null;
  const size = data.size;
  const alignmentStyle = resolveAlignmentStyle(data.textAlignment);

  const weekdayText = 'wednesday';
  const dateText = 'Jan 9';
  const mainText = '36°';
  const subText = 'Cloudy';
  const gap = size === 3 ? 12 : size === 2 ? 10 : 8;
  const paddingSize: any = { 1: 15, 2: 22, 3: 55 }

  const iconSourceSize: any = {
    1: { width: 22, height: 22 },
    2: { width: 20, height: 20 },
    3: { width: 21, height: 21 },
  }
  return (
    <div
      className={`size_${data?.size}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        ...getContainerStyle(data.radius, isCropEditingNode ? 'visible' : 'hidden'),
        gap,
        ...alignmentStyle,
        padding: `${paddingSize[size]}px 16px`
      }}
    >
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', justifyContent: 'space-between', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: size === 3 ? 16 : size === 2 ? 23 : 13, ...alignmentStyle }}>
          <div style={{
            ...getTextStyle(props.parentId, data.weatherSub),
            fontSize: size === 3 ? '21px' : '12px',
            display: 'flex',
            alignItems: 'center',
          }}>
            { iconSource ? <img src={iconSource} style={{ ...iconSourceSize[size], marginRight: '5px' }} /> : <div></div> }
            {subText}
          </div>
          <div style={{
            ...getTextStyle(props.parentId, data.weatherMain),
            fontSize: size === 3 ? '52px' : '28px',
          }}>
            {mainText}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: size === 3 ? 17 : size === 2 ? 9 : 11, ...alignmentStyle }}>
          <div style={getTextStyle(props.parentId, data.weatherWeekday)}>
            {weekdayText}
          </div>
          <div style={getTextStyle(props.parentId, data.weatherDate)}>
            {dateText}
          </div>
        </div>
      </div>
    </div>
  );
}
