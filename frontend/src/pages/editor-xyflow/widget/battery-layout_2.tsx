import { type CSSProperties } from 'react';
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
export default function BatteryLayout_2(props: any) {
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const data = props.data;
  if (!data) return null;
  const size = data.size;

  const firstImageAnimation = data?.firstImageAnimation;
  const secondImageAnimation = data?.secondImageAnimation;
  const thirdImageAnimation = data?.thirdImageAnimation;
  const fourthImageAnimation = data?.fourthImageAnimation;
  const hasAnimationFields =
    Object.prototype.hasOwnProperty.call(data, 'firstImageAnimation')
    || Object.prototype.hasOwnProperty.call(data, 'secondImageAnimation')
    || Object.prototype.hasOwnProperty.call(data, 'thirdImageAnimation')
    || Object.prototype.hasOwnProperty.call(data, 'fourthImageAnimation');
  const animationConfigs = [
    firstImageAnimation,
    secondImageAnimation,
    thirdImageAnimation,
    fourthImageAnimation,
  ].filter(Boolean);

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
      // baseStyle.transformOrigin = '50% 50%';
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
    <div className={`size_${data?.size}`} style={{
      backgroundColor: '#ffffff',
      overflow: isCropEditingNode ? 'visible' : 'hidden',
      borderRadius: `${data.radius ?? 0}px`,
      boxSizing: 'border-box',
      position: 'relative',
      // padding: '20px 16px'
    }}>
      {hasAnimationFields
        ? animationConfigs.map((item: any, index: number) => renderAnimationLayer(item, index))
        : null}
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      {size === 3 && (
        <div style={{
          display: 'flex',
          position: 'relative',
          zIndex: 9,
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            ...getTextStyle(props.parentId, data.title),
            marginBottom: 113,
          }}>
            {data?.title.content}
          </div>
          <div
            style={{
              ...getTextStyle(props.parentId, data.battery),
            }}
          >
            100%
          </div>
        </div>
      )}
      {size === 2 && (
        <div style={{
          display: 'flex',
          position: 'relative',
          marginLeft: '50%',
          marginRight: 30,
          zIndex: 9,
          flexDirection: 'column',
          // width: '50%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            ...getTextStyle(props.parentId, data.title),
            marginBottom: 5,
            width: '100%',
            textAlign: 'right',
          }}>
            {data?.title.content}
          </div>
          <div
            style={{
              ...getTextStyle(props.parentId, data.battery),
            }}
          >
            100%
          </div>
        </div>
      )}
      {size === 1 && (
        <div style={{
          display: 'flex',
          position: 'relative',
          zIndex: 9,
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            ...getTextStyle(props.parentId, data.title),
            marginBottom: 42,
          }}>
            {data?.title.content}
          </div>
          <div
            style={{
              ...getTextStyle(props.parentId, data.battery),
            }}
          >
            100%
          </div>
        </div>
      )}
    </div>
  );
}