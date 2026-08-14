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


export default function TimeMixBatteryLayout0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  if (!data) return null;
  const size = data.size;
  const getTextStyle = (textData?: any) => ({
    fontSize: textData?.textSize ?? 14,
    fontFamily: resolveWidgetFontFamily(props.parentId, textData?.font),
    opacity: textData?.alpha ?? 1,
    color: textData?.textColor ?? '#111827',
    // lineHeight: textData?.textHeight ? `${textData.textHeight}px` : 'normal',
    lineHeight: 1,
    height: textData?.textHeight ? `${textData.textHeight}px` : undefined,
    zIndex: 9,
    // position: 'relative' as const,
    whiteSpace: 'nowrap',
    marginTop: (textData?.topSpacing || 0) + 'px',
    marginBottom: (textData?.bottomSpacing || 0) + 'px',
  });
  // const getTimeStyle:any = (textData?: any) => ({
  //   textAlign:
  //     textData.textAlignment === 1 ? 'left' : (data.textAlignment === 2 ? 'center' : 'right')
  // });
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
        left: 16,
        transform: 'translate(0, -50%)',
        // left: `${data.padding ?? 0}px`,
        display: 'flex',
        alignItems: 'center',
        zIndex: 9,
      },
      body: {
        width: batteryWidthSize[size],
        height: batteryHeightSize[size],
        borderRadius: '999px',
        backgroundColor: '#d8d8d8',
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

  const paddSize: any = {1: 30, 2: 90, 3: 40};
  const containerStyle = useMemo(() => {
    return {
      backgroundColor: '#ffffff',
      overflow: isCropEditingNode ? 'visible' : 'hidden',
      borderRadius: `${data.radius ?? 0}px`,
      position: 'relative' as const,
      paddingLeft: `${paddSize[size] ?? 0}px`,
      paddingRight: `${paddSize[size] ?? 0}px`,
      paddingTop: '16px',
      paddingBottom: data.size === 3 ? '32px' : '16px',
    };
  }, [data, isCropEditingNode])

  const timeElement = useMemo(() => {
    return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: `0 ${data.padding}`,
        }}>
            <div style={{
                width: '100%',
                ...getTextStyle(data.time),
                textAlign: data.time.topTextAlignment === 1 ? 'left' : (data.time.topTextAlignment === 2 ? 'center' : 'right')
            }}>
                10
            </div>
            <div style={{
                width: '100%',
                ...getTextStyle(data.time),
                textAlign: data.time.bottomTextAlignment === 1 ? 'left' : (data.time.bottomTextAlignment === 2 ? 'center' : 'right')
            }}>
                09
            </div>
        </div>
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
          <span style={batteryStyle.text}>
            <span style={{ marginBottom: 5 }}>9</span>
            <span>8</span>
          </span>
        </div>
      </div>
      {(size === 2 || size === 3) && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          ...getTextStyle(data.weekday || data.day),
          zIndex: 999,
        }}>
          Wednesday
        </div>
      )}
      { data.time && timeElement}
    </div>
  );
}