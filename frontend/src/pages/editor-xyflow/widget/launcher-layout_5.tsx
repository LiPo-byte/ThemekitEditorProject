import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import './style.css';

export default function LauncherLayout_5(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  if (!data) return null;
  const size = data.size;
  const gapSize: any = {1: 16, 2: 16, 3: 10 };
  const heightSize: any = {1: 80, 2: 135, 3: 240 };
  const widthSize: any = {1: 80, 2: 64, 3: 96 };
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const appLinks = Array.isArray(data.appLinks) ? data.appLinks : [];
  // const appLinksSource = Array.isArray(data.appLinksSource) ? data.appLinksSource : [];


  // const layoutTemplate = layoutTemplateMap[data.size ?? 1] || layoutTemplateMap[1];
  // const cellCount = Math.max(1, appLinks.length);
  // const points = layoutTemplate.slice(0, cellCount);

  const box: any = (displayIndex: number) => {
    const index = displayIndex - 1;
    const appLink = appLinks[index];
    if (appLink !== '') return null;
    return (
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '10px',
        background: '#f6efe9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {displayIndex}
      </div>
    )
  }
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
        display: 'flex',
        gap: gapSize[size],
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
        { size === 1 ? (
          <div style={{
            borderRadius: 10,
            width: widthSize[size],
            height: heightSize[size],
            flex: 'none',
            position: 'absolute',
            top: 16,
            left: 16,
          }}>
            {box(1)}
          </div>
        ) : appLinks.map((_: any, index: number) => {
          return (
            <div key={index} style={{
              borderRadius: 10,
              width: widthSize[size],
              height: heightSize[size],
              flex: 'none',
            }}>
              {box(index + 1)}
            </div>
          )
        })}
      </div>
    </div>
  );
}
