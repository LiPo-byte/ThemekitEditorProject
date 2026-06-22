import React, { useEffect } from 'react';
import { createStyles } from 'antd-style';
import { EditorCore } from '@/editor-core';
import {
  useEditorCoreLoading,
  useEditorCoreSetter,
  useEditorFontsReady,
  useEditorProjectId
} from '../context';
import ActionPopover from './ActionPopover';
import { useEnterAnimation } from '../hooks/useEnterAnimation';

const SNAPSHOT_STORAGE_KEY = 'themekit-editor:snapshot:draft';
const SNAPSHOT_SAVE_DEBOUNCE_MS = 600;

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
  const projectId = useEditorProjectId();
  const fontsReady = useEditorFontsReady();
  const coreLoading = useEditorCoreLoading();
  const playEnterAnimation = useEnterAnimation(coreLoading, { durationMs: 300 });
  useEffect(() => {
    if (!fontsReady) return;
    if (!projectId) return;
    // useEffect 在 DOM commit 之后才跑，#editor-container 必然存在
    const core = new EditorCore('editor-container');
    setCore(core);

    try {
      const cachedSnapshot = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      if (cachedSnapshot) {
        const parsed = JSON.parse(cachedSnapshot);
        const { id } = parsed;
        if (id === projectId) {
          const loaded = core.loadSnapshot(parsed);
          if (!loaded) {
            console.warn('[EditorCanvas] local snapshot is invalid, skipped restore');
          }
        };
      }
    } catch (error) {
      console.warn('[EditorCanvas] restore snapshot from localStorage failed:', error);
    }

    // TODO(P4): 调试探针，正式接入保存接口后移除
    (window as any).__editorDump = () => core.__debugDump();

    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    const persistSnapshot = () => {
      try {
        const snapshot = core.serialize({ name: 'local-draft' });
        localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify({...snapshot, id: projectId}));
      } catch (error) {
        console.warn('[EditorCanvas] save snapshot to localStorage failed:', error);
      }
    };
    const schedulePersist = (immediate = false) => {
      if (immediate) {
        if (saveTimer) {
          clearTimeout(saveTimer);
          saveTimer = null;
        }
        persistSnapshot();
        return;
      }
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveTimer = null;
        persistSnapshot();
      }, SNAPSHOT_SAVE_DEBOUNCE_MS);
    };

    // 编辑内容变化（增删改、撤销重做）后保存草稿
    const offHistoryChange = core.onHistoryChange(() => {
      schedulePersist();
    });
    // 视图变化（缩放/平移）后保存草稿，保证回显视角一致
    // const offLayoutChange = core.onLayoutChange(() => {
    //   schedulePersist();
    // });
    const handleBeforeUnload = () => {
      schedulePersist(true);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;
      schedulePersist(true);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      offHistoryChange();
      // offLayoutChange();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      schedulePersist(true);
      delete (window as any).__editorDump;
      core.destroy();
      setCore(null);
    };
  }, [fontsReady, setCore, projectId]);

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
