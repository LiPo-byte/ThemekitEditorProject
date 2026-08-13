import { useSyncExternalStore } from 'react';

/**
 * 保存调度中心。
 *
 * 手动保存（按钮 / Cmd+S）和自动保存必须共用同一把锁：batch 接口是全量覆盖式的，
 * 本次没带上的 element_key 会被后端软删，两个请求并发乱序返回会把元素存坏。
 * 所以这里把 in-flight、脏标记、定时器全部收在模块级，所有入口都从这里过。
 */

export type ProjectSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export type ProjectSaveSnapshot = {
  status: ProjectSaveStatus;
  saving: boolean;
  lastSavedAt: number | null;
  /** 仅在 status 为 error 时有意义：退避重试是否还会继续 */
  willRetry: boolean;
};

/** 保存实现，返回 falsy 视为失败 */
export type ProjectSaver = () => Promise<unknown>;

const AUTO_SAVE_DEBOUNCE_MS = 2000;
/** 连续拖动时 debounce 会被一直推后，用 maxWait 保证最长这么久必落一次盘 */
const AUTO_SAVE_MAX_WAIT_MS = 10000;
const RETRY_DELAYS_MS = [2000, 6000];

let saver: ProjectSaver | null = null;
let dirty = false;
let inFlight = false;
let currentRun: Promise<boolean> | null = null;
let retryCount = 0;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

let snapshot: ProjectSaveSnapshot = {
  status: 'idle',
  saving: false,
  lastSavedAt: null,
  willRetry: false,
};
const listeners = new Set<() => void>();

const setSnapshot = (patch: Partial<ProjectSaveSnapshot>) => {
  const next = { ...snapshot, ...patch };
  if (
    next.status === snapshot.status &&
    next.saving === snapshot.saving &&
    next.lastSavedAt === snapshot.lastSavedAt &&
    next.willRetry === snapshot.willRetry
  ) {
    return;
  }
  snapshot = next;
  listeners.forEach((listener) => {
    listener();
  });
};

const clearTimer = (timer: ReturnType<typeof setTimeout> | null) => {
  if (timer) clearTimeout(timer);
  return null;
};

const cancelScheduled = () => {
  debounceTimer = clearTimer(debounceTimer);
  maxWaitTimer = clearTimer(maxWaitTimer);
  retryTimer = clearTimer(retryTimer);
};

const startRun = (): Promise<boolean> => {
  if (inFlight && currentRun) return currentRun;

  cancelScheduled();
  const activeSaver = saver;
  // projectId 还没就绪（新建项目时路由里的 id 是异步补上的），保留脏标记等注册后补存
  if (!activeSaver) return Promise.resolve(false);

  inFlight = true;
  // 本轮要落盘的改动已经取走，保存期间进来的新改动会重新把 dirty 置回 true
  dirty = false;
  setSnapshot({ status: 'saving', saving: true, willRetry: false });

  currentRun = (async () => {
    let ok = false;
    try {
      ok = Boolean(await activeSaver());
    } catch (error) {
      console.warn('[saveController] save failed:', error);
    }

    inFlight = false;
    currentRun = null;

    if (ok) {
      retryCount = 0;
      setSnapshot({
        status: dirty ? 'dirty' : 'saved',
        saving: false,
        lastSavedAt: Date.now(),
      });
      if (dirty) scheduleAutoSave();
    } else {
      dirty = true;
      setSnapshot({
        status: 'error',
        saving: false,
        willRetry: scheduleRetry(),
      });
    }
    return ok;
  })();

  return currentRun;
};

const scheduleAutoSave = () => {
  debounceTimer = clearTimer(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void startRun();
  }, AUTO_SAVE_DEBOUNCE_MS);
  if (maxWaitTimer) return;
  maxWaitTimer = setTimeout(() => {
    maxWaitTimer = null;
    void startRun();
  }, AUTO_SAVE_MAX_WAIT_MS);
};

/** 返回是否真的排了重试 */
const scheduleRetry = () => {
  const delay = RETRY_DELAYS_MS[retryCount];
  // 重试次数用尽后停在 error 状态，等用户手动保存或下一次改动重新触发
  if (delay === undefined) return false;
  retryCount += 1;
  retryTimer = clearTimer(retryTimer);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void startRun();
  }, delay);
  return true;
};

/**
 * 注册真正的保存实现。
 * 返回的注销函数在自己已被后来者顶替时返回 false，调用方据此判断还该不该清场。
 */
export const registerProjectSaver = (next: ProjectSaver) => {
  saver = next;
  // 注册前攒下的改动（等 projectId 期间的编辑）在这里补一次调度
  if (dirty && !inFlight) scheduleAutoSave();
  return () => {
    if (saver !== next) return false;
    saver = null;
    return true;
  };
};

/** 有真实编辑发生时调用，触发 debounce 自动保存 */
export const markProjectDirty = () => {
  dirty = true;
  retryCount = 0;
  if (!inFlight) setSnapshot({ status: 'dirty' });
  scheduleAutoSave();
};

/**
 * 立即保存。已有请求在飞就等它落地，期间若又有新改动再补跑一轮。
 * 返回是否保存成功，供手动入口做 toast。
 */
export const saveProjectNow = async (): Promise<boolean> => {
  cancelScheduled();
  if (inFlight && currentRun) {
    const ok = await currentRun;
    if (!dirty) return ok;
  }
  return startRun();
};

export const hasUnsavedProjectChanges = () => dirty || inFlight;

/** 切换项目 / 编辑器卸载时清场，避免脏标记和定时器串到下一个项目 */
export const resetProjectSaveState = () => {
  cancelScheduled();
  dirty = false;
  retryCount = 0;
  setSnapshot({
    status: 'idle',
    saving: inFlight,
    lastSavedAt: null,
    willRetry: false,
  });
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => snapshot;

export const useProjectSaveState = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
