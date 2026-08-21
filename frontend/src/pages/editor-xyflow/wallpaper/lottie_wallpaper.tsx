// import CropEditableImage from '../components/CropEditableImage';
// import {
//     useEditorCropEditingNodeId,
//     useEditorCropToolOpen,
//   } from '../context';
import { PictureOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { type DotLottie, DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react';

// 播放器 wasm 默认从 jsdelivr / unpkg 拉，这里改指 public/ 下的自托管副本
// （由 postinstall 的 scripts/copy-lottie-wasm.js 拷贝），路径需与 publicPath 一致。
// 放在模块顶层是为了保证早于任何 DotLottie 实例创建
setWasmUrl('/dotlottie-player.wasm');

// canvas 内部像素 = 设计尺寸 × 该倍数，与画布当前缩放无关。
// 1 表示 100% 下正好 1:1；调大更清晰，但像素数按平方涨，显存和合成开销跟着涨。
const RENDER_SCALE = 1;

// 播放器按 getBoundingClientRect().width × devicePixelRatio 定 canvas 尺寸，
// 而 rect 里已经含了 React Flow 的缩放。这里反解出缩放倍数，
// 让两者相乘后正好落回设计尺寸——于是在哪个缩放下挂载都得到同样清晰度。
const measurePixelRatio = (element: HTMLElement | null) => {
  if (!element) return RENDER_SCALE;
  const layoutWidth = element.offsetWidth;
  const renderedWidth = element.getBoundingClientRect().width;
  if (!layoutWidth || !renderedWidth) return RENDER_SCALE;
  const cssScale = renderedWidth / layoutWidth;
  if (!Number.isFinite(cssScale) || cssScale <= 0) return RENDER_SCALE;
  return RENDER_SCALE / cssScale;
};

export default function LottieWallpaper(props: any) {
  const data = props.data;
  const scale = typeof props.scale === 'number' ? props.scale : 1;
  const src = data?.lottieSource;
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pixelRatio, setPixelRatio] = useState<number | null>(null);

  // 只在挂载和布局尺寸变化时量一次。缩放改的是 transform，不改布局盒，
  // 播放器的 ResizeObserver 不会被触发，所以平移缩放期间没有任何重算。
  useLayoutEffect(() => {
    setPixelRatio(measurePixelRatio(containerRef.current));
  }, [scale, data?.width, data?.height]);

  const renderConfig = useMemo(
    () => (pixelRatio ? { devicePixelRatio: pixelRatio } : undefined),
    [pixelRatio],
  );

  // 创建时已带上 renderConfig，这里补的是尺寸变化后重新量到的值：
  // setRenderConfig 本身不会重建 canvas，得跟一次 resize 才生效
  useEffect(() => {
    if (!dotLottie || !pixelRatio) return;
    const apply = () => {
      dotLottie.setRenderConfig({ devicePixelRatio: pixelRatio });
      dotLottie.resize();
    };
    if (dotLottie.isLoaded) apply();
    dotLottie.addEventListener('load', apply);
    return () => dotLottie.removeEventListener('load', apply);
  }, [dotLottie, pixelRatio]);

  useEffect(() => {
    // 没有 src 不该转圈；换了 src 要退回加载中
    setLoaded(!src);
    if (!dotLottie || !src) return;

    const finish = () => setLoaded(true);
    dotLottie.addEventListener('load', finish);
    // 失败也要收掉 loading，否则会一直转
    dotLottie.addEventListener('loadError', finish);
    // 监听注册之前可能就已加载完（例如资源命中缓存）
    if (dotLottie.isLoaded) finish();

    return () => {
      dotLottie.removeEventListener('load', finish);
      dotLottie.removeEventListener('loadError', finish);
    };
  }, [dotLottie, src]);

  if (!data) return null;
  const width = Number(data.width) > 0 ? Number(data.width) : 887;
  const height = Number(data.height) > 0 ? Number(data.height) : 1920;
  // 外层整体被 scale 缩放，占位/loading 反向缩放回去，保证任何缩略比例下大小一致
  const invScale = scale > 0 ? 1 / scale : 1;
  return (
    <div
      ref={containerRef}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        width,
        height,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
        {src ? (
          <>
            {/* 等量完再挂载，省掉「先按默认分辨率建一次、再改配置重建」这一轮 */}
            {pixelRatio == null ? null : (
              <DotLottieReact
                src={src}
                autoplay
                loop
                style={{ width: '100%', height: '100%' }}
                renderConfig={renderConfig}
                dotLottieRefCallback={setDotLottie}
              />
            )}
            {loaded ? null : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                }}
              >
                <Spin size="large" style={{ transform: `scale(${invScale})` }} />
              </div>
            )}
          </>
        ) : (
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
                transform: `scale(${invScale})`,
              }}
            >
              <PictureOutlined style={{ fontSize: 48 }} />
              <span style={{ fontSize: 16, whiteSpace: 'nowrap' }}>暂无 Lottie 动画</span>
            </div>
          </div>
        )}
    </div>
  );
}
