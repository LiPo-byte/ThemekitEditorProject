import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import './style.css';

export default function LauncherLayout_7(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  if (!data) return null;
  const size = data.size;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const appLinks = Array.isArray(data.appLinks) ? data.appLinks : [];

  const box: any = (displayIndex: number) => {
    const index = displayIndex;
    const appLink = appLinks[index];
    if (appLink) return null;
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

  const renderCell = (index: number, width: number, height: number, style?: any) => (
    <div style={{ width, height, ...style }}>
      {box(index)}
    </div>
  );

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
      { size === 1 && (
        <>
          <div style={{
            position: 'absolute',
            left: 16,
            top: 16,
            zIndex: 2,
          }}>
            {renderCell(0, 64, 64)}
          </div>
          {appLinks[1] !== undefined && (
            <div style={{
              position: 'absolute',
              zIndex: 2,
              bottom: 16,
              right: 16,
            }}>
              {renderCell(1, 64, 64)}
            </div>
          )}
        </>
      ) }
      { size === 2 && (
        <>
          <div style={{
            position: 'absolute',
            zIndex: 2,
            left: 10,
            top: 10,
            display: 'flex',
            gap: 10,
          }}>
            {renderCell(0, 80, 80)}
            {renderCell(1, 64, 64)}
          </div>
          <div style={{
            position: 'absolute',
            zIndex: 2,
            bottom: 10,
            right: 10,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
          }}>
            {renderCell(2, 64, 64)}
            {renderCell(3, 80, 80)}
          </div>
        </>
      ) }
      { size === 3 && (
        <>
          <div style={{
            position: 'absolute',
            zIndex: 2,
            left: 20,
            top: 20,
            display: 'flex',
            gap: 10,
          }}>
            {renderCell(0, 128, 160)}
            {renderCell(1, 64, 112)}
          </div>
          <div style={{
            position: 'absolute',
            zIndex: 2,
            bottom: 20,
            right: 20,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
          }}>
            {renderCell(2, 64, 112)}
            {renderCell(3, 128, 160)}
          </div>
        </>
      ) }
    </div>
  );
}
