// import CropEditableImage from '../components/CropEditableImage';
// import {
//     useEditorCropEditingNodeId,
//     useEditorCropToolOpen,
//   } from '../context';
import { PictureOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import { type DotLottie, DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react';

// 播放器 wasm 默认从 jsdelivr / unpkg 拉，这里改指 public/ 下的自托管副本
// （由 postinstall 的 scripts/copy-lottie-wasm.js 拷贝），路径需与 publicPath 一致。
// 放在模块顶层是为了保证早于任何 DotLottie 实例创建
setWasmUrl('/dotlottie-player.wasm');

export default function LottieWallpaper(props: any) {
  const data = props.data;
  const scale = typeof props.scale === 'number' ? props.scale : 1;
  const src = data?.lottieSource;
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);
  const [loaded, setLoaded] = useState(false);

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
            <DotLottieReact
              src={src}
              autoplay
              loop
              style={{ width: '100%', height: '100%' }}
              dotLottieRefCallback={setDotLottie}
            />
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
