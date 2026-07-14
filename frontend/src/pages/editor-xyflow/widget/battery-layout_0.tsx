import { useEffect, useMemo, useState } from 'react';
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
export default function BatteryLayout_0(props: any) {
  const data = props.data;
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

  const resolveBatteryPercent = (key?: string) => {
    const match = key?.match(/(\d+)/);
    const value = match ? Number(match[1]) : 100;
    return Number.isFinite(value) ? value : 100;
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [batterySources]);

  useEffect(() => {
    if (batterySources.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % batterySources.length);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [batterySources]);

  const activeBattery = batterySources[activeIndex];
  const textpos = (textAlign: number): any => {
    if (textAlign === 1) {
      return {
        left: 0,
        right: '50%',
      }
    }
    if (textAlign === 3) {
      return {
        left: '50%',
        right: 0,
      }
    }
    return {
      left: 0,
      right: 0,
    }
  }

  return (
    <div className={`size_${data?.size}`} style={{
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
            opacity: index === activeIndex ? 1 : 0,
          }}
        />
      ))}
      <div
        style={{
          ...getTextStyle(props.parentId, data.battery),
          position: 'absolute',
          ...textpos(data.textAlignment),
          bottom: 20,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {resolveBatteryPercent(activeBattery?.key)}%
      </div>
    </div>
  );
}