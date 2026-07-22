import { useMemo } from 'react';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
//   useEditorGetParentNodeData,
  // type CropProps,
} from '../context';
import CropEditableImage from '../components/CropEditableImage';
import { resolveWidgetFontFamily } from './util';
import './style.css';


export default function TimeLayout_1(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  if (!data) return null;
  const getTextStyle = (textData?: any) => ({
    fontSize: textData?.textSize ?? 14,
    fontFamily: resolveWidgetFontFamily(props.parentId, textData?.font),
    opacity: textData?.alpha ?? 1,
    color: textData?.textColor ?? '#111827',
    height: textData?.textHeight + 'px',
    lineHeight: '100%',
    zIndex: 9,
    position: 'relative' as const,
    // whiteSpace: 'nowrap',
    marginTop: (textData?.topSpacing || 0) + 'px',
    marginBottom: (textData?.bottomSpacing || 0) + 'px',
  });
  const getTimeStyle:any = (textData?: any) => ({
    textAlign:
      textData.textAlignment === 1 ? 'left' : (data.time.textAlignment === 2 ? 'center' : 'right')
  });

  const containerStyle = useMemo(() => {
    return {
      backgroundColor: '#ffffff',
      overflow: isCropEditingNode ? 'visible' : 'hidden',
      borderRadius: `${data.radius ?? 0}px`,
      position: 'relative' as const,
      paddingLeft: `${data.padding ?? 0}px`,
      paddingRight: `${data.padding ?? 0}px`,
      paddingTop: '16px',
      paddingBottom: data.size === 3 ? '32px' : '16px',
    };
  }, [data, isCropEditingNode])

  const timeElement = useMemo(() => {
    if (data.time.textAlignment === 2) {
        return (
            <div style={{
                ...getTextStyle(data.time),
                ...getTimeStyle(data.time),
                // marginBottom: data.size === 1 ? '4px' : '10px'
            }}>
                10:09
            </div>
        )
    }
    return (
        <>
            <div style={{
                ...getTextStyle(data.time),
                ...getTimeStyle(data.time),
                // marginBottom: data.size === 1 ? '4px' : '10px'
            }}>
                10 <br />09
            </div>
            {/* <div style={{
                ...getTextStyle(data.time),
                ...getTimeStyle(data.time),
            }}>
                09
            </div> */}
        </>
    )
  }, [data])

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
      { data.time && timeElement}
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