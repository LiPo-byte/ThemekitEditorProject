import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';

import './style.css';

export default function PureimageLayout_0(props: any) {
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const data = props.data;
  const scale = props.scale || 1;
  console.log()

  if (!data) return null;

  return (
    <div
      className={`size_${data?.size ?? 1}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor: '#ffffff',
        overflow: isCropEditingNode ? 'visible' : 'hidden',
        borderRadius: `${data.radius ?? 0}px`,
        position: 'relative',
      }}
    >
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
    </div>
  );
}
