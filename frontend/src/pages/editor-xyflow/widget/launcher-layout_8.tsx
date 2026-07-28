import CropEditableImage from '../components/CropEditableImage';
import GridSpanLayout from '@/pages/editor-xyflow/components/GridSpanLayout';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import './style.css';

export default function LauncherLayout_8(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  if (!data) return null;
  const size = data.size;
  const paddingSize: any = {1: 16, 2: 20, 3: 28};
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

  const renderCell = (index: number) => box(index);

  const renderGridItem = (index: number, colSpan: number, rowSpan: number) => (
    <GridSpanLayout.Item colSpan={colSpan} rowSpan={rowSpan}>
      {renderCell(index)}
    </GridSpanLayout.Item>
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
        paddingLeft: paddingSize[size],
        paddingRight: paddingSize[size],
      }}
    >
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      {size == 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{
            height: 64,
            width: '100%',
          }}>
            {renderCell(0)}
          </div>
        </div>
      )}
      {size === 2 && (
        <div style={{
          padding: '10px 0',
          width: '100%',
        }}>
          <GridSpanLayout style={{ position: 'relative', zIndex: 2, width: '100%' }} rows={2} cols={4} gap={8}>
            {renderGridItem(0, 1, 1)}
            {renderGridItem(1, 2, 1)}
            {renderGridItem(4, 1, 2)}
            {renderGridItem(2, 2, 1)}
            {renderGridItem(3, 1, 1)}
          </GridSpanLayout>
        </div>
      )}
      {size === 3 && (
        <div style={{
          padding: '20px 0',
          width: '100%',
        }}>
          <GridSpanLayout style={{ position: 'relative', zIndex: 2, width: '100%' }} rows={4} cols={4} gap={8}>
            {renderGridItem(0, 1, 1)}
            {renderGridItem(1, 2, 1)}
            {renderGridItem(4, 1, 2)}
            {renderGridItem(2, 2, 3)}
            <GridSpanLayout.Item colSpan={1} rowSpan={2} />
            {renderGridItem(5, 1, 2)}
            {renderGridItem(3, 1, 1)}
          </GridSpanLayout>
        </div>
      )}
    </div>
  );
}
