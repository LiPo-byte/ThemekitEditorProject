import { App } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useEditorSaveProjectPayload } from '../context';

const SAVE_TOAST_KEY = 'editor-save-toast';

// 保存有按钮和快捷键两个入口，各自持有一份 saving state；
// in-flight 提到模块级并广播，两个入口才能互斥、且 loading 表现一致。
let savingInFlight = false;
const savingListeners = new Set<(value: boolean) => void>();

const setSavingInFlight = (value: boolean) => {
  savingInFlight = value;
  savingListeners.forEach((listener) => {
    listener(value);
  });
};

/**
 * 只要保存动作、不关心 loading 的调用方用这个（比如挂在编辑器根组件上的快捷键）。
 * 订阅 saving 会让宿主组件在每次保存前后各重渲染一次，根组件上要避免。
 */
export const useSaveProjectAction = () => {
  const { message } = App.useApp();
  const saveProjectPayload = useEditorSaveProjectPayload();

  return useCallback(async () => {
    if (savingInFlight) return;
    setSavingInFlight(true);
    message.open({
      key: SAVE_TOAST_KEY,
      type: 'loading',
      content: '保存中...',
      duration: 0,
    });
    try {
      const result = await saveProjectPayload();
      if (result) {
        message.open({
          key: SAVE_TOAST_KEY,
          type: 'success',
          content: '保存成功',
          duration: 1.5,
        });
      } else {
        message.open({
          key: SAVE_TOAST_KEY,
          type: 'error',
          content: '保存失败，请重试',
          duration: 2,
        });
      }
    } catch {
      message.open({
        key: SAVE_TOAST_KEY,
        type: 'error',
        content: '保存失败，请重试',
        duration: 2,
      });
    } finally {
      setSavingInFlight(false);
    }
  }, [message, saveProjectPayload]);
};

/** 需要 loading 反馈的调用方用这个（比如工具栏的保存按钮） */
export const useSaveProject = () => {
  const save = useSaveProjectAction();
  const [saving, setSaving] = useState(savingInFlight);

  useEffect(() => {
    savingListeners.add(setSaving);
    setSaving(savingInFlight);
    return () => {
      savingListeners.delete(setSaving);
    };
  }, []);

  return { saving, save };
};
