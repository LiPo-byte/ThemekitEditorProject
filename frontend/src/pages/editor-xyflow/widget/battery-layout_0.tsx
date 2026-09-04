import { useEffect, useMemo, useState } from 'react';
import { resolveWidgetFontFamily } from './util';
import { useWidgetCaptureFrameIndex } from '../util/widgetCaptureFrame';
import './style.css';

const getTextStyle = (parentId?: string, textData?: any) => ({
  fontSize: textData?.textSize ?? 14,
  fontFamily: resolveWidgetFontFamily(parentId, textData?.font),
  opacity: textData?.alpha ?? 1,
  color: textData?.textColor ?? '#111827',
  lineHeight: 1,
  // height: textData?.textHeight ? `${textData.textHeight}px` : 'auto',
  height: 'auto',
  whiteSpace: 'nowrap' as const,
});

export default function BatteryLayout_0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  if (!data) return null;

  const batterySources = useMemo(() => {
    const keys = ['battery_20', 'battery_40', 'battery_60', 'battery_80', 'battery_100'];
    return keys
      .map((key) => ({
        key,
        ...(data?.[key] ?? {}),
      }))
      .filter((item) => item?.source);
  }, [data]);

  const [activeIndex, setActiveIndex] = useState(0);
  const captureFrameIndex = useWidgetCaptureFrameIndex();

  const resolveBatteryPercent = (key?: string) => {
    const match = key?.match(/(\d+)/);
    const value = match ? Number(match[1]) : 100;
    return Number.isFinite(value) ? value : 100;
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [batterySources]);

  useEffect(() => {
    // 导出截图期间由导出流程逐帧指定，停掉自身轮播避免两个节奏互相干扰
    if (captureFrameIndex !== null) return undefined;
    if (batterySources.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % batterySources.length);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [batterySources, captureFrameIndex]);

  const effectiveIndex =
    captureFrameIndex !== null && batterySources.length
      ? captureFrameIndex % batterySources.length
      : activeIndex;
  const activeBattery = batterySources[effectiveIndex];
  const textpos = (textAlign: number, padding: number): any => {
    let key1 = data.size === 2 ? 'top' : 'left';
    let key2 = data.size === 2 ? 'bottom' : 'right';
    if (textAlign === 1) {
      return {
        [key1]: padding,
      }
    }
    if (textAlign === 3) {
      return {
        [key2]: padding,
      }
    }
    return {
      [key1]: 0,
      [key2]: 0,
    }
  }

  return (
    <div className={`size_${data?.size}`} style={{
      transform: `scale(${scale}, ${scale})`,
      transformOrigin: '0 0',
      backgroundColor: '#ffffff',
      overflow: 'hidden',
      borderRadius: `${data.radius ?? 0}px`,
      boxSizing: 'border-box',
      position: 'relative',
    }}>
      {batterySources.map((item, index) => (
        <img
          key={item.key}
          src={item.source}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: index === effectiveIndex ? 1 : 0,
          }}
        />
      ))}
      {
        data.size === 2 ? (
          // size 2：数字固定贴右边，textAlignment 控制的是上/中/下
          <div
            style={{
              position: 'absolute',
              ...textpos(data.textAlignment, 0),
              right: 0,
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                ...getTextStyle(props.parentId, data.battery),
                margin: `${data.battery.intCommonField}px 0`,
                marginRight: `${data.battery.padding}px`,
                color: activeBattery?.key !== 'battery_20' ? data.battery.textColor : '#ff0000',
              }}
            >
              {resolveBatteryPercent(activeBattery?.key)}%
            </div>
          </div>
        ) : (
          <div
            style={{
              ...getTextStyle(props.parentId, data.battery),
              position: 'absolute',
              ...textpos(data.textAlignment, data.battery.padding || 0),
              bottom: 20,
              textAlign: 'center',
              pointerEvents: 'none',
              color: activeBattery?.key !== 'battery_20' ? data.battery.textColor : "#ff0000",
            }}
          >
            {resolveBatteryPercent(activeBattery?.key)}%
          </div>
        )
      }
    </div>
  );
}