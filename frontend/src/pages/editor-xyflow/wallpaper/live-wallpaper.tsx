// import CropEditableImage from '../components/CropEditableImage';
import {
    useEditorCropEditingNodeId,
    useEditorCropToolOpen,
  } from '../context';
  
  // const ICON_BASE_SIZE = 180;
  
  export default function LiveWallpaper(props: any) {
    const cropToolOpen = useEditorCropToolOpen();
    const cropEditingNodeId = useEditorCropEditingNodeId();
    const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
    const data = props.data;
    const scale = typeof props.scale === 'number' ? props.scale : 1;
  
    if (!data) return null;
  
    const width = Number(data.width) > 0 ? Number(data.width) : 887;
    const height = Number(data.height) > 0 ? Number(data.height) : 1920;
  
    return (
      <div
        style={{
          transform: `scale(${scale}, ${scale})`,
          transformOrigin: '0 0',
          width,
          height,
          backgroundColor: '#ffffff',
          overflow: isCropEditingNode ? 'visible' : 'hidden',
          position: 'relative',
        }}
      >
        {data.movsource ? <video src={data.movsource} autoPlay loop muted playsInline /> : null}
        {data.mp4source ? <video src={data.mp4source} autoPlay loop muted playsInline /> : null}
      </div>
    );
  }
  