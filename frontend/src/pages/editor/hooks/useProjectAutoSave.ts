import { useCallback, useEffect, useRef } from 'react';
import type { EditorCore } from '@/editor-core';
import {
  type ProjectElementSavePayload,
  putApiV1ProjectElementsBatch,
} from '../service';

const CONFIG_SAVE_DEBOUNCE_MS = 3000;
const PREVIEW_SAVE_DEBOUNCE_MS = 10000;
const PREVIEW_IDLE_TIMEOUT_MS = 2000;

export type ProjectAutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const normalizeConfigJson = (value: unknown): Record<string, any> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  return { value };
};

const buildElementsPayload = (
  core: EditorCore,
): ProjectElementSavePayload[] => {
  const snapshot = core.serialize({ name: 'autosave-draft' });
  return snapshot.nodes.map((node) => ({
    element_key: node.id,
    category: node.category,
    subtype: node.type,
    x: node.transform.x,
    y: node.transform.y,
    visible: true,
    locked: false,
    schema_version: snapshot.schemaVersion,
    config_json: normalizeConfigJson(node.data),
  }));
};

export const useProjectAutoSave = (params: {
  core: EditorCore | null;
  projectId: string | null;
  onStatusChange?: (
    status: ProjectAutoSaveStatus,
    meta?: { lastSavedAt?: string | null; error?: unknown },
  ) => void;
}) => {
  const { core, projectId, onStatusChange } = params;
  const coreRef = useRef<EditorCore | null>(core);
  const projectIdRef = useRef<string | null>(projectId);
  const onStatusChangeRef = useRef(onStatusChange);
  const disposedRef = useRef(false);
  const configTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const previewIdleCallbackRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const queuedElementsRef = useRef(false);
  const queuedPreviewRef = useRef(false);

  useEffect(() => {
    coreRef.current = core;
    projectIdRef.current = projectId;
    onStatusChangeRef.current = onStatusChange;
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
    };
  }, [core, onStatusChange, projectId]);

  const clearTimer = (timerRef: {
    current: ReturnType<typeof setTimeout> | null;
  }) => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  const clearPreviewIdleTask = () => {
    clearTimer(previewIdleTimerRef);
    if (previewIdleCallbackRef.current === null) return;
    if ('cancelIdleCallback' in window) {
      window.cancelIdleCallback(previewIdleCallbackRef.current);
    }
    previewIdleCallbackRef.current = null;
  };

  const doSave = useCallback(
    async (params: { includeElements: boolean; includePreview: boolean }) => {
      const activeCore = coreRef.current;
      const activeProjectId = projectIdRef.current;
      if (!activeCore || !activeProjectId || disposedRef.current) return;
      if (!params.includeElements && !params.includePreview) return;

      if (savingRef.current) {
        queuedElementsRef.current ||= params.includeElements;
        queuedPreviewRef.current ||= params.includePreview;
        return;
      }

      savingRef.current = true;
      onStatusChangeRef.current?.('saving');
      try {
        const body: {
          elements?: ProjectElementSavePayload[];
          preview_image?: string | null;
        } = {};
        if (params.includeElements) {
          body.elements = buildElementsPayload(activeCore);
        }
        if (params.includePreview) {
          body.preview_image = activeCore.captureCanvas({
            mimeType: 'image/webp',
            quality: 0.82,
            outputWidth: 320,
            outputHeight: 320,
            fit: 'contain',
            includeBackground: true,
          });
        }
        await putApiV1ProjectElementsBatch(activeProjectId, body);
        onStatusChangeRef.current?.('saved', {
          lastSavedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.warn('[EditorAutoSave] save failed:', error);
        onStatusChangeRef.current?.('error', { error });
      } finally {
        savingRef.current = false;
        if (
          !disposedRef.current &&
          (queuedElementsRef.current || queuedPreviewRef.current)
        ) {
          const includeElements = queuedElementsRef.current;
          const includePreview = queuedPreviewRef.current;
          queuedElementsRef.current = false;
          queuedPreviewRef.current = false;
          void doSave({ includeElements, includePreview });
        }
      }
    },
    [],
  );

  const saveAllNow = useCallback(() => {
    clearTimer(configTimerRef);
    clearTimer(previewTimerRef);
    void doSave({ includeElements: true, includePreview: true });
  }, [doSave]);

  useEffect(() => {
    if (!core || !projectId) return;

    let historyInitialized = false;
    const scheduleConfigSave = () => {
      clearTimer(configTimerRef);
      configTimerRef.current = setTimeout(() => {
        configTimerRef.current = null;
        void doSave({ includeElements: true, includePreview: false });
      }, CONFIG_SAVE_DEBOUNCE_MS);
    };
    const schedulePreviewSave = () => {
      clearTimer(previewTimerRef);
      previewTimerRef.current = setTimeout(() => {
        previewTimerRef.current = null;
        clearPreviewIdleTask();
        if ('requestIdleCallback' in window) {
          previewIdleCallbackRef.current = window.requestIdleCallback(
            () => {
              previewIdleCallbackRef.current = null;
              void doSave({ includeElements: false, includePreview: true });
            },
            { timeout: PREVIEW_IDLE_TIMEOUT_MS },
          );
          return;
        }
        previewIdleTimerRef.current = setTimeout(() => {
          previewIdleTimerRef.current = null;
          void doSave({ includeElements: false, includePreview: true });
        }, 0);
      }, PREVIEW_SAVE_DEBOUNCE_MS);
    };

    const offHistoryChange = core.onHistoryChange(() => {
      if (!historyInitialized) {
        historyInitialized = true;
        return;
      }
      scheduleConfigSave();
      schedulePreviewSave();
    });
    // const handleBeforeUnload = () => {
    //   saveAllNow();
    // };
    // window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      offHistoryChange();
      // window.removeEventListener('beforeunload', handleBeforeUnload);
      saveAllNow();
      clearPreviewIdleTask();
      clearTimer(configTimerRef);
      clearTimer(previewTimerRef);
    };
  }, [core, doSave, projectId, saveAllNow]);

  return { saveAllNow };
};
