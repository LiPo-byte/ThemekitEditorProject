import { useEffect, useRef } from 'react';
import {
  useEditorCanDeleteSelected,
  useEditorCanRedo,
  useEditorCanUndo,
  useEditorCropToolOpen,
  useEditorDeleteSelectedNodes,
  useEditorDesktopEditOpen,
  useEditorFitView,
  useEditorGlobalLoading,
  useEditorImportModalOpen,
  useEditorRedo,
  useEditorUndo,
} from '../context';
import { useSaveProjectAction } from './useSaveProject';

type ShortcutState = {
  locked: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canDeleteSelected: boolean;
  undo: () => void;
  redo: () => void;
  deleteSelectedNodes: () => void;
  fitView: () => void;
  save: () => Promise<void>;
};

/** 焦点在可输入元素里时，撤销/重做/删除要让位给原生输入行为 */
const isTypingTarget = () => {
  const active = document.activeElement as HTMLElement | null;
  if (!active) return false;
  if (active.isContentEditable) return true;
  const tagName = active.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
};

/**
 * 编辑器全局快捷键。
 * 键位：Cmd/Ctrl+Z 撤销、Cmd/Ctrl+Shift+Z 或 Ctrl+Y 重做、Cmd/Ctrl+S 保存、
 * Delete/Backspace 删除选中、Shift+1 适应画布。
 * 只在 EditorCoreProvider 内挂一次。
 */
export const useEditorShortcuts = () => {
  const undo = useEditorUndo();
  const redo = useEditorRedo();
  const canUndo = useEditorCanUndo();
  const canRedo = useEditorCanRedo();
  const deleteSelectedNodes = useEditorDeleteSelectedNodes();
  const canDeleteSelected = useEditorCanDeleteSelected();
  const fitView = useEditorFitView();
  const save = useSaveProjectAction();
  const cropToolOpen = useEditorCropToolOpen();
  const desktopEditOpen = useEditorDesktopEditOpen();
  const importModalOpen = useEditorImportModalOpen();
  const globalLoading = useEditorGlobalLoading();

  // 裁剪器/桌面编辑器/导入弹窗都有自己的草稿态，此时改画布节点会让状态错乱
  const locked =
    cropToolOpen || desktopEditOpen || importModalOpen || globalLoading;

  // 回调和开关走 ref，keydown 只绑一次，避免 nodes 每次变化都解绑重绑
  const stateRef = useRef<ShortcutState>({
    locked,
    canUndo,
    canRedo,
    canDeleteSelected,
    undo,
    redo,
    deleteSelectedNodes,
    fitView,
    save,
  });

  useEffect(() => {
    stateRef.current = {
      locked,
      canUndo,
      canRedo,
      canDeleteSelected,
      undo,
      redo,
      deleteSelectedNodes,
      fitView,
      save,
    };
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      const state = stateRef.current;
      const withModifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      // 保存：即便焦点在输入框里也要接管，否则浏览器会弹「保存网页」
      if (withModifier && key === 's') {
        event.preventDefault();
        if (state.locked) return;
        void state.save();
        return;
      }

      if (state.locked) return;
      if (isTypingTarget()) return;

      if (withModifier && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          if (state.canRedo) state.redo();
          return;
        }
        if (state.canUndo) state.undo();
        return;
      }

      // Windows 上重做的另一种习惯键位
      if (withModifier && key === 'y') {
        event.preventDefault();
        if (state.canRedo) state.redo();
        return;
      }

      if (key === 'delete' || key === 'backspace') {
        if (!state.canDeleteSelected) return;
        event.preventDefault();
        state.deleteSelectedNodes();
        return;
      }

      if (event.shiftKey && !withModifier && event.code === 'Digit1') {
        event.preventDefault();
        state.fitView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
};
