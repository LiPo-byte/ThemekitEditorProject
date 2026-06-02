import React, { useEffect } from 'react';
import { createStyles } from 'antd-style';
import { EditorCore } from '@/editor-core';
import { useEditorCoreLoading, useEditorCoreSetter, useEditorFontsReady } from '../context';
import ActionPopover from './ActionPopover';
import { useEnterAnimation } from '../hooks/useEnterAnimation';

const useStyles = createStyles(({ token, css }) => ({
  shell: css`
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: ${token.colorBgLayout};
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  shellEnter: css`
    animation: canvas-pop-in 300ms ease-out;
    @keyframes canvas-pop-in {
      from {
        transform: translateY(-12px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  // ActionPopover 用 absolute 定位，需要一个 relative 锚点
  wrapper: css`
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  `,
  stage: css`
    width: 100%;
    height: 100%;
  `,
}));

const EditorCanvas: React.FC = () => {
  const { styles } = useStyles();
  const setCore = useEditorCoreSetter();
  const fontsReady = useEditorFontsReady();
  const coreLoading = useEditorCoreLoading();
  const playEnterAnimation = useEnterAnimation(coreLoading, { durationMs: 300 });
  useEffect(() => {
    if (!fontsReady) return;
    // useEffect 在 DOM commit 之后才跑，#editor-container 必然存在
    const core = new EditorCore('editor-container');
    setCore(core);
    return () => {
      core.destroy();
      setCore(null);
    };
  }, [fontsReady, setCore]);
  return (
    <div className={`${styles.shell} ${playEnterAnimation ? styles.shellEnter : ''}`}>
      <div className={styles.wrapper}>
        <div id='editor-container' className={styles.stage}></div>
        <ActionPopover />
      </div>
    </div>
  );
};

export default EditorCanvas;
