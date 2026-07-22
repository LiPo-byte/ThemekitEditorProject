import { useMemo } from 'react';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
  useEditorGetParentNodeData,
  // type CropProps,
} from '../context';
import CropEditableImage from '../components/CropEditableImage';
import { resolveWidgetFontFamily } from './util';
import './style.css';

// interface TimeLayoutData {
//   size?: 1 | 2 | 3;
//   time?: {
//     textSize?: number;
//     font?: string;
//     alpha?: number;
//     textColor?: string,
//     textHeight?: string,
//   };
//   day?: {
//     textSize?: number;
//     font?: string;
//     alpha?: number;
//     textColor?: string,
//     textHeight?: string,
//     topSpacing?: number,
//     bottomSpacing?: number,
//   };
//   date?: {
//     textSize?: number;
//     font?: string;
//     alpha?: number;
//     textColor?: string,
//     textHeight?: string,
//   };
//   source?: string;
//   padding?: number;
//   radius?: number;
//   layoutType?: any;
//   crop_props?: CropProps;
// }

export default function TimeLayout_1(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();

  const getParentNodeData = useEditorGetParentNodeData();
  const parentData = getParentNodeData(props.id) ?? props.parentData ?? {};
  const { textAlignment } = parentData;
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  if (!data) return null;

  const alignItems = useMemo(() => {
    if (textAlignment === 1) return 'flex-start';
    if (textAlignment === 2) return 'center';
    return 'flex-end';
  }, [textAlignment]);

  // const getTextStyle = (textData?: TimeLayoutData['time'] | TimeLayoutData['day']) => ({
  const getTextStyle = (textData?: any) => ({
    fontSize: textData?.textSize ?? 14,
    fontFamily: resolveWidgetFontFamily(props.parentId, textData?.font),
    opacity: textData?.alpha ?? 1,
    color: textData?.textColor ?? '#111827',
    lineHeight: textData?.textHeight ? `${textData.textHeight}px` : 'normal',
    position: 'relative' as const,
    zIndex: 9,
    whiteSpace: 'nowrap',
    marginTop: (textData?.topSpacing || 0) + 'px',
    marginBottom: (textData?.bottomSpacing || 0) + 'px',
  });

  const containerStyle = useMemo(() => {
    return {
      backgroundColor: '#ffffff',
      overflow: isCropEditingNode ? 'visible' : 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems,
      justifyContent: 'center',
      borderRadius: `${data.radius ?? 0}px`,
      padding: textAlignment === 2 ? '0' : `0 ${data.padding ?? 0}px`,
      position: 'relative' as const,
    };
  }, [textAlignment, data, isCropEditingNode])

  return (
    <div className={`size_${data?.size}`} style={{
        ...containerStyle,
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
      }}>
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      { data.time && (
        <span style={getTextStyle(data.time)}>
          { !data.day && !data.date ? '10:09 AM' : '10:09'}
        </span>
      )}
      {data.day && (
        <div style={{ ...getTextStyle(data.day) }}>
          Wednesday
        </div>
      )}
      {data.date && (
        <div style={getTextStyle(data.date)}>
          March 23
        </div>
      )}
    </div>
  );
}