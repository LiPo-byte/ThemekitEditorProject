import { useMemo, type CSSProperties } from 'react';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import CropEditableImage from '../components/CropEditableImage';
import { resolveWidgetFontFamily, isAndroidWidgetNode } from './util';
import './style.css';

export default function TimeLayout_5(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  const firstImageAnimation = data?.firstImageAnimation;
  const secondImageAnimation = data?.secondImageAnimation;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isAndroid = isAndroidWidgetNode(props.parentId);

  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  if (!data) return null;

  const weekLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekDates = ['13', '14', '15', '16', '17', '18', '19'];
  const monthText = data?.month?.previewText || 'Dec';
  const timeText = '10:09';
  const [hour, minute] = timeText.split(':');
  const hasAnimationFields =
    Object.prototype.hasOwnProperty.call(data, 'firstImageAnimation')
    || Object.prototype.hasOwnProperty.call(data, 'secondImageAnimation');
  const animationConfigs = [firstImageAnimation, secondImageAnimation].filter(Boolean);

  const getOtherBackgroundColor = (otherData?: any) => {
    const rawColor = String(otherData?.backgroundColor ?? otherData?.textColor ?? '#000000');
    const baseColor =
      rawColor.startsWith('#') && rawColor.length === 9 ? rawColor.slice(0, 7) : rawColor;
    const alpha = Number(otherData?.alpha);
    const normalizedAlpha = Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1;
    const alphaHex = Math.round(normalizedAlpha * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
    return `${baseColor}${alphaHex}`;
  };
  const getTextStyle = (textData?: any) => ({
    fontSize: textData?.textSize ?? 14,
    fontFamily: resolveWidgetFontFamily(props.parentId, textData?.font),
    opacity: textData?.alpha ?? 1,
    color: textData?.textColor ?? '#111827',
    lineHeight: textData?.textHeight ? `${textData.textHeight}px` : '1',
    whiteSpace: 'nowrap',
  });

  const containerStyle: any = useMemo(() => {
    return {
      backgroundColor: '#ffffff',
      overflow: isCropEditingNode ? 'visible' : 'hidden',
      borderRadius: `${data.radius ?? 0}px`,
      position: 'relative' as const,
      color: '#000',
    };
  }, [data, isCropEditingNode]);

  const resolveAnimationCategory = (animationConfig: any, index: number) => {
    const categoryValue = Number(animationConfig?.animationCategory);
    if (Number.isFinite(categoryValue)) {
      return categoryValue;
    }
    // 兼容旧数据：默认第一个走直线，第二个走旋转
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

  const calendarCellStyle = (
    width: number,
    fontSize: number,
    textColor = '#ffffff',
    fillColor?: string,
    borderRadius?: number,
    opacity?: number,
  ): CSSProperties => ({
    width,
    textAlign: 'center',
    fontSize,
    fontFamily: resolveWidgetFontFamily(props.parentId, data?.calendar?.font),
    color: textColor,
    backgroundColor: fillColor || 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius,
    opacity: opacity || 1,
  });

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
      {hasAnimationFields
        ? animationConfigs.map((item: any, index: number) => {
            if (data?.size === 2 ) return null
            return renderAnimationLayer(item, index);
          })
        : null}

      {data?.size === 1 && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 22,
              top: 127,
              width: 112,
              height: 18,
              display: 'flex',
              zIndex: 9,
            }}
          >
            <div
              style={{
                width: 40,
                height: 18,
                backgroundColor: getOtherBackgroundColor(data?.other) || '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9px',
                marginRight: '2px',
                ...getTextStyle({
                  ...data.time,
                }),
              }}
            >
              {timeText}
            </div>
            <div
              style={{
                width: 72,
                height: 18,
                backgroundColor: getOtherBackgroundColor(data?.other) || '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9px',
                ...getTextStyle({
                  ...data.time,
                }),
              }}
            >
              12/17 Wed
            </div>
          </div>
        </>
      )}

      {data?.size === 2 && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 16,
              top: 16,
              zIndex: 9,
              ...getTextStyle({
                ...data.time,
              }),
            }}
          >
            {timeText}
          </div>
          <div
            style={{
              position: 'absolute',
              left: 20,
              top: 86,
              width: 143,
              height: 14,
              zIndex: 9,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div style={{
              width: 120,
              height: 1,
              backgroundColor: getOtherBackgroundColor(data?.other) || '#000000',
            }} />
            <div
              style={{
                marginLeft: 4,
                ...getTextStyle({
                  ...data.month,
                }),
                color: getOtherBackgroundColor(data?.other) || '#000000',
              }}
            >
              {monthText}
            </div>
          </div>
          <div style={{ position: 'absolute', left: 16, top: 100, zIndex: 9 }}>
            <div style={{
              display: 'flex',
              width: 147,
              height: 17,
              backgroundColor: getOtherBackgroundColor(data?.other) || '#000000',
              borderRadius: '8.5px',
              justifyContent: 'space-between',
            }}>
              {weekLabels.map((label, index) => (
                <div key={`w-${label}-${index}-${data.size}`} style={calendarCellStyle(17, 13, data?.calendar?.textColor )}>
                  {label}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', width: 147, height: 17, marginTop: 4, justifyContent: 'space-between' }}>
              {weekDates.map((item, i) => {
                const maskId = `cal1-day-mask-${props.id}-${i}`;
                if (i === 4 && !isAndroid) {
                  return (
                    <div
                      key={i}
                      style={{
                        width: 17,
                        height: 17,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width={17} height={17} style={{ display: 'block' }}>
                        <defs>
                          <mask id={maskId}>
                            <rect width="100%" height="100%" fill="white" />
                            <text
                              x="50%"
                              y="50%"
                              dominantBaseline="central"
                              textAnchor="middle"
                              fill="black"
                              fontSize={11}
                              fontFamily={data?.calendar?.font}
                            >
                              17
                            </text>
                          </mask>
                        </defs>
                        <circle
                          cx="50%"
                          cy="50%"
                          r="50%"
                          fill={data.time.textColor}
                          mask={`url(#${maskId})`}
                        />
                      </svg>
                    </div>
                  )
                }
                return (
                  <div
                    key={`d-${item}-${data.size}`}
                    style={calendarCellStyle(
                      17,
                      11,
                      data?.calendar?.textColor,
                      i === 4 ? getOtherBackgroundColor(data?.time) : undefined,
                      i === 4 ? 8.5 : 0,
                      i < 4 ? 0.6 : 1,
                    )}
                  >
                    {item}
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            right: 0,
            bottom: 0,
          }}>
            {hasAnimationFields
            ? animationConfigs.map((item: any, index: number) => {
                return renderAnimationLayer(item, index);
              })
            : null}
          </div>
        </>
      )}

      {data?.size === 3 && (
        <>
          <div
            style={{
              position: 'absolute',
              right: 16,
              top: 16,
              zIndex: 9,
              ...getTextStyle({
                ...data.time,
              }),
            }}
          >
            {hour}
          </div>
          <div
            style={{
              position: 'absolute',
              right: 16,
              top: 106,
              zIndex: 9,
              ...getTextStyle({
                ...data.time,
              }),
            }}
          >
            {minute}
          </div>
          <div
            style={{
              position: 'absolute',
              right: 38,
              top: 104,
              width: 40,
              height: 4,
              // backgroundColor: '#000',
              backgroundColor: getOtherBackgroundColor(data?.other) || '#000000',
              zIndex: 9,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 17,
              top: 196,
              width: 80,
              height: 28,
              backgroundColor: getOtherBackgroundColor(data?.other) || '#000000',
              zIndex: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '18px',
            }}
          >
            <span style={{
              ...getTextStyle({
                ...data.month,
              }),
            }}>{monthText}</span>
          </div>

          <div style={{ position: 'absolute', left: 18, top: 244, width: 294, zIndex: 9 }}>
            <div style={{
              display: 'flex',
              width: 294,
              height: 36,
              borderRadius: 18,
              justifyContent: 'space-between',
              backgroundColor: getOtherBackgroundColor(data?.other) || '#000000',
            }}>
              {weekLabels.map((label, index) => (
                <div key={`w-lg-${label}-${index}`} style={calendarCellStyle(36, 18, data?.calendar?.textColor)}>
                  {label}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', width: 294, height: 36, marginTop: 12, justifyContent: 'space-between' }}>
              {weekDates.map((item, i) => {
                const maskId = `cal1-day-mask-${props.id}-${i}`;
                if(i === 4 && !isAndroid) {
                  return (
                    <div
                      key={i}
                      style={{
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width={36} height={36} style={{ display: 'block' }}>
                        <defs>
                          <mask id={maskId}>
                            <rect width="100%" height="100%" fill="white" />
                            <text
                              x="50%"
                              y="50%"
                              dominantBaseline="central"
                              textAnchor="middle"
                              fill="black"
                              fontSize={16}
                              fontFamily={data?.calendar?.font}
                            >
                              17
                            </text>
                          </mask>
                        </defs>
                        <circle
                          cx="50%"
                          cy="50%"
                          r="50%"
                          fill={data.time.textColor}
                          mask={`url(#${maskId})`}
                        />
                      </svg>
                    </div>
                  )
                }
                return  <div
                  key={`d-lg-${item}`}
                  style={calendarCellStyle(
                    36,
                    16,
                    data?.calendar?.textColor,
                    i === 4 ? getOtherBackgroundColor(data?.time) : undefined,
                    i === 4 ? 18 : 0,
                    i < 4 ? 0.6 : 1,
                  )}
                >
                  {item}
                </div>
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}