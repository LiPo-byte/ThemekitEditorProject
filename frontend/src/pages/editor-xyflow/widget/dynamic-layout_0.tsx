import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import CropEditableImage from '../components/CropEditableImage';
import './style.css';


export default function DynamicLayout0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  if (!data) return null;

  return (
    <div className={`size_${data?.size}`} style={{
      transform: `scale(${scale}, ${scale})`,
      transformOrigin: '0 0',
      position: 'relative',
      overflow: isCropEditingNode ? 'visible' : 'hidden',
      borderRadius: `${data.radius ?? 0}px`,
      boxSizing: 'border-box',
      backgroundColor: '#ffffff',
    }}>
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
    </div>
  );
}