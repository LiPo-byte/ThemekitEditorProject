// import { useEffect, useMemo, useRef } from 'react';
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
export default function BatteryLayout_1(props: any) {
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const data = props.data;
  const scale = props.scale || 1;
  if (!data) return null;

  
  return (
    <div className={`size_${data?.size}`} style={{
      transform: `scale(${scale}, ${scale})`,
      transformOrigin: '0 0',
      backgroundColor: '#ffffff',
      overflow: isCropEditingNode ? 'visible' : 'hidden',
      borderRadius: `${data.radius ?? 0}px`,
      boxSizing: 'border-box',
      position: 'relative',
      padding: '20px 16px'
    }}>
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      <div
        style={{
          ...getTextStyle(props.parentId, data.battery),
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: data.textAlignment === 1 ? 'flex-start' : ( data.textAlignment === 2 ? 'center' : 'flex-end' ),
          zIndex: 2,
        }}
      >
        100%
      </div>
    </div>
  );
}