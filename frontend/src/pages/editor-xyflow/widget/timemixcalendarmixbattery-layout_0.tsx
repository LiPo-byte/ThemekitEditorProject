import { useMemo } from 'react';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
  useEditorGetParentNodeData,
  // type CropProps,
} from '../context';
import CropEditableImage from '../components/CropEditableImage';
import { resolveWidgetFontFamily } from './util';
import './style.css';


export default function TimeMixCalendarMixBatteryLayout_0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  if (!data) return null;
  const getTextStyle = (textData?: any) => ({
    fontSize: textData?.textSize ?? 14,
    fontFamily: resolveWidgetFontFamily(props.parentId, textData?.font),
    opacity: textData?.alpha ?? 1,
    color: textData?.textColor ?? '#111827',
    // lineHeight: textData?.textHeight ? `${textData.textHeight}px` : 'normal',
    lineHeight: 1,
    // height: textData?.textHeight + 'px',
    zIndex: 9,
    position: 'relative' as const,
    whiteSpace: 'nowrap',
    marginTop: (textData?.topSpacing || 0) + 'px',
    marginBottom: (textData?.bottomSpacing || 0) + 'px',
  });
  const getTimeStyle:any = (textData?: any) => ({
    textAlign:
      textData.textAlignment === 1 ? 'left' : (data.time.textAlignment === 2 ? 'center' : 'right')
  });
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
        top: '16px',
        left: `${data.padding ?? 0}px`,
        display: 'flex',
        alignItems: 'center',
        zIndex: 9,
      },
      body: {
        width: '30px',
        height: '12px',
        borderRadius: '3px',
        // backgroundColor: batteryColor,
        position: 'relative' as const,
        boxSizing: 'border-box' as const,
        overflow: 'visible' as const,
      },
      fill: {
        width: `${batteryPercent}%`,
        height: '100%',
        borderRadius: '3px',
        backgroundColor: batteryFillColor,
        opacity: 1,
      },
      text: {
        position: 'absolute' as const,
        inset: 0,
        display: 'flex',
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
      cap: {
        position: 'absolute' as const,
        right: '-1px',
        top: '50%',
        transform: 'translate(30%, -50%)',
        width: '3px',
        height: '6px',
        borderRadius: '2px',
        backgroundColor: batteryFillColor,
      },
      percentText: `${batteryPercent}`,
    };
  }, [data]);

  const containerStyle = useMemo(() => {
    return {
      backgroundColor: '#ffffff',
      overflow: isCropEditingNode ? 'visible' : 'hidden',
      borderRadius: `${data.radius ?? 0}px`,
      position: 'relative' as const,
      paddingLeft: `${data.padding ?? 0}px`,
      paddingRight: `${data.padding ?? 0}px`,
      paddingTop: '16px',
      paddingBottom: data.size === 3 ? '32px' : '16px',
    };
  }, [data, isCropEditingNode])

  const timeElement = useMemo(() => {
    return (
        <>
            <div style={{
                ...getTextStyle(data.time),
                ...getTimeStyle(data.time),
            }}>
                10 <br />
                09
            </div>
        </>
    )
  }, [data])

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
      <div style={batteryStyle.wrap}>
        <div style={batteryStyle.body}>
          <div style={batteryStyle.fill} />
          <span style={batteryStyle.text}>{batteryStyle.percentText}</span>
          <div style={batteryStyle.cap} />
        </div>
      </div>
      { data.time && timeElement}
      {data.day && (
        <div style={{ ...getTextStyle(data.day) }}>
          Wednesday
        </div>
      )}
      {data.date && (
        <div style={getTextStyle(data.date)}>
          March 23
        </div>
      )}
    </div>
  );
}