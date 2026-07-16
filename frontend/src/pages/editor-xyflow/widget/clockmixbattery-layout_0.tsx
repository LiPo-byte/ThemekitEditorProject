import { useMemo } from 'react';
import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
  useEditorGetParentNodeData,
} from '../context';

import './style.css';
import { Position } from '@xyflow/react';

export default function ClockMixBatteryLayout_0(props: any) {
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const getParentNodeData = useEditorGetParentNodeData();
  const parentData = getParentNodeData(props.id) || {};
  const { dialLargeClock, dialSmallClock, dotClock, hourClock, minuteClock  } = parentData;
  const data = props.data;

  if (!data) return null;
  const size = data.size;
  const batteryHeightSize: any = {1: 100, 2: 120, 3: 200};
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
        width: '12px',
        height: batteryHeightSize[size],
        borderRadius: '999px',
        backgroundColor: '#d1d5db',
        position: 'relative' as const,
        boxSizing: 'border-box' as const,
        overflow: 'hidden' as const,
      },
      fill: {
        position: 'absolute' as const,
        bottom: 0,
        width: '100%',
        height: `${batteryPercent}%`,
        borderRadius: '999px',
        backgroundColor: batteryFillColor,
        opacity: 1,
      },
      text: {
        position: 'absolute' as const,
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontSize: '7px',
        lineHeight: 1,
        fontWeight: 700,
        letterSpacing: '0.1px',
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
  return (
    <div
      className={`size_${data?.size ?? 1}`}
      style={{
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
      <div style={batteryStyle.wrap}>
        <div style={batteryStyle.body}>
          <div style={batteryStyle.fill} />
          <span style={batteryStyle.text}>{batteryStyle.percentText}</span>
        </div>
      </div>
      { size === 1 && (
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 2,
        }}>
          <img style={clockStyle} src={dialSmallClockSource} alt="" />
          <img style={clockStyle} src={dotClockSource} alt="" />
          <img style={{
            ...clockStyle, 
            transform: 'rotate(30deg)',
            transformOrigin: 'center'
          }} src={hourClockSource} alt="" />
          <img style={{
            ...clockStyle,
            transform: 'rotate(-30deg)',
            transformOrigin: 'center'
          }} src={minuteClockSource} alt="" />
        </div>
      )}
      { size === 2 && (
        <div style={{
          height: 120,
          width: 120,
          position: 'relative',
          zIndex: 2,
        }}>
          <img style={{
            ...clockStyle,
            height: 120,
          }} src={dialLargeClockSource} alt="" />
          <img style={{
            ...clockStyle,
            height: 120,
          }} src={dotClockSource} alt="" />
          <img style={{
            ...clockStyle,
            transform: 'rotate(30deg)',
            transformOrigin: 'center',
            height: 120,
          }} src={hourClockSource} alt="" />
          <img style={{
            ...clockStyle,
            transform: 'rotate(-30deg)',
            transformOrigin: 'center',
            height: 120,
          }} src={minuteClockSource} alt="" />
        </div>
      )}
      { size === 3 && (
        <div style={{
          height: 200,
          width: 200,
          position: 'relative',
          zIndex: 2,
        }}>
          <img style={{
            ...clockStyle,
            height: 200,
          }} src={dialLargeClockSource} alt="" />
          <img style={{
            ...clockStyle,
            height: 200,
          }} src={dotClockSource} alt="" />
          <img style={{
            ...clockStyle,
            transform: 'rotate(30deg)',
            transformOrigin: 'center',
            height: 200,
          }} src={hourClockSource} alt="" />
          <img style={{
            ...clockStyle,
            transform: 'rotate(-30deg)',
            transformOrigin: 'center',
            height: 200,
          }} src={minuteClockSource} alt="" />
        </div>
      )}
    </div>
  );
}
