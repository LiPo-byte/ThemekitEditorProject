import { useMemo } from 'react';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import CropEditableImage from '../components/CropEditableImage';
import { resolveWidgetFontFamily } from './util';
import './style.css';

const CARD_SIZE_MAP: Record<number, { w: number; h: number, dotw: number,  doth: number }> = {
  1: { w: 60, h: 56, dotw: 5, doth: 10 },
  2: { w: 126, h: 120, dotw: 8, doth: 18 },
  3: { w: 144, h: 136, dotw: 8, doth: 20 },
};

// 左右两侧圆点的尺寸与外偏移，保持和原来 5x10 / -3px 的视觉一致
// const DOT_W = 8;
// const DOT_H = 20;
const DOT_OFFSET = 3;

// 用遮罩在卡片中线挖掉 1px，同时把左右两侧圆点也一起挖掉，
// 透出底层背景（背景图或纯色），而不是盖一条实色分割线和两个实色圆点
const buildCardMask = (w: number, h: number, dotw: number, doth: number) => {
  const dotY = h / 2 - doth / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<mask id="time-card-cutout">` +
    `<rect width="${w}" height="${h}" fill="#fff"/>` +
    `<rect y="${h / 2 - 0.5}" width="${w}" height="1" fill="#000"/>` +
    `<rect x="${-DOT_OFFSET}" y="${dotY}" width="${dotw}" height="${doth}" rx="${dotw / 2}" fill="#000"/>` +
    `<rect x="${w - dotw + DOT_OFFSET}" y="${dotY}" width="${dotw}" height="${doth}" rx="${dotw / 2}" fill="#000"/>` +
    `</mask>` +
    `<rect width="${w}" height="${h}" fill="#fff" mask="url(#time-card-cutout)"/>` +
    `</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};

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
      gap: data.size === 1 ? '8px' : '10px',
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

  const getEdgeDotStyle = (side: 'left' | 'right') => ({
    position: 'absolute' as const,
    top: '50%',
    [side]: '-2px',
    width: cardSize.dotw - 2,
    height: cardSize.doth - 2,
    background: data.time.backgroundColor,
    transform: 'translateY(-50%)',
    borderRadius: '4px',
  });
  const flipNumberStyle = useMemo(() => {
    const cardMask = buildCardMask(cardSize.w, cardSize.h, cardSize.dotw, cardSize.doth);
    return {
      width: cardSize.w,
      height: cardSize.h,
      borderRadius: 10,
      background: data.time.backgroundColor,
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      WebkitMaskImage: cardMask,
      maskImage: cardMask,
      WebkitMaskSize: '100% 100%',
      maskSize: '100% 100%',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
    };
  }, [cardSize.h, cardSize.w, data.time.backgroundColor]);

  const flipCardWrapperStyle = useMemo(() => {
    return {
      width: cardSize.w,
      height: cardSize.h,
      position: 'relative' as const,
    };
  }, [cardSize.h, cardSize.w]);

  const renderFlipCard = (text: string) => (
    <div style={flipCardWrapperStyle}>
      <div style={flipNumberStyle}>
        <span style={timeTextStyle}>{text}</span>
      </div>
      <div style={getEdgeDotStyle('left')} ></div>
      <div style={getEdgeDotStyle('right')} ></div>
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