import { useMemo, type CSSProperties } from 'react';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import CropEditableImage from '../components/CropEditableImage';
import './style.css';

const ROTATE_BLOCK_MAP: Record<number, any> = {
  1: {
    outer: { x: 22, y: 10, size: 112 },
    inner: { offset: 26, size: 60 },
    icon: { x: 34, y: 36, w: 44, h: 40 },
  },
  2: {
    outer: { x: 191, y: 17, size: 122 },
    inner: { offset: 26, size: 70 },
    icon: { x: 34, y: 36, w: 55, h: 50 },
  },
  3: {
    outer: { x: 18, y: 26, size: 198 },
    inner: { offset: 45, size: 108 },
    icon: { x: 53, y: 59, w: 89, h: 81 },
  },
};

export default function TimeLayout_5(props: any) {
  const data = props.data;
  const firstImageAnimation = data?.firstImageAnimation;
  const secondImageAnimation = data?.secondImageAnimation;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();

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

  const getTextStyle = (textData?: any) => ({
    fontSize: textData?.textSize ?? 14,
    fontFamily: textData?.font,
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

  const getMoveBlockStyle = (animationConfig: any) => {
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
      animationCategory,
    } = animationConfig ?? {};
    const axis = animationType === 2 || animationType === 0 || animationType === 1 ? 'y' : 'x';
    const absDistance = Math.abs(distance ?? 0);
    const isReverse = animationType === 1 || animationType === 2 || animationType === 3;
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
      '--xyflow-time4-start-offset': `${startOffset}px`,
      '--xyflow-time4-end-offset': `${endOffset}px`,
    } as CSSProperties;

    if (Number(animationCategory) !== 2) {
      baseStyle.animation = `${Math.max(Number(duration) || 0, 0.1)}s ease-in-out infinite ${
        axis === 'x' ? 'xyflow-time4-move-x' : 'xyflow-time4-move-y'
      }`;
    }

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

  const getRotateImageStyle = (animationConfig: any, fallbackLayout: any) => {
    const imageWidth = Number(animationConfig?.imageWidth) || fallbackLayout.icon.w;
    const imageHeight = Number(animationConfig?.imageHeight) || fallbackLayout.icon.h;
    const resolvedCrossPadding = Number(animationConfig?.crossPadding);
    const isCrossCentered = resolvedCrossPadding === -1;
    const resolvedPadding = Number(animationConfig?.padding);
    const top = Number.isFinite(resolvedPadding)
      ? resolvedPadding
      : fallbackLayout.icon.y;
    const left = isCrossCentered
      ? (fallbackLayout.outer.size - imageWidth) / 2
      : (Number.isFinite(resolvedCrossPadding) ? resolvedCrossPadding : fallbackLayout.icon.x);

    const duration = Math.max(Number(animationConfig?.duration) || 0, 0.1);
    const absDistance = Math.abs(Number(animationConfig?.distance));
    const rotateDistance = absDistance > 0 ? absDistance : 360;
    const animationType = Number(animationConfig?.animationType);
    const isReverse = animationType === 1 || animationType === 2 || animationType === 3;
    const startAngle = isReverse ? rotateDistance : 0;
    const endAngle = isReverse ? 0 : rotateDistance;

    const imageStyle: CSSProperties = {
      position: 'absolute',
      left,
      top,
      width: imageWidth,
      height: imageHeight,
      objectFit: 'cover',
      display: 'block',
      transformOrigin: '50% 50%',
      '--xyflow-time5-rotate-start': `${startAngle}deg`,
      '--xyflow-time5-rotate-end': `${endAngle}deg`,
    } as CSSProperties;
    if (Number(animationConfig?.animationCategory) !== 2) {
      imageStyle.animation = `${duration}s linear infinite xyflow-time5-rotate`;
    }
    return imageStyle;
  };

  const renderLineOrStaticBlock = (animationConfig: any, index: number) => {
    const style = getMoveBlockStyle(animationConfig);
    if (!style) return null;
    const source = animationConfig?.source;
    return (
      <div key={`line-static-${index}`} style={style}>
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
              background: 'rgba(59, 130, 246, 0.35)',
              border: '1px solid rgba(59, 130, 246, 0.85)',
              borderRadius: 8,
              boxSizing: 'border-box',
            }}
          />
        )}
      </div>
    );
  };

  const renderRotateBlock = () => {
    const layout = ROTATE_BLOCK_MAP[data?.size] || ROTATE_BLOCK_MAP[1];
    const outerColor = data?.other?.backgroundColor || '#B4B4B4';
    const rotateAnimationConfigs = animationConfigs.filter(
      (item: any, index: number) => resolveAnimationCategory(item, index) === 1,
    );
    return (
      <div>
        {rotateAnimationConfigs.map((rotateAnimationConfig: any, index: number) => {
          const rotateSource = rotateAnimationConfig?.source || '';
          return rotateSource ? (
            <img
              key={`rotate-image-${index}`}
              src={rotateSource}
              alt=""
              style={getRotateImageStyle(rotateAnimationConfig, layout)}
            />
          ) : (
            <div
              key={`rotate-placeholder-${index}`}
              style={{
                ...getRotateImageStyle(rotateAnimationConfig, layout),
                background: 'rgba(99, 102, 241, 0.28)',
                border: '1px solid rgba(99, 102, 241, 0.75)',
                borderRadius: 8,
                boxSizing: 'border-box',
              }}
            />
          );
        })}
      </div>
    );
  };

  const calendarCellStyle = (
    width: number,
    fontSize: number,
    textColor = '#ffffff',
    fillColor?: string,
    borderRadius?: number,
  ): CSSProperties => ({
    width,
    textAlign: 'center',
    fontSize,
    fontFamily: data?.calendar?.font,
    color: textColor,
    backgroundColor: fillColor || 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius,
  });

  return (
    <div className={`size_${data?.size}`} style={containerStyle}>
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      {hasAnimationFields
        ? animationConfigs.map((item: any, index: number) => {
            const category = resolveAnimationCategory(item, index);
            if (category === 0 || category === 2) {
              return renderLineOrStaticBlock(item, index);
            }
            return null;
          })
        : null}

      {data?.size === 1 && (
        <>
          {hasAnimationFields ? renderRotateBlock() : null}
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
                // backgroundColor: '#000',
                backgroundColor: data?.other?.backgroundColor || '#000000',
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
                backgroundColor: data?.other?.backgroundColor || '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9px',
                ...getTextStyle({
                  ...data.month,
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
          {hasAnimationFields ? renderRotateBlock() : null}
          <div
            style={{
              position: 'absolute',
              left: 16,
              top: 16,
              zIndex: 9,
              ...getTextStyle({
                ...data.time,
                textSize: 47,
                textHeight: 64,
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
              backgroundColor: data?.other?.backgroundColor || '#000000',
              opacity: data?.other?.alpha || 1,
            }} />
            <div
              style={{
                marginLeft: 4,
                ...getTextStyle({
                  ...data.month,
                }),
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
              backgroundColor: data?.other?.backgroundColor,
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
              {weekDates.map((item, index) => (
                <div
                  key={`d-${item}-${data.size}`}
                  style={calendarCellStyle(
                    17,
                    11,
                    index === 4 ? data?.calendar?.textColor : '#000000',
                    index === 4 ? data?.other?.backgroundColor : undefined,
                    index === 4 ? 8.5 : 0,
                  )}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {data?.size === 3 && (
        <>
          {hasAnimationFields ? renderRotateBlock() : null}
          <div
            style={{
              position: 'absolute',
              right: 16,
              top: 16,
              zIndex: 9,
              ...getTextStyle({
                ...data.time,
                textSize: 66,
                textHeight: 90,
                font: 'AvenirNext-Bold',
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
                textSize: 66,
                textHeight: 90,
                font: 'AvenirNext-Bold',
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
              backgroundColor: '#000',
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
              backgroundColor: data?.other?.backgroundColor,
              zIndex: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '18px',
              ...getTextStyle({
                ...data.month,
              }),
            }}
          >
            {monthText}
          </div>

          <div style={{ position: 'absolute', left: 18, top: 244, width: 294, zIndex: 9 }}>
            <div style={{
              display: 'flex',
              width: 294,
              height: 36,
              borderRadius: 18,
              justifyContent: 'space-between',
              backgroundColor: data?.other?.backgroundColor || '#000000',
            }}>
              {weekLabels.map((label, index) => (
                <div key={`w-lg-${label}-${index}`} style={calendarCellStyle(36, 18, '#000000')}>
                  {label}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', width: 294, height: 36, marginTop: 12, justifyContent: 'space-between' }}>
              {weekDates.map((item, index) => (
                <div
                  key={`d-lg-${item}`}
                  style={calendarCellStyle(
                    36,
                    16,
                    index === 4 ? '#fff' : '#111',
                    index === 4 ? data?.other?.backgroundColor : undefined,
                    index === 4 ? 18 : 0,
                  )}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}