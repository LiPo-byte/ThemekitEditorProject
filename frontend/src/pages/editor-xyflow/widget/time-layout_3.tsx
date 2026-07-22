import { useMemo } from 'react';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import CropEditableImage from '../components/CropEditableImage';
import { resolveWidgetFontFamily } from './util';
import './style.css';

const CARD_SIZE_MAP: Record<number, { w: number; h: number }> = {
  1: { w: 60, h: 56 },
  2: { w: 126, h: 120 },
  3: { w: 144, h: 136 },
};

const dividerStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: 0,
  right: 0,
  height: 1,
  backgroundColor: '#cfd5e2',
  transform: 'translateY(-0.5px)',
};

const getEdgeDotStyle = (side: 'left' | 'right') => ({
  position: 'absolute' as const,
  top: '50%',
  [side]: '-3px',
  width: '5px',
  height: '10px',
  backgroundColor: '#cfd5e2',
  transform: 'translateY(-50%)',
  borderRadius: '4px',
});

export default function TimeLayout_3(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  if (!data) return null;
  const timeTextStyle = {
    fontSize: data?.time?.textSize ?? 42,
    fontFamily: resolveWidgetFontFamily(props.parentId, data?.time?.font),
    color: data?.time?.textColor ?? '#101828',
    lineHeight: data?.time?.textHeight ? `${data.time.textHeight}px` : '1',
    opacity: data?.time?.alpha ?? 1,
    fontWeight: 700,
    position: 'relative' as const,
    zIndex: 9,
    fontVariantNumeric: 'tabular-nums',
  };

  const cardSize = CARD_SIZE_MAP[data.size] ?? CARD_SIZE_MAP[3];

  const containerStyle = useMemo(() => {
    return {
      backgroundColor: 'rgb(178, 178, 178)',
      overflow: isCropEditingNode ? 'visible' : 'hidden',
      borderRadius: `${data.radius ?? 0}px`,
      position: 'relative' as const,
      // padding: `${data.padding ?? 16}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  }, [data, isCropEditingNode]);

  const timeRowStyle = useMemo(() => {
    return {
      display: 'flex',
      alignItems: 'center',
      gap: data.size === 1 ? '3px' : '10px',
      justifyContent:
        data?.time?.textAlignment === 1
          ? 'flex-start'
          : data?.time?.textAlignment === 3
            ? 'flex-end'
            : 'center',
      position: 'relative' as const,
      zIndex: 9,
    };
  }, [data]);

  const flipNumberStyle = useMemo(() => {
    return {
      width: cardSize.w,
      height: cardSize.h,
      borderRadius: 10,
      background: data.time.backgroundColor,
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  }, [cardSize.h, cardSize.w, data.time.backgroundColor]);

  const renderFlipCard = (text: string) => (
    <div style={flipNumberStyle}>
      <div style={dividerStyle} />
      <div style={getEdgeDotStyle('left')} />
      <div style={getEdgeDotStyle('right')} />
      <span style={timeTextStyle}>{text}</span>
    </div>
  );

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
      {data.time && (
        <div style={timeRowStyle}>
          {renderFlipCard('10')}
          {renderFlipCard('09')}
        </div>
      )}
    </div>
  );
}