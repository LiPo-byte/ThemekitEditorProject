import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
  // useEditorGetParentNodeData,
} from '../context';
import CropEditableImage from '../components/CropEditableImage';
// import { resolveWidgetFontFamily } from './util';
import './style.css';
import clockHourHand from '../../../assets/clock-pointers/custom/时针.png';
import clockMinuteHand from '../../../assets/clock-pointers/custom/分针.png';
import clockCenter from '../../../assets/clock-pointers/custom/圆心.png';


export default function ClockLayout1(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  if (!data) return null;
  const renderClock = (<div style={{
    height: '100%',
    aspectRatio: '1 / 1',
    position: 'relative',
  }}>
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
    <img
      src={clockCenter}
      style={{
        position: 'absolute',
        inset: 0,
        height: '100%',
        width: '100%',
        zIndex: 4,
        objectFit: 'contain',
      }}
    />
  </div>)
  return (
    <div className={`size_${data?.size}`} style={{
      transform: `scale(${scale}, ${scale})`,
      transformOrigin: '0 0',
      position: 'relative',
      overflow: isCropEditingNode ? 'visible' : 'hidden',
      borderRadius: `${data.radius ?? 0}px`,
      boxSizing: 'border-box',
      backgroundColor: '#ffffff',
      // padding: size === 3 ? '28px 20px' : (data?.clock?.clockPadding || '15px'),
    }}>
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {renderClock}
      </div>
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
    </div>
  );
}