import type { CSSProperties } from 'react';
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

const rowStyle = (extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  zIndex: 2,
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  ...extra,
});

const circleStyle = (
  width: number,
  height: number,
  background: string,
  extra?: CSSProperties,
): CSSProperties => ({
  width,
  height,
  borderRadius: '100%',
  background,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2,
  boxShadow: '0 2px 4px rgba(187, 187, 187, 0.5)',
  ...extra,
});

export default function LauncherLayout_0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  if (!data) return null;
  const size = data.size;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const appLinks = Array.isArray(data.appLinks) ? data.appLinks : [];
  const title = data.title;
  const appLinksSource = Array.isArray(data.appLinksSource) ? data.appLinksSource : []

  const circle = (
    displayIndex: number,
    width: number,
    height: number,
    background: string,
    extra?: CSSProperties,
  ) => {
    const source = appLinksSource[displayIndex - 1]?.source;
    return (
      <div style={circleStyle(width, height, source ? 'transparent' : background, extra)}>
        {source ? (
          <img
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '100%' }}
            src={source}
            alt=""
          />
        ) : (
          displayIndex
        )}
      </div>
    );
  };

  return (
    <div
      className={`size_${data?.size}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor: '#ffffff',
        borderRadius: `${data.radius ?? 0}px`,
        boxSizing: 'border-box',
        overflow: isCropEditingNode ? 'visible' : 'hidden',
        display: 'flex',
        position: 'relative',
      }}
    >
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      {size === 1 && (
        circle(1, 67, 67, '#f6efe9', { position: 'absolute', top: 25, left: 20 })
      )}
      {size === 2 && (
        <>
          {/* 顶部 */}
          <div style={rowStyle({ top: 10, height: 42, alignItems: 'flex-start' })}>
            {circle(1, 32, 32, '#989694', { marginTop: 8 })}
            {circle(2, 42, 42, '#f6efe9', { margin: '0 9px 0 12px' })}
            {circle(3, 42, 42, '#f6efe9', { margin: '0 12px 0 9px' })}
            {circle(4, 32, 32, '#989694', { marginTop: 8 })}
          </div>
          {/* 中间 */}
          <div style={rowStyle({ top: 0, bottom: 0, height: 42, alignItems: 'center', margin: 'auto' })}>
            {circle(5, 32, 32, '#989694')}
            {circle(6, 42, 42, '#f6efe9', { margin: '0 11px' })}
            {circle(7, 50, 50, '#f7f5f4')}
            {circle(8, 42, 42, '#f6efe9', { margin: '0 11px' })}
            {circle(9, 32, 32, '#989694')}
          </div>
          {/* 底部 */}
          <div style={rowStyle({ bottom: 10, height: 42, alignItems: 'flex-start' })}>
            {circle(10, 32, 32, '#989694', { marginBottom: 8 })}
            {circle(11, 42, 42, '#f6efe9', { margin: '0 9px 0 12px' })}
            {circle(12, 42, 42, '#f6efe9', { margin: '0 12px 0 9px' })}
            {circle(13, 32, 32, '#989694', { marginBottom: 8 })}
          </div>
        </>
      )}
      {size === 3 && (
        <>
          {/* 一层 */}
          <div style={rowStyle({ top: 41, alignItems: 'flex-start' })}>
            {circle(1, 36, 36, '#989694', { marginTop: 8 })}
            {circle(2, 48, 47, '#e5b993', { margin: '0 18px' })}
            {circle(3, 36, 36, '#989694', { marginTop: 8 })}
          </div>
          {/* 二层 */}
          <div style={rowStyle({ top: 88, alignItems: 'flex-start' })}>
            {circle(4, 40, 40, '#ebd1b7', { marginTop: 11 })}
            {circle(5, 56, 56, '#f6efe9', { margin: '0 17px 0 11px' })}
            {circle(6, 56, 56, '#f6efe9', { margin: '0 11px 0 0' })}
            {circle(7, 40, 40, '#ebd1b7', { marginTop: 11 })}
          </div>
          {/* 三层 */}
          <div style={rowStyle({ top: 0, bottom: 0, alignItems: 'center', margin: 'auto' })}>
            {circle(8, 42, 42, '#e88e34')}
            {circle(9, 56, 56, '#f6efe9', { margin: '0 11px' })}
            {circle(10, 60, 60, '#f7f5f4')}
            {circle(11, 56, 56, '#f6efe9', { margin: '0 11px' })}
            {circle(12, 42, 42, '#e88e34')}
          </div>
          {/* 四层 */}
          <div style={rowStyle({ bottom: 88, alignItems: 'flex-start' })}>
            {circle(13, 40, 40, '#ebd1b7', { marginBottom: 11 })}
            {circle(14, 56, 56, '#f6efe9', { margin: '0 17px 0 11px' })}
            {circle(15, 56, 56, '#f6efe9', { margin: '0 11px 0 0' })}
            {circle(16, 40, 40, '#ebd1b7', { marginBottom: 11 })}
          </div>
          {/* 五层 */}
          <div style={rowStyle({ bottom: 41, height: 42, alignItems: 'flex-start' })}>
            {circle(17, 36, 36, '#989694', { marginBottom: 8 })}
            {circle(18, 48, 47, '#e5b993', { margin: '0 18px' })}
            {circle(19, 36, 36, '#989694', { marginBottom: 8 })}
          </div>
        </>
      )}
    </div>
  );
}
