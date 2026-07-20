import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';

const ICON_BASE_SIZE = 180;

export default function Icon(props: any) {
  
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const data = props.data;
  const scale = typeof props.scale === 'number' ? props.scale : 1;

  if (!data) return null;

  const size = ICON_BASE_SIZE;
  const numericSize = typeof size === 'number' ? size : null;
//   const scale = numericSize ? numericSize / ICON_BASE_SIZE : 1;
  const radius = typeof data.radius === 'number' ? data.radius : 0;

  return (
    <div
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        width: size,
        height: size,
        backgroundColor: '#ffffff',
        overflow: isCropEditingNode ? 'visible' : 'hidden',
        borderRadius: `${(radius / ICON_BASE_SIZE) * 100}%`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: numericSize ? `${20 * scale}px` : '11%',
        fontFamily: 'AvenirNext-HeavyItalic',
      }}
    >
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={numericSize ? radius * scale : radius}
        cropProps={data.crop_props}
      />
      <div>{ data.name }</div>
    </div>
  );
}
