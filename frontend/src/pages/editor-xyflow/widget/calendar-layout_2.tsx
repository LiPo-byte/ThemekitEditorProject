import type { CSSProperties } from 'react';
import CropEditableImage from '../components/CropEditableImage';
import './style.css';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import {
  resolveWidgetFontFamily,
  isAndroidWidgetNode,
  resolveHexColorWithAlpha,
} from './util';

const WEEK_LABELS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAME = 'October';

export default function CalendarLayout_0(props: any) {
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const data = props.data;
  const scale = props.scale || 1;
  const firstImageAnimation = data?.firstImageAnimation;
  const secondImageAnimation = data?.secondImageAnimation;
  const size = Number(data?.size ?? 1) as 1 | 2 | 3;
  // const daySize = { 1: 17, 2: 23, 3: 31 };
  const paddingSize = { 1: 0, 2: 34, 3: 19 };
  // const gapSize = {1: '0', 2: '0 10px', 3: '0 12px'};
  // const monthTop = { 1: 35, 2: 23, 3: 100 };
  // const weekMarginBottom = { 1: 0, 2: 0, 3: 31 };
  // const dayPos = { 1: [15, 0, 0], 2: [], 3: [28, 0, 19] }
  if (!data) return null;
  const isAndroid = isAndroidWidgetNode(props.parentId);
  // 28天
  const days = [];
  for (let index = -1; index <= 28; index++) {
    days.push(index);
  }
  const hasAnimationFields =
    Object.prototype.hasOwnProperty.call(data, 'firstImageAnimation')
    || Object.prototype.hasOwnProperty.call(data, 'secondImageAnimation');
  const animationConfigs = [firstImageAnimation, secondImageAnimation].filter(Boolean);

  const renderDayCell = (i: number, cellSize: number) => {
    const fontSize = data.calendar.textSize;
    const fontFamily = resolveWidgetFontFamily(props.parentId, data.calendar.font);
    const color = i === 17 ? data.calendar.textColor_now : (
      i < 17 ? data.calendar.textColor_past : data.calendar.textColor_future
    );

    // 当天：Android 按原色填充；非 Android 用 SVG mask 把数字镂空，透出背景图
    if (i === 17 && !isAndroid) {
      const maskId = `cal2-day-mask-${props.id}-${cellSize}-${i}`;
      return (
        <div
          key={i}
          style={{
            width: cellSize,
            height: cellSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={cellSize} height={cellSize} style={{ display: 'block' }}>
            <defs>
              <mask id={maskId}>
                <rect width="100%" height="100%" fill="white" />
                <text
                  x="50%"
                  y="50%"
                  dominantBaseline="central"
                  textAnchor="middle"
                  fill="black"
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                >
                  {i}
                </text>
              </mask>
            </defs>
            <circle
              cx="50%"
              cy="50%"
              r="50%"
              fill={data.calendar.bgColor_now}
              mask={`url(#${maskId})`}
            />
          </svg>
        </div>
      );
    }

    return (
      <div
        key={i}
        style={{
          width: cellSize,
          height: cellSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          fontFamily,
          backgroundColor: i === 17 ? data.calendar.bgColor_now : 'none',
          borderRadius: i === 17 ? '100%' : '0',
          color: color,
          opacity: i < 17 ? 0.6 : 1,
        }}
      >
        {i <= 0 ? '' : i}
      </div>
    );
  };

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
      zIndex: 2,
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

  return (
    <div
      className={`size_${size}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor: '#ffffff',
        overflow: isCropEditingNode ? 'visible' : 'hidden',
        borderRadius: `${data.radius ?? 0}px`,
        boxSizing: 'border-box',
        padding: `0 ${paddingSize[size]}px`,
        position: 'relative',
      }}
    >
      {hasAnimationFields
        ? animationConfigs.map((item: any, index: number) => renderAnimationLayer(item, index))
        : null}
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      { size === 3 ? <>
          <div
            style={{
              position: 'absolute',
              top: 28,
              right: 19,
              fontFamily: resolveWidgetFontFamily(props.parentId, data?.month?.font),
              fontSize: data?.month?.textSize,
              opacity: data?.month?.alpha || 0.6,
              height: data?.month?.textHeight,
              color: data?.month?.textColor,
              zIndex: 2,
            }}
          >
              12
          </div>
          <div
            style={{
              position: 'absolute',
              top: 88,
              right: 58,
              fontFamily: resolveWidgetFontFamily(props.parentId, data?.year?.font),
              fontSize: data?.year?.textSize,
              opacity: data?.year?.alpha,
              height: data?.year?.textHeight,
              color: data?.year?.textColor,
              zIndex: 2,
            }}
          >
            2026
          </div>
        </>
      : null }
      { size === 1 ? (
        <div
          style={{
            position: 'absolute',
            top: 15,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'inline-flex',
            alignItems: 'flex-start',
            lineHeight: 1,
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontFamily: resolveWidgetFontFamily(props.parentId, data?.month?.font),
              fontSize: data?.month?.textSize,
              opacity: data?.month?.alpha ?? 1,
              height: data?.month?.textHeight,
              color: data?.month?.textColor,
              zIndex: 3,
              transform: 'translate(10px, 10px)',
            }}
          >
            Oct
          </span>
          <span
            style={{
              fontFamily: resolveWidgetFontFamily(props.parentId, data?.day?.font),
              fontSize: data?.day?.textSize,
              height: data?.day?.textHeight,
              color: data?.other?.backgroundColor,
              opacity: data?.other?.alpha ?? 1,
              position: 'relative',
              zIndex: 2,
              marginLeft: '-8px',
              transform: 'translateY(-2px)',
            }}
          >
            12
          </span>
        </div>
      ) : null }
      { size === 1 ? (
        <span style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 15,
          fontFamily: resolveWidgetFontFamily(props.parentId, data?.month?.font),
          fontSize: data?.month?.textSize,
          opacity: data?.month?.alpha ?? 1,
          height: data?.month?.textHeight,
          color: data?.month?.textColor,
          textAlign: 'center',
          zIndex: 2,
        }}>Wednesday</span>
      ) : null }
      {
        size === 2 ? (
          <div
          style={{
            position: 'absolute',
            width: 120,
            right: 34,
            top: 20,
            zIndex: 2,
          }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0,
                marginBottom: 12,
                background: resolveHexColorWithAlpha(data?.other?.backgroundColor, data?.other?.alpha) || '#000000',
                borderRadius: 10,
              }}
            >
            {WEEK_LABELS_SHORT.map((i, index) => {
                return <div
                  key={index}
                  style={{
                    width: 17,
                    height: 17,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: data.calendar.textSize,
                    color: data.calendar.textColor_capital_day || '#000000',
                    fontFamily: resolveWidgetFontFamily(props.parentId, data.calendar.font),
                  }}>{i}</div>
                })}
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0,
                zIndex: 2,
              }}
            >
              {days.map(i => renderDayCell(i, 17))}
            </div>
          </div>
        ) : null
      }
      {
        size === 3 ? (
          <div
          style={{
            position: 'absolute',
            right: 19,
            left: 19,
            bottom: 19,
            zIndex: 2,
          }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                marginBottom: 12,
                background: resolveHexColorWithAlpha(data?.other?.backgroundColor, data?.other?.alpha) || '#000000',
                borderRadius: 16,
                gap: '0 12px',
              }}
            >
            {WEEK_LABELS_SHORT.map((i, index) => {
                return <div
                  key={index}
                  style={{
                    width: 31,
                    height: 31,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: data.calendar.textSize,
                    color: data.calendar.textColor_capital_day || '#000000',
                    fontFamily: resolveWidgetFontFamily(props.parentId, data.calendar.font),
                  }}>{i}</div>
                })}
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0 12px',
                zIndex: 2,
              }}
            >
              {days.map(i => renderDayCell(i, 31))}
            </div>
          </div>
        ) : null
      }
    </div>
  );
}
