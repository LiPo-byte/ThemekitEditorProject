import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
  useEditorGetParentNodeData,
} from '../context';
import CropEditableImage from '../components/CropEditableImage';
import { resolveWidgetFontFamily } from './util';
import './style.css';
import clockDial from '../../../assets/clock-pointers/default/表盘.png';
import clockHourHand from '../../../assets/clock-pointers/default/时针.png';
import clockMinuteHand from '../../../assets/clock-pointers/default/分针.png';


const getTextStyle = (parentId?: string, textData?: any) => ({
  fontSize: textData?.textSize ?? 14,
  fontFamily: resolveWidgetFontFamily(parentId, textData?.font),
  opacity: textData?.alpha ?? 1,
  color: textData?.textColor ?? '#111827',
  lineHeight: 1,
  height: textData?.textHeight ? `${textData.textHeight}px` : 'auto',
  whiteSpace: 'nowrap' as const,
});
export default function ClockLayout0(props: any) {
  const data = props.data;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  // const getParentNodeData = useEditorGetParentNodeData();
  // const { text } = getParentNodeData(props.id) || {};
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  if (!data) return null;
  const size = data.size;

  const renderClock = (<div style={{
    height: '100%',
    aspectRatio: '1 / 1',
    position: 'relative',
  }}>
    <img
      src={clockDial}
      style={{ position: 'absolute', inset: 0, height: '100%', width: '100%', objectFit: 'contain' }}
    />
    <img
      src={clockHourHand}
      style={{
        position: 'absolute',
        inset: 0,
        height: '100%',
        width: '100%',
        zIndex: 2,
        transform: 'rotate(30deg)',
        transformOrigin: 'center',
        objectFit: 'contain',
      }}
    />
    <img
      src={clockMinuteHand}
      style={{
        position: 'absolute',
        inset: 0,
        height: '100%',
        width: '100%',
        zIndex: 3,
        objectFit: 'contain',
      }}
    />
  </div>)
  return (
    <div className={`size_${data?.size}`} style={{
      position: 'relative',
      overflow: isCropEditingNode ? 'visible' : 'hidden',
      borderRadius: `${data.radius ?? 0}px`,
      boxSizing: 'border-box',
      backgroundColor: '#ffffff',
      padding: size === 3 ? '28px 20px' : (data?.clock?.clockPadding || '15px'),
    }}>

      { size === 2 ? (
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            height: '100%',
            alignItems: 'center',
          }}>
            <div style={{
              flex: '0 0 auto',
              height: '100%',
              marginRight: data.clock.textPadding
            }}>
              {renderClock}
            </div>
            <div style={{
              flex: '1 1 auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: data.textAlignment == 1 ? 'left' : (data.textAlignment ==  2 ? 'center' : 'right'),
            }}>
              <span style={{
                ...getTextStyle(props.parentId, data.day)
              }}>Wednesday</span>
              <div style={{
                ...getTextStyle(props.parentId, data.date)
              }} >March 23</div>
            </div>
          </div>
      ) : (
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          height: '100%',
        }}>
          {renderClock}
        </div>
      ) }

      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
    </div>
  );
}