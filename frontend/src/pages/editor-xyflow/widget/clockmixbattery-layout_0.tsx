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
    const batteryWidth = batteryWidthSize[size];
    const batteryHeight = batteryHeightSize[size];
    // 竖向细条电池，百分比逐位竖排；数字从 mask 里扣掉，让电池整体镂空透出底图
    const digits = `${batteryPercent}`.split('');
    const digitFontSize = Math.max(6, Math.round(batteryWidth * 0.44));
    const digitStep = digitFontSize * 1.05;
    const digitBottom = 10;
    const digitNodes = digits
      .map((digit, index) => {
        const baseline =
          batteryHeight - digitBottom - (digits.length - 1 - index) * digitStep;
        return `<text x="${batteryWidth / 2}" y="${baseline}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="${digitFontSize}" font-weight="700" fill="#000">${digit}</text>`;
      })
      .join('');
    const cutoutSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${batteryWidth}" height="${batteryHeight}" viewBox="0 0 ${batteryWidth} ${batteryHeight}"><mask id="battery-percent-cutout"><rect width="${batteryWidth}" height="${batteryHeight}" fill="#fff"/>${digitNodes}</mask><rect width="${batteryWidth}" height="${batteryHeight}" fill="#fff" mask="url(#battery-percent-cutout)"/></svg>`;
    const cutoutMask = `url("data:image/svg+xml;utf8,${encodeURIComponent(cutoutSvg)}")`;
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
        width: batteryWidth,
        height: batteryHeight,
        borderRadius: '999px',
        backgroundColor: resolveHexColorWithAlpha(data?.battery?.containerColor, data?.battery?.alpha),
        position: 'relative' as const,
        boxSizing: 'border-box' as const,
        overflow: 'hidden' as const,
        WebkitMaskImage: cutoutMask,
        maskImage: cutoutMask,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
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
