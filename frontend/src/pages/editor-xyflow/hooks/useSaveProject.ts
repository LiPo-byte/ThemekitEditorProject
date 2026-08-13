import { App } from 'antd';
import { useCallback } from 'react';
import { saveProjectNow, useProjectSaveState } from './saveController';

const SAVE_TOAST_KEY = 'editor-save-toast';

/**
 * 只要保存动作、不关心 loading 的调用方用这个（比如挂在编辑器根组件上的快捷键）。
 * 订阅 saving 会让宿主组件在每次保存前后各重渲染一次，根组件上要避免。
 *
 * 互斥、排队、重试都在 saveController 里，这里只负责 toast。
 */
export const useSaveProjectAction = () => {
  const { message } = App.useApp();

  return useCallback(async () => {
    message.open({
      key: SAVE_TOAST_KEY,
      type: 'loading',
      content: '保存中...',
      duration: 0,
    });
    const ok = await saveProjectNow();
    if (ok) {
      message.open({
        key: SAVE_TOAST_KEY,
        type: 'success',
        content: '保存成功',
        duration: 1.5,
      });
      return;
    }
    message.open({
      key: SAVE_TOAST_KEY,
      type: 'error',
      content: '保存失败，请重试',
      duration: 2,
    });
  }, [message]);
};

/** 需要 loading / 状态反馈的调用方用这个（比如工具栏的保存按钮） */
export const useSaveProject = () => {
  const save = useSaveProjectAction();
  const state = useProjectSaveState();

  return { ...state, save };
};
