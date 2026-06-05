import { createStyles } from 'antd-style';
import React from 'react';
import { useEditorCore, useEditorCoreLoading, useEditorPreviewDevicesOpen } from '../context';
import { useEnterAnimation } from '../hooks/useEnterAnimation';

const useStyles = createStyles(({ token, css }) => ({
  shell: css`
    // width: 280px;
    position: absolute;
    top: 80px;
    right: 12px;
    bottom: 62px;
    z-index: 20;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: ${token.boxShadowSecondary};
    background: ${token.colorBgElevated}f2;
    backdrop-filter: blur(14px);
    transition: transform 260ms ease, opacity 220ms ease;
  `,
  shellClosed: css`
    transform: translateX(24px);
    opacity: 0;
    pointer-events: none;
  `,
  shellEnter: css`
    animation: right-panel-slide-in 360ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
    @keyframes right-panel-slide-in {
      from {
        transform: translateX(16px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `,
  wrap: css`
    padding: 12px 16px;
  `,
}));




const PreviewDevices: React.FC = () => {
  const { styles } = useStyles();
  const previewDevicesOpen = useEditorPreviewDevicesOpen();
  const playEnterAnimation = useEnterAnimation(previewDevicesOpen, { durationMs: 360 });
  return (
    <div
      className={`${styles.shell} ${!previewDevicesOpen ? styles.shellClosed : ''} ${playEnterAnimation && previewDevicesOpen ? styles.shellEnter : ''}`}
    >

        <div className="device device-iphone-x" style={{ transform: 'scale(0.5)' }}>
        <div className="device-frame">
            <div className="device-screen">
                {/* <img src="https://picsum.photos/200/300" alt="device-screen" /> */}
            </div>
        </div>
        <div className="device-stripe"></div>
        <div className="device-header"></div>
        <div className="device-sensors"></div>
        <div className="device-btns"></div>
        <div className="device-power"></div>
        </div>
    </div>
  );
};

export default PreviewDevices;
