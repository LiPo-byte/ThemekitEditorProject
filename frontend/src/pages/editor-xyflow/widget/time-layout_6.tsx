import { useMemo, type CSSProperties } from 'react';
import { useEditorCropEditingNodeId, useEditorCropToolOpen } from '../context';
import CropEditableImage from '../components/CropEditableImage';
import './style.css';

export default function TimeLayout_6(props: any) {
  const data = props.data;
  const firstImageAnimation = data?.firstImageAnimation;
  const secondImageAnimation = data?.secondImageAnimation;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  if (!data) return null;

  const timeText = '10:09';
  const monthText = data?.month?.previewText || 'Dec';
  const dayText = data?.month?.dayPreviewText || 'Wed';
  const hasAnimationFields =
    Object.prototype.hasOwnProperty.call(data, 'firstImageAnimation')
    || Object.prototype.hasOwnProperty.call(data, 'secondImageAnimation');
  const animationConfigs = [firstImageAnimation, secondImageAnimation].filter(Boolean);

  const getTextStyle = (textData?: any) => ({
    fontSize: textData?.textSize ?? 14,
    fontFamily: textData?.font,
    opacity: textData?.alpha ?? 1,
    color: textData?.textColor ?? '#111827',
    lineHeight: textData?.textHeight ? `${textData.textHeight}px` : '1',
    whiteSpace: 'nowrap',
  });

  const containerStyle: any = useMemo(
    () => ({
      backgroundColor: '#ffffff',
      overflow: isCropEditingNode ? 'visible' : 'hidden',
      borderRadius: `${data.radius ?? 0}px`,
      position: 'relative' as const,
      color: '#000',
    }),
    [data, isCropEditingNode],
  );

  const resolveAnimationCategory = (animationConfig: any, index: number) => {
    const categoryValue = Number(animationConfig?.animationCategory);
    if (Number.isFinite(categoryValue)) {
      return categoryValue;
    }
    return index === 0 ? 0 : 1;
  };

  const getAnimationLayerStyle = (animationConfig: any, category: number) => {
    if (!animationConfig || typeof animationConfig !== 'object') return null;
    const {
      imageHeight,
      imageWidth,
      animationType,
      padding,
      crossPadding,
      duration,
      distance,
    } = animationConfig ?? {};
    const width = Number(imageWidth) || 40;
    const height = Number(imageHeight) || 40;
    const axis = animationType === 0 || animationType === 1 ? 'y' : 'x';
    const absDistance = Math.abs(distance ?? 0);
    const isReverse = animationType === 1 || animationType === 3;
    const startOffset = isReverse ? absDistance : 0;
    const endOffset = isReverse ? 0 : absDistance;
    const resolvedCrossPadding = Number(crossPadding);
    const resolvedPadding = Number(padding);
    const isCrossCentered = resolvedCrossPadding === -1;
    const left = isCrossCentered
      ? `calc(50% - ${width / 2}px)`
      : `${Number.isFinite(resolvedCrossPadding) ? resolvedCrossPadding : 0}px`;
    const top = `${Number.isFinite(resolvedPadding) ? resolvedPadding : 0}px`;

    const baseStyle: CSSProperties = {
      position: 'absolute',
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: 8,
      boxSizing: 'border-box',
      overflow: 'hidden',
      zIndex: 8,
      left,
      top,
      '--xyflow-time4-start-offset': `${startOffset}px`,
      '--xyflow-time4-end-offset': `${endOffset}px`,
    } as CSSProperties;
    if (category === 0) {
      baseStyle.animation = `${Math.max(Number(duration) || 0, 0.1)}s ease-in-out infinite ${
        axis === 'x' ? 'xyflow-time4-move-x' : 'xyflow-time4-move-y'
      }`;
      return baseStyle;
    }
    if (category === 1) {
      const rawRotateDuration = Number(animationConfig?.duration2 ?? duration);
      const rotateDuration = Math.max(Math.abs(rawRotateDuration) || 0, 0.1);
      const rotateDirection = rawRotateDuration < 0 ? 'reverse' : 'normal';
      baseStyle.animation = `${rotateDuration}s linear infinite xyflow-time5-rotate`;
      baseStyle.animationDirection = rotateDirection;
      baseStyle.transformOrigin = '50% 50%';
      return baseStyle;
    }
    return baseStyle;
  };

  const renderAnimationLayer = (animationConfig: any, index: number) => {
    const category = resolveAnimationCategory(animationConfig, index);
    const style = getAnimationLayerStyle(animationConfig, category);
    if (!style) return null;
    const source = animationConfig?.source;
    return (
      <div key={`anim-layer-${index}`} style={style}>
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
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: category === 1 ? 'rgba(99, 102, 241, 0.28)' : 'rgba(59, 130, 246, 0.35)',
              border: category === 1
                ? '1px solid rgba(99, 102, 241, 0.75)'
                : '1px solid rgba(59, 130, 246, 0.85)',
              borderRadius: 8,
              boxSizing: 'border-box',
            }}
          />
        )}
      </div>
    );
  };

  const monthTagBase = {
    position: 'absolute' as const,
    top: 39,
    height: 16,
    zIndex: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <>
      <div className={`size_${data?.size}`} style={containerStyle}>
        {hasAnimationFields
          ? animationConfigs.map((item: any, index: number) => renderAnimationLayer(item, index))
          : null}

        {data?.size === 1 && (
          <>
            <div
            style={{
              position: 'absolute',
              left: 22,
              right: 22,
              bottom: 6,
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            >
              <div
                style={{
                  zIndex: 9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...getTextStyle({ ...data.month }),
                }}
              >
                {monthText}
              </div>
              <div style={{
                width: 2,
                height: 5,
                borderRadius: 1,
                flex: 'none',
                backgroundColor: data?.other?.backgroundColor,
              }} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...getTextStyle({ ...data.time }),
                }}
              >
                {timeText}
              </div>
              <div style={{
                width: 2,
                height: 5,
                flex: 'none',
                backgroundColor: data?.other?.backgroundColor,
                borderRadius: 1,
              }} />
              <div
                style={{
                  zIndex: 9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...getTextStyle({ ...data.month }),
                }}
              >
                {dayText}
              </div>

            </div>
          </>
        )}

        {data?.size === 2 && (
          <>
            <div
              style={{
                position: 'absolute',
                left: 33,
                top: 55,
                width: 132,
                height: 61,
                zIndex: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...getTextStyle({ ...data.time }),
              }}
            >
              {timeText}
            </div>
            <div style={{ ...monthTagBase, left: 38, width: 34, ...getTextStyle({ ...data.month }) }}>12/25</div>
            <div style={{ ...monthTagBase, left: 134, width: 26, ...getTextStyle({ ...data.month }) }}>{dayText}</div>
            <div style={{ position: 'absolute', left: 16, top: 76, width: 3, height: 15, backgroundColor: data?.other?.backgroundColor, zIndex: 9, borderRadius: 2 }} />
          </>
        )}

        {data?.size === 3 && (
          <>
            <div
              style={{
                position: 'absolute',
                left: 80,
                top: 246,
                width: 170,
                height: 79,
                zIndex: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...getTextStyle({ ...data.time }),
              }}
            >
              {timeText}
            </div>
            <div style={{ ...monthTagBase, left: 104, top: 230, width: 34, ...getTextStyle({ ...data.month }) }}>12/25</div>
            <div style={{ ...monthTagBase, left: 200, top: 230, width: 26, ...getTextStyle({ ...data.month }) }}>{dayText}</div>
          </>
        )}
        <CropEditableImage
          nodeId={props.id}
          source={data.source}
          radius={data.radius}
          cropProps={data.crop_props}
        />
      </div>
    </>
  );
}