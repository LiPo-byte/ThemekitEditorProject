import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import './style.css';

export default function LauncherLayout_6(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  if (!data) return null;
  const size = data.size;
  // const gapSize: any = {1: 16, 2: 16, 3: 10 };
  const heightSize: any = {1: 96, 2: 64, 3: 48 };
  const widthSize: any = {1: 96, 2: 240, 3: 240 };
  const gapSize: any = {1: 16, 2: 7, 3: 16};
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const appLinks = Array.isArray(data.appLinks) ? data.appLinks : [];


  const box: any = (displayIndex: number) => {
    const index = displayIndex;
    const appLink = appLinks[index];
    if (appLink !== '') return null;
    return (
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '10px',
        background: appLink ? 'none' : '#f6efe9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {displayIndex + 1}
      </div>
    )
  }
  const justifyContentsize = ['flex-end', 'flex-start', 'center']
  return (
    <div
      className={`size_${data?.size}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor: '#ffffff',
        borderRadius: `${data.radius ?? 0}px`,
        boxSizing: 'border-box',
        overflow: isCropEditingNode ? 'visible' : 'hidden',
        display: 'flex',
        position: 'relative',
        paddingLeft: size === 1 ? 16 : 20,
        paddingRight: size === 1 ? 16 : 20,
      }}
    >
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: gapSize[size],
        zIndex: 2,
      }}>
        {appLinks.map((_: any, index: number) => {
          return (
            <div key={ _ + '' + index} style={{
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: size === 1 ? 'center' : justifyContentsize[index % 3],
            }}>
              <div style={{
                width: widthSize[size],
                height: heightSize[size],
                borderRadius: 10,
              }}>
                {box(index)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
