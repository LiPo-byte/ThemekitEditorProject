import { type ComponentType, createElement, useSyncExternalStore } from 'react';

/**
 * 导出 previewTransParent 时由导出流程临时接管锁屏组件的配色。
 *
 * 透明底那张预览要求「没有背景 + 元素纯白」。所有锁屏组件的背景色都取自
 * data.backgroundColor，而元素颜色（文字 color、遮罩图标的 background、
 * 进度弧的 conic-gradient、进度环的 SVG stroke）全部取自 data.focusColor，
 * 所以改这两个字段就够，不用按组件逐个适配 DOM 样式。
 *
 * 只对指定 nodeId 生效：画布上可能同时挂着多个锁屏节点，导出是逐个截图的，
 * 不限定节点会让其他节点跟着一起变白。
 */
export type LockCaptureTheme = {
  nodeId: string;
  focusColor: string;
  backgroundColor: string;
};

let captureTheme: LockCaptureTheme | null = null;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => captureTheme;

/** 传 null 表示交还控制权，组件恢复用户配置的颜色 */
export const setLockCaptureTheme = (theme: LockCaptureTheme | null) => {
  if (captureTheme === theme) return;
  captureTheme = theme;
  listeners.forEach((listener) => {
    listener();
  });
};

/**
 * 把接管中的配色合并进 data。
 *
 * nodeId 由 React Flow 以 props.id 传进来；右侧面板 / 弹窗里直接渲染这些组件时
 * 没有这个 prop，拿不到 id 就一定不是导出截图，原样返回。
 */
const useLockCaptureData = <T extends Record<string, any>>(
  data: T,
  nodeId?: string,
): T => {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => null);
  if (!theme || !nodeId || !data || theme.nodeId !== nodeId) return data;
  return {
    ...data,
    focusColor: theme.focusColor,
    backgroundColor: theme.backgroundColor,
  } as T;
};

/**
 * 给锁屏节点组件套一层配色接管，在 xyFlowTypeNodeType 里统一包，
 * 29 个组件不用各自改。接管不命中时传下去的就是原始 data，行为和没包一样。
 */
export const withLockCaptureTheme = <P extends { id?: string; data?: any }>(
  Component: ComponentType<P>,
): ComponentType<P> => {
  const WithLockCaptureTheme = (props: P) => {
    const data = useLockCaptureData(props.data, props.id);
    return createElement(Component, { ...props, data });
  };
  WithLockCaptureTheme.displayName = `withLockCaptureTheme(${
    Component.displayName || Component.name || 'Component'
  })`;
  return WithLockCaptureTheme;
};
