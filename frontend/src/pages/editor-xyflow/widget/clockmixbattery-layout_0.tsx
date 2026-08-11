import { useMemo } from 'react';
import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
  useEditorGetParentNodeData,
} from '../context';
import { resolveHexColorWithAlpha } from './util';
import './style.css';

export default function ClockMixBatteryLayout_0(props: any) {
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const getParentNodeData = useEditorGetParentNodeData();
  const parentData = getParentNodeData(props.id) ?? props.parentData ?? {};
  const { dialLargeClock, dialSmallClock, dotClock, hourClock, minuteClock  } = parentData;
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;
  const size = data.size;
  const batteryHeightSize: any = {1:100, 2: 120, 3: 200};
  const batteryWidthSize: any = {1:10, 2: 16, 3: 26};
  const batteryStyle = useMemo(() => {
    const batteryColor = data?.battery?.textColor ?? '#111827';
    const batteryFillColor = data?.battery?.backgroundColor ?? batteryColor;
    const batteryPercentValue = Number.isFinite(Number(data?.battery?.percent))
      ? Number(data.battery.percent)
      : 98;
    const batteryPercent = Math.max(0, Math.min(100, Math.round(batteryPercentValue)));
    return {
      wrap: {
        position: 'absolute' as const,
        top: '50%',
        left: 20,
        transform: 'translate(-50%, -50%)',
        // left: `${data.padding ?? 0}px`,
        display: 'flex',
        alignItems: 'center',
        zIndex: 9,
      },
      body: {
        width: batteryWidthSize[size],
        height: batteryHeightSize[size],
        borderRadius: '999px',
        backgroundColor: resolveHexColorWithAlpha(data?.battery?.backgroundColor, data?.battery?.alpha),
        position: 'relative' as const,
        boxSizing: 'border-box' as const,
        overflow: 'hidden' as const,
      },
      fill: {
        position: 'absolute' as const,
        bottom: 0,
        width: '100%',
        height: '90%',
        borderRadius: '999px',
        backgroundColor: batteryFillColor,
        opacity: 1,
      },
      text: {
        position: 'absolute' as const,
        left: 0,
        right: 0,
        bottom: 10,
        display: 'flex',
        // 电池是竖向细条，百分比数字逐位竖排
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        color: batteryColor,
        fontSize: '7px',
        lineHeight: 1,
        fontWeight: 700,
        letterSpacing: '0.1px',
        textShadow: '0 1px 1px rgba(0, 0, 0, 0.35)',
        pointerEvents: 'none' as const,
      },
      percentText: `${batteryPercent}`,
    };
  }, [data]);
  const dialLargeClockSource = dialLargeClock?.source ?? '';
  const dialSmallClockSource = dialSmallClock?.source ?? '';
  const dotClockSource = dotClock?.source ?? '';
  const hourClockSource = hourClock?.source ?? '';
  const minuteClockSource = minuteClock?.source ?? '';
  const clockStyle: any = {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
  }
  // 空 src 会被浏览器解析成当前页面地址并重新拉一次整页，所以没上传图时直接不渲染
  const renderClockImage = (source: string, style: any) =>
    source ? <img style={style} src={source} alt="" /> : null;
  return (
    <div
      className={`size_${data?.size ?? 1}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor: '#ffffff',
        overflow: isCropEditingNode ? 'visible' : 'hidden',
        borderRadius: `${data.radius ?? 0}px`,
        position: 'relative',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      {size !== 1 && (
        <div style={batteryStyle.wrap}>
          <div style={batteryStyle.body}>
            <div style={batteryStyle.fill} />
            <span style={batteryStyle.text}>{batteryStyle.percentText}</span>
          </div>
        </div>
      )}
      { size === 1 && (
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 2,
        }}>
          {renderClockImage(dialSmallClockSource, clockStyle)}
          {renderClockImage(dotClockSource, clockStyle)}
          {renderClockImage(hourClockSource, {
            ...clockStyle, 
            transform: 'rotate(30deg)',
            transformOrigin: 'center'
          })}
          {renderClockImage(minuteClockSource, {
            ...clockStyle,
            transform: 'rotate(-30deg)',
            transformOrigin: 'center'
          })}
        </div>
      )}
      { size === 2 && (
        <div style={{
          height: 120,
          width: 120,
          position: 'relative',
          zIndex: 2,
        }}>
          {renderClockImage(dialLargeClockSource, {
            ...clockStyle,
            height: 120,
          })}
          {renderClockImage(dotClockSource, {
            ...clockStyle,
            height: 120,
          })}
          {renderClockImage(hourClockSource, {
            ...clockStyle,
            transform: 'rotate(30deg)',
            transformOrigin: 'center',
            height: 120,
          })}
          {renderClockImage(minuteClockSource, {
            ...clockStyle,
            transform: 'rotate(-30deg)',
            transformOrigin: 'center',
            height: 120,
          })}
        </div>
      )}
      { size === 3 && (
        <div style={{
          height: 200,
          width: 200,
          position: 'relative',
          zIndex: 2,
        }}>
          {renderClockImage(dialLargeClockSource, {
            ...clockStyle,
            height: 200,
          })}
          {renderClockImage(dotClockSource, {
            ...clockStyle,
            height: 200,
          })}
          {renderClockImage(hourClockSource, {
            ...clockStyle,
            transform: 'rotate(30deg)',
            transformOrigin: 'center',
            height: 200,
          })}
          {renderClockImage(minuteClockSource, {
            ...clockStyle,
            transform: 'rotate(-30deg)',
            transformOrigin: 'center',
            height: 200,
          })}
        </div>
      )}
    </div>
  );
}
