import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import { resolveWidgetFontFamily } from './util';
import './style.css';

const getTextStyle = (parentId?: string, textData?: any) => ({
  fontSize: textData?.textSize ?? 14,
  fontFamily: resolveWidgetFontFamily(parentId, textData?.font),
  opacity: textData?.alpha ?? 1,
  color: textData?.textColor ?? '#111827',
  lineHeight: 1,
  height: textData?.textHeight ? `${textData.textHeight}px` : 'auto',
  whiteSpace: 'nowrap' as const,
});
export default function LauncherLayout_0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  if (!data) return null;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const appLinks = Array.isArray(data.appLinks) ? data.appLinks : [];
  const title = data.title;
  const appLinksSource = Array.isArray(data.appLinksSource) ? data.appLinksSource : []
  const buildHexPoints = (
    rows: number[],
    xSpacing: number,
    yStart: number,
    yGap: number,
    diameter: number,
  ) => {
    const points: Array<{ x: number; y: number; d: number }> = [];
    rows.forEach((count, rowIndex) => {
      const rowStartX = 50 - ((count - 1) * xSpacing) / 2;
      const y = yStart + rowIndex * yGap;
      for (let i = 0; i < count; i += 1) {
        points.push({
          x: rowStartX + i * xSpacing,
          y,
          d: diameter,
        });
      }
    });
    return points;
  };

  const layoutTemplateMap: Record<number, Array<{ x: number; y: number; d: number }>> = {
    1: [{ x: 40, y: 40, d: 56 }],
    2: buildHexPoints([4, 5, 4], 18, 31, 22, 36),
    3: buildHexPoints([3, 4, 5, 4, 3], 15, 22, 14, 36),
  };

  const layoutTemplate = layoutTemplateMap[data.size ?? 1] || layoutTemplateMap[1];
  const cellCount = Math.max(1, appLinks.length);
  const points = layoutTemplate.slice(0, cellCount);

  const getSize = (index: number, size: number) => {
    if (size === 3 && [1, 4, 5, 8, 10, 13, 14, 17].includes(index)) {
      return 36;
    }
    if (size === 3 && index === 9) {
      return 46;
    }
    if (size === 2 && [1, 2, 5, 7, 10, 11].includes(index)) {
      return 36;
    }
    if (size === 2 && index === 6) {
      return 46;
    }
    if (size === 1) return 46;
    return 30;
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
      {points.map((point, index) => (
        <div
          key={`cell-${index}`}
          style={{
            position: 'absolute',
            zIndex: 2,
            left: `${point.x}%`,
            top: `${point.y}%`,
            width: getSize(index, data.size),
            height: getSize(index, data.size),
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#f6efe9',
            // border: '1px solid #eadfd5',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {appLinksSource[index] && appLinksSource[index].source ? (
            <img src={appLinksSource[index].source} />
          ) : index + 1 }
        </div>
      ))}
      {title && title.content ? (
        <div style={{
          zIndex: 2,
          ...getTextStyle(props.parentId, data?.title),
          position: 'absolute',
          transform: 'translate(-23px, 0%)',
          left: '40%',
          bottom: '20px',
        }} >{title.content}</div>
      ) : null}
    </div>
  );
}
