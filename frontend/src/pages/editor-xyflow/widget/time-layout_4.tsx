import { useMemo, type CSSProperties } from 'react';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import CropEditableImage from '../components/CropEditableImage';
import { resolveWidgetFontFamily } from './util';
import './style.css';


export default function TimeLayout_1(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  const firstImageAnimation = data?.firstImageAnimation;
  const secondImageAnimation = data?.secondImageAnimation;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();

  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  if (!data) return null;
  const getTextStyle = (textData?: any) => ({
    fontSize: textData?.textSize ?? 14,
    fontFamily: resolveWidgetFontFamily(props.parentId, textData?.font),
    opacity: textData?.alpha ?? 1,
    color: textData?.textColor ?? '#111827',
    lineHeight: textData?.textHeight ? `${textData.textHeight}px` : 'normal',
    position: 'absolute' as const,
    zIndex: 9,
    whiteSpace: 'nowrap',
    left: '16px',
    right: '16px',
    bottom: '16px',
  });

  const containerStyle:any = useMemo(() => {
    return {
      backgroundColor: '#ffffff',
      overflow: isCropEditingNode ? 'visible' : 'hidden',
      borderRadius: `${data.radius ?? 0}px`,
      position: 'relative' as const,
      textAlign: data.time.textAlignment === 1 ? 'left' : (data.time.textAlignment === 2 ? 'center' : 'right'),
    };
  }, [data, isCropEditingNode])

  const getAnimationBlockStyle = (animationConfig: any) => {
    if (!animationConfig || typeof animationConfig !== 'object') return null;
    const {
      imageHeight,
      imageWidth,
      source,
      animationType,
      padding,
      crossPadding,
      duration,
      distance,
    } = animationConfig ?? {};
    const axis = animationType === 0 || animationType === 1 ? 'y' : 'x';
    const absDistance = Math.abs(distance ?? 0);
    const isReverse = animationType === 1 || animationType === 3;
    const startOffset = isReverse ? absDistance : 0;
    const endOffset = isReverse ? 0 : absDistance;

    const baseStyle: CSSProperties = {
      position: 'absolute',
      width: `${imageWidth ?? 40}px`,
      height: `${imageHeight ?? 40}px`,
      borderRadius: 8,
      background: source ? 'transparent' : 'rgba(59, 130, 246, 0.35)',
      border: source ? 'none' : '1px solid rgba(59, 130, 246, 0.85)',
      boxSizing: 'border-box',
      overflow: 'hidden',
      zIndex: 8,
      animation: `${Math.max(Number(duration) || 0, 0.1)}s ease-in-out infinite ${
        axis === 'x' ? 'xyflow-time4-move-x' : 'xyflow-time4-move-y'
      }`,
      '--xyflow-time4-start-offset': `${startOffset}px`,
      '--xyflow-time4-end-offset': `${endOffset}px`,
    } as CSSProperties;

    const resolvedCrossPadding = Number(crossPadding);
    const isCrossCentered = resolvedCrossPadding === -1;
    if (axis === 'y') {
      baseStyle.top = `${padding ?? 0}px`;
      baseStyle.left = isCrossCentered
        ? `calc(50% - ${(imageWidth ?? 40) / 2}px)`
        : `${resolvedCrossPadding || 0}px`;
      return baseStyle;
    }

    baseStyle.left = `${padding ?? 0}px`;
    baseStyle.top = isCrossCentered
      ? `calc(50% - ${(imageHeight ?? 40) / 2}px)`
      : `${resolvedCrossPadding || 0}px`;
    return baseStyle;
  };

  const firstAnimationBlockStyle = useMemo(
    () => getAnimationBlockStyle(firstImageAnimation),
    [firstImageAnimation],
  );
  const secondAnimationBlockStyle = useMemo(
    () => getAnimationBlockStyle(secondImageAnimation),
    [secondImageAnimation],
  );

  const renderAnimatedBlock = (animationConfig: any, blockStyle: CSSProperties | null) => {
    if (!blockStyle) return null;
    const source = animationConfig?.source;
    return (
      <div style={blockStyle}>
        {source ? (
          <img
            src={source}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : null}
      </div>
    );
  };

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
          10:29
        </span>
      )}
      {renderAnimatedBlock(firstImageAnimation, firstAnimationBlockStyle)}
      {renderAnimatedBlock(secondImageAnimation, secondAnimationBlockStyle)}
    </div>
  );
}