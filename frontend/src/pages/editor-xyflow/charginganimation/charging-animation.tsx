import { PAGView, types } from 'libpag-lite';
import React, { useEffect, useRef, useState } from 'react';
import { PictureOutlined } from '@ant-design/icons';

const DEFAULT_WIDTH = 886;
const DEFAULT_HEIGHT = 1920;

const mediaStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'contain' as const,
  display: 'block',
};

/** pag 从 url 拉 buffer 交给 libpag；换源或卸载时 destroy，避免 WebGL 泄漏 */
const PagMedia: React.FC<{ source: string }> = ({ source }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let view: ReturnType<typeof PAGView.init> | null = null;
    setFailed(false);
    void (async () => {
      try {
        const response = await fetch(source);
        if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
        const buffer = await response.arrayBuffer();
        if (!alive || !canvasRef.current) return;
        view = PAGView.init(buffer, canvasRef.current, {
          renderingMode: types.RenderingMode.WebGL,
        });
        view.setRepeatCount(0);
        await view.play();
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
      view?.destroy();
    };
  }, [source]);

  return (
    <>
      <canvas ref={canvasRef} style={mediaStyle} />
      {failed ? (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 12,
            background: 'rgba(0,0,0,0.55)',
            padding: 8,
            textAlign: 'center',
          }}
        >
          PAG 无法预览
        </span>
      ) : null}
    </>
  );
};

/**
 * 画布上的充电动画媒体格：
 * - preview → .pag（libpag）
 * - charging_wallpaper → .mp4（video）
 */
export default function ChargingAnimation(props: any) {
  const data = props.data;
  const scale = typeof props.scale === 'number' ? props.scale : 1;

  if (!data) return null;

  const width = Number(data.width) > 0 ? Number(data.width) : DEFAULT_WIDTH;
  const height = Number(data.height) > 0 ? Number(data.height) : DEFAULT_HEIGHT;
  const source = data.mp4source || data.pagsource || '';
  const isPag =
    data.key === 'preview' || source.toLowerCase().endsWith('.pag');

  const renderMedia = () => {
    if (!source) return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed rgba(0, 0, 0, 0.15)',
          boxSizing: 'border-box',
          color: 'rgba(0, 0, 0, 0.25)',
        }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              transform: `scale(${scale})`,
            }}
          >
            <PictureOutlined style={{ fontSize: 48 }} />
            <span style={{ fontSize: 16, whiteSpace: 'nowrap' }}>暂无资源</span>
          </div>
        </div>
    );
    if (isPag) return <PagMedia key={source} source={source} />;
    return (
      <video
        src={source}
        style={mediaStyle}
        autoPlay
        loop
        muted
        playsInline
      />
    );
  };

  return (
    <div
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        width,
        height,
        overflow: 'hidden',
        position: 'relative',
        background: '#ffffff',
      }}
    >
      {renderMedia()}
    </div>
  );
}
