import CropEditableImage from '../components/CropEditableImage';
import GridSpanLayout from '@/pages/editor-xyflow/components/GridSpanLayout';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import './style.css';



const getTextStyle = (textData?: any) => ({
  fontSize: textData?.textSize ?? 14,
  fontFamily: textData?.font,
  opacity: textData?.alpha ?? 1,
  color: textData?.textColor ?? '#111827',
  lineHeight: 1,
  height: textData?.textHeight ? `${textData.textHeight}px` : 'auto',
  whiteSpace: 'nowrap' as const,
});
export default function LauncherLayout_1(props: any) {
  const data = props.data;
  if (!data) return null;
  const size = data.size;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  // const appLinks = Array.isArray(data.appLinks) ? data.appLinks : [];
  const title = data.title;
  const appLinksSource = Array.isArray(data.appLinksSource) ? data.appLinksSource : [];


  // const layoutTemplate = layoutTemplateMap[data.size ?? 1] || layoutTemplateMap[1];
  // const cellCount = Math.max(1, appLinks.length);
  // const points = layoutTemplate.slice(0, cellCount);

  const box: any = (displayIndex: number) => {
    const index = displayIndex - 1;
    const appsource = appLinksSource[index];
    return (
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '10px',
        background: appsource?.source ? 'none' : '#f6efe9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {appsource?.source ? <>
        <img style={{ width: '100%', height: '100%' }} src={appsource.source} alt="" />
        </> : displayIndex}
      </div>
    )
  }
  return (
    <div
      className={`size_${data?.size}`}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: `${data.radius ?? 0}px`,
        boxSizing: 'border-box',
        overflow: isCropEditingNode ? 'visible' : 'hidden',
        display: 'flex',
        position: 'relative',
        padding: '10px',
      }}
    >
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />

      {size === 3 ? (
        <>
          <GridSpanLayout style={{ position: 'relative', zIndex: 2 }} rows={4} cols={4} gap={8}>
            <GridSpanLayout.Item colSpan={2} rowSpan={1}>
              {box(1)}
            </GridSpanLayout.Item>
            <GridSpanLayout.Item colSpan={1} rowSpan={1}>
              {box(2)}
            </GridSpanLayout.Item>
            <GridSpanLayout.Item colSpan={1} rowSpan={1}>
              {box(3)}
            </GridSpanLayout.Item>
            <GridSpanLayout.Item colSpan={1} rowSpan={2}>
              {box(4)}
            </GridSpanLayout.Item>
            <GridSpanLayout.Item colSpan={1} rowSpan={2}>
              {box(5)}
            </GridSpanLayout.Item>
            <GridSpanLayout.Item colSpan={2} rowSpan={2}>
              {box(6)}
            </GridSpanLayout.Item>
            <GridSpanLayout.Item colSpan={2} rowSpan={1}>
              {box(7)}
            </GridSpanLayout.Item>
            <GridSpanLayout.Item colSpan={1} rowSpan={1}>
              {box(8)}
            </GridSpanLayout.Item>
            <GridSpanLayout.Item colSpan={1} rowSpan={1}>
              {box(9)}
            </GridSpanLayout.Item>
          </GridSpanLayout>
        </>
      ) : null }

      {size === 2 ? (
        <>
          <GridSpanLayout style={{ position: 'relative', zIndex: 2 }} rows={2} cols={4} gap={8}>
            <GridSpanLayout.Item colSpan={2} rowSpan={1}>
              {box(1)}
            </GridSpanLayout.Item>
            <GridSpanLayout.Item colSpan={1} rowSpan={1}>
              {box(2)}
            </GridSpanLayout.Item>
            <GridSpanLayout.Item colSpan={1} rowSpan={1}>
              {box(3)}
            </GridSpanLayout.Item>
            <GridSpanLayout.Item colSpan={1} rowSpan={1}>
              {box(4)}
            </GridSpanLayout.Item>
            <GridSpanLayout.Item colSpan={1} rowSpan={1}>
              {box(5)}
            </GridSpanLayout.Item>
            <GridSpanLayout.Item colSpan={2} rowSpan={1}>
              {box(6)}
            </GridSpanLayout.Item>
          </GridSpanLayout>
        </>
      ) : null }
      { size === 1 ? (
        <div style={{
          position: 'absolute',
          zIndex: 2,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}>
          {box(1)}
        </div>
      ) : null }

      {title && title.content ? (
        <div style={{
          zIndex: 2,
          ...getTextStyle(data?.title),
          position: 'absolute',
          transform: 'translate(-23px, 0%)',
          left: '40%',
          bottom: '20px',
        }} >{title.content}</div>
      ) : null}
    </div>
  );
}
