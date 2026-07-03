import { useEffect, useMemo, useState } from 'react';
import { useEditorGetParentNodeData } from '../context';
import { getImageSize } from './util';
import './style.css';

interface TimeLayoutData {
  size?: 1 | 2 | 3;
  time?: {
    textSize?: number;
    font?: string;
    alpha?: number;
    textColor?: string,
    textHeight?: string,
  };
  day?: {
    textSize?: number;
    font?: string;
    alpha?: number;
    textColor?: string,
    textHeight?: string,
  };
  date?: {
    textSize?: number;
    font?: string;
    alpha?: number;
    textColor?: string,
    textHeight?: string,
  };
  source?: string;
  padding?: number;
  radius?: number;
  layoutType?: any;
}

export default function TimeLayout_1(props: any) {
  const data = props.data;
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const getParentNodeData = useEditorGetParentNodeData();
  const { textAlignment } = getParentNodeData(props.id) || {};

  if (!data) return null;

  useEffect(() => {
    if (!data.source) {
      setImageSize(null);
      return;
    }

    let disposed = false;
    void getImageSize(data.source)
      .then((size) => {
        if (disposed) return;
        setImageSize(size);
      })
      .catch(() => {
        if (disposed) return;
        setImageSize(null);
      });

    return () => {
      disposed = true;
    };
  }, [data.source]);

  const alignItems = useMemo(() => {
    if (textAlignment === 1) return 'flex-start';
    if (textAlignment === 2) return 'center';
    return 'flex-end';
  }, [textAlignment]);

  const getTextStyle = (textData?: TimeLayoutData['time']) => ({
    fontSize: textData?.textSize ?? 14,
    fontFamily: textData?.font,
    opacity: textData?.alpha ?? 1,
    color: textData?.textColor ?? '#111827',
    lineHeight: textData?.textHeight ? `${textData.textHeight}px` : 'normal',
    position: 'relative' as const,
    zIndex: 9,
    whiteSpace: 'nowrap',
  });

  const containerStyle = useMemo(() => {
    return {
      backgroundColor: '#ffffff',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems,
      justifyContent: 'center',
      borderRadius: `${data.radius ?? 0}px`,
      padding: textAlignment === 2 ? '0' : `0 ${data.padding ?? 0}px`,
      position: 'relative' as const,
    };
  }, [textAlignment, data])

  const imageStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: imageSize ? `${imageSize.width}px` : 'auto',
    height: imageSize ? `${imageSize.height}px` : 'auto',
    maxWidth: 'none',
    maxHeight: 'none',
    pointerEvents: 'none' as const,
  };

  return (
    <div className={`size_${data?.size}`} style={containerStyle}>
      {data.source ? (
        <img
          src={data.source}
          alt=""
          style={imageStyle}
        />
      ) : null}
      { data.time && (
        <span style={getTextStyle(data.time)}>
          { data?.layoutType == '0-1' ? '10:29 AM' : '10:29'}
        </span>
      )}
      {data.day && (
        <div style={{ ...getTextStyle(data.day), margin: `${(data.padding ?? 0) / 2}px 0` }}>
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