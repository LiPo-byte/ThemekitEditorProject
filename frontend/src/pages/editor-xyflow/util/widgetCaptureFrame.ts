import { useSyncExternalStore } from 'react';

/**
 * 导出预览 GIF 时由导出流程接管带轮播动画的 widget，指定当前该渲染第几帧。
 * 被接管期间组件内部的定时器停止，保证同一帧里的图片和文字来自同一个下标，
 * 也避免「截图节奏」和「组件定时器节奏」互相漂移导致漏帧。
 */
let captureFrameIndex: number | null = null;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** 传 null 表示交还控制权，组件恢复自己的轮播 */
export const setWidgetCaptureFrameIndex = (index: number | null) => {
  if (captureFrameIndex === index) return;
  captureFrameIndex = index;
  listeners.forEach((listener) => {
    listener();
  });
};

export const useWidgetCaptureFrameIndex = () =>
  useSyncExternalStore(
    subscribe,
    () => captureFrameIndex,
    () => null,
  );
