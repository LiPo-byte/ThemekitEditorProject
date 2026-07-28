import './style.css';
import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import { resolveWidgetFontFamily } from './util';

const getTextStyle = (parentId?: string, textData?: any) => ({
  fontSize: textData?.textSize ?? 14,
  fontFamily: resolveWidgetFontFamily(parentId, textData?.font),
  opacity: textData?.alpha ?? 1,
  color: textData?.textColor ?? '#111827',
  lineHeight: 1,
  height: textData?.textHeight ? `${textData.textHeight}px` : 'auto',
  whiteSpace: 'nowrap' as const,
});

export default function CountdownLayout_0(props: any) {
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  const data = props.data;
  const scale = props.scale || 1;
  const size = Number(data?.size ?? 1) as 1 | 2 | 3;
  if (!data) return null;

  const dayValue = '365';
  const hourValue = '23';
  const minuteValue = '59';
  const titleText = data?.title?.content ?? '';
  const festivalName = data?.festivalName ?? '';

  // const numberStyle = getTextStyle(data?.remainDays ?? data?.day);
  const dayStyle = getTextStyle(props.parentId, data?.remainDays);
  // const hourStyle = getTextStyle(data?.remainDays);
  // const minuteStyle = getTextStyle(data?.remainDays);
  const daysStyle = getTextStyle(props.parentId, data?.days);
  const titleStyle = getTextStyle(props.parentId, data?.title);

  const renderBlock = (value: string, label: string, valueStyle: Record<string, any>, daysStyle: Record<string, any>) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 72,
      }}
    >
      <div style={{ ...valueStyle, marginBottom: 6 }}>{value}</div>
      <div style={daysStyle}>{label}</div>
    </div>
  );

  return (
    <div
      className={`size_${size}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        position: 'relative',
        overflow: isCropEditingNode ? 'visible' : 'hidden',
        borderRadius: `${data.radius ?? 0}px`,
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        paddingTop: size === 3 ? 60 : 0,
      }}
    >
      {size === 1 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            padding: '16px 0'
          }}
        >
          <div style={titleStyle}>Days Left</div>
          <div style={dayStyle}>{dayValue}</div>
          <div style={titleStyle}>{festivalName}</div>
        </div>
      ) : null}

      {size === 2 ? (
        <div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 42,
              // transform: 'translateY(-50%)',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 27,
            }}
          >
            {renderBlock(dayValue, 'Days', dayStyle, daysStyle)}
            {renderBlock(hourValue, 'Hrs', dayStyle, daysStyle)}
            {renderBlock(minuteValue, 'Min', dayStyle, daysStyle)}
          </div>
          <div style={{
            ...titleStyle,
            position: 'absolute',
            zIndex: 2,
            left: 0,
            right: 0,
            bottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>{festivalName}</div>
        </div>
      ) : null}

      {size === 3 ? (
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          >{renderBlock(dayValue, 'Days', dayStyle, daysStyle)}</div>
          <div style={{
            marginTop: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 50,
          }}>
            {renderBlock(hourValue, 'Hrs', dayStyle, daysStyle)}
            {renderBlock(minuteValue, 'Min', dayStyle, daysStyle)}
          </div>
          <div style={{
            ...titleStyle,
            marginTop: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>{festivalName}</div>
        </div>
      ) : null}

      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
    </div>
  );
}
