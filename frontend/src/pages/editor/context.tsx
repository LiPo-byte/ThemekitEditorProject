import { history, useLocation, useParams } from '@umijs/max';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { EditorCore } from '@/editor-core';
import fontManifest from './components/font-manifest.json';
import { postApiV1Project } from './service';
import { message } from 'antd';
import {
  type ProjectAutoSaveStatus,
  useProjectAutoSave,
} from './hooks/useProjectAutoSave';

const FONT_FACE_STYLE_ID = 'editor-font-face-manifest';
const FONT_LOAD_TIMEOUT_MS = 4000;

type FontManifestItem = {
  file?: string;
  postscriptName?: string;
};

const MANIFEST_FONTS = (fontManifest as FontManifestItem[]).filter(
  (item) => item.file && item.postscriptName,
);

/** 编辑器浮层 UI 显隐（侧栏、工具条等） */
export type EditorUIVisibility = {
  leftPanel: boolean;
  rightPanel: boolean;
  editorToolbar: boolean;
  bottomToolBar: boolean;
  headerControls: boolean;
  zoomToolBar: boolean;
};

export const DEFAULT_EDITOR_UI_VISIBILITY: EditorUIVisibility = {
  leftPanel: false,
  rightPanel: false,
  editorToolbar: true,
  bottomToolBar: true,
  headerControls: true,
  zoomToolBar: true,
};

type EditorCoreCtxValue = {
  projectId: string | null;
  projectName: string;
  setProjectName: (s: string) => void;
  saveStatus: ProjectAutoSaveStatus;
  lastSavedAt: string | null;
  saveAllNow: () => void;
  /** EditorCore 实例，画布挂载前为 null */
  core: EditorCore | null;
  coreLoading: boolean;
  /** 字体是否已准备就绪 */
  fontsReady: boolean;
  /** 仅给画布组件用：注入/卸载实例 */
  setCore: (c: EditorCore | null) => void;
  uiVisibility: EditorUIVisibility;
  setUIVisibility: (patch: Partial<EditorUIVisibility>) => void;
  /** @deprecated 请用 uiVisibility.leftPanel / setUIVisibility */
  leftPanlOpen: boolean;
  setLeftPanlOpen: (b: boolean) => void;
  /** @deprecated 请用 uiVisibility.rightPanel / setUIVisibility */
  rightPanlOpen: boolean;
  setRightPanlOpen: (b: boolean) => void;
  previewDevicesOpen: boolean;
  setPreviewDevicesOpen: (b: boolean) => void;
  /** true：隐藏全部浮层 UI（裁剪等沉浸场景） */
  setHideUI: (b: boolean) => void;
  cropToolOpen: boolean;
  setCropToolOpen: (b: boolean) => void;
};

const EditorCoreCtx = createContext<EditorCoreCtxValue>({
  projectId: null,
  projectName: '',
  setProjectName: () => {},
  saveStatus: 'idle',
  lastSavedAt: null,
  saveAllNow: () => {},
  core: null,
  fontsReady: false,
  coreLoading: false,
  setCore: () => {},
  uiVisibility: DEFAULT_EDITOR_UI_VISIBILITY,
  setUIVisibility: () => {},
  leftPanlOpen: false,
  setLeftPanlOpen: () => {},
  rightPanlOpen: false,
  setRightPanlOpen: () => {},
  previewDevicesOpen: false,
  setPreviewDevicesOpen: () => {},
  setHideUI: () => {},
  cropToolOpen: false,
  setCropToolOpen: () => {},
});

/** 包裹整个编辑器页面，子组件可通过 useEditorCore 取到实例 */
export const EditorCoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const params = useParams<{ projectId?: string }>();
  const creatingProjectRef = useRef(false);

  const [projectId, setProjectId] = useState<string | null>(params.projectId ?? null);
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const [saveStatus, setSaveStatus] = useState<ProjectAutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [core, setCore] = useState<EditorCore | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [coreLoading, setCoreLoading] = useState(true);

  const [cropToolOpen, setCropToolOpen] = useState(false);
  const [uiVisibility, setUIVisibilityState] = useState<EditorUIVisibility>(
    DEFAULT_EDITOR_UI_VISIBILITY,
  );
  const [previewDevicesOpen, setPreviewDevicesOpen] = useState(false);

  const { saveAllNow } = useProjectAutoSave({
    core,
    projectId,
    onStatusChange: (status, meta) => {
      setSaveStatus(status);
      if (meta && Object.hasOwn(meta, 'lastSavedAt')) {
        setLastSavedAt(meta.lastSavedAt ?? null);
      }
    },
  });

  const setUIVisibility = (patch: Partial<EditorUIVisibility>) => {
    setUIVisibilityState((prev) => ({ ...prev, ...patch }));
  };

  const setLeftPanlOpen = (open: boolean) => setUIVisibility({ leftPanel: open });
  const setRightPanlOpen = (open: boolean) => setUIVisibility({ rightPanel: open });

  const setHideUI = (hide: boolean) => {
      setUIVisibility({
        leftPanel: !hide,
        rightPanel: !hide,
        editorToolbar: !hide,
        bottomToolBar: !hide,
        headerControls: !hide,
        zoomToolBar: !hide,
      });
  };
  useEffect(() => {
    if (params.projectId) {
      setProjectId(params.projectId);
      return;
    }
    if (location.pathname !== '/editor' || creatingProjectRef.current) {
      return;
    }

    creatingProjectRef.current = true;
    const createProjectAndReplacePath = async () => {
      try {
        const { project_id: createdProjectId } = await postApiV1Project();
        const latestPath = history.location.pathname;
        if (latestPath.startsWith('/editor/')) {
          return;
        }
        setProjectId(createdProjectId);
        history.replace({
          pathname: `/editor/${createdProjectId}`,
          search: history.location.search,
          hash: history.location.hash,
        });
      } catch(_error: any) {
        message.error('创建项目失败！请稍后再试');
      } finally {
        creatingProjectRef.current = false;
      }
    };

    void createProjectAndReplacePath();
  }, [location.pathname, params.projectId]);

  useEffect(() => {
    let mounted = true;
    const prepareFonts = async () => {
      if (typeof document === 'undefined') return;
      if (!document.getElementById(FONT_FACE_STYLE_ID)) {
        const css = MANIFEST_FONTS.map((item) => {
          const fontFamily = item.postscriptName?.replace(/'/g, "\\'");
          const fontUrl = `/fonts/${encodeURIComponent(String(item.file))}`;
          return `@font-face{font-family:'${fontFamily}';src:url('${fontUrl}') format('truetype');font-style:normal;font-weight:400;}`;
        }).join('');
        const styleEl = document.createElement('style');
        styleEl.id = FONT_FACE_STYLE_ID;
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
      }
      const fontsApi = document.fonts;
      if (!fontsApi?.load) return;
      const loadTasks = Array.from(
        new Set(MANIFEST_FONTS.map((item) => String(item.postscriptName))),
      ).map((fontName) => fontsApi.load(`12px "${fontName.replace(/"/g, '\\"')}"`));
      await Promise.race([
        Promise.all(loadTasks),
        new Promise((resolve) => setTimeout(resolve, FONT_LOAD_TIMEOUT_MS)),
      ]);
    };

    prepareFonts()
      .catch(() => {})
      .finally(() => {
        if (mounted) setFontsReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (core) {
        setCoreLoading(false);
    }
  }, [core])

  // value 的 identity 仅在 core 变化时改变，避免无意义 re-render
  const value = useMemo<EditorCoreCtxValue>(
    () => ({
        projectId,
        projectName,
        setProjectName,
        saveStatus,
        lastSavedAt,
        saveAllNow,
        core,
        fontsReady,
        setCore,
        coreLoading,
        uiVisibility,
        setUIVisibility,
        leftPanlOpen: uiVisibility.leftPanel,
        setLeftPanlOpen,
        rightPanlOpen: uiVisibility.rightPanel,
        setRightPanlOpen,
        previewDevicesOpen,
        setPreviewDevicesOpen,
        setHideUI,
        cropToolOpen,
        setCropToolOpen,
    }),
    [
        projectId,
        projectName,
        saveStatus,
        lastSavedAt,
        saveAllNow,
        core,
        fontsReady,
        coreLoading,
        uiVisibility,
        previewDevicesOpen,
    ],
  );
  return <EditorCoreCtx.Provider value={value}>{children}</EditorCoreCtx.Provider>;
};

/** 子组件读取 core 实例（未就绪返回 null，调用方自行判空） */
export const useEditorCore = () => useContext(EditorCoreCtx).core;
export const useEditorProjectId = () => useContext(EditorCoreCtx).projectId;
export const useEditorProjectName = () => useContext(EditorCoreCtx).projectName;
export const useEditorProjectNameSetter = () => useContext(EditorCoreCtx).setProjectName;
export const useEditorSaveStatus = () => useContext(EditorCoreCtx).saveStatus;
export const useEditorLastSavedAt = () => useContext(EditorCoreCtx).lastSavedAt;
export const useEditorSaveAllNow = () => useContext(EditorCoreCtx).saveAllNow;
export const useEditorFontsReady = () => useContext(EditorCoreCtx).fontsReady;
export const useEditorCoreLoading = () => useContext(EditorCoreCtx).coreLoading;

/** 仅 EditorCanvas 用：在 useEffect 中注入/卸载实例 */
export const useEditorCoreSetter = () => useContext(EditorCoreCtx).setCore;

export const useEditorUIVisibility = () => useContext(EditorCoreCtx).uiVisibility;
export const useEditorUIVisibilitySetter = () => useContext(EditorCoreCtx).setUIVisibility;

export const useEditorLeftPanlOpen = () => useContext(EditorCoreCtx).uiVisibility.leftPanel;
export const useEditorLeftPanlOpenSetter = () => useContext(EditorCoreCtx).setLeftPanlOpen;
export const useEditorRightPanlOpen = () => useContext(EditorCoreCtx).uiVisibility.rightPanel;
export const useEditorRightPanlOpenSetter = () => useContext(EditorCoreCtx).setRightPanlOpen;

export const useEditorToolbarVisible = () => useContext(EditorCoreCtx).uiVisibility.editorToolbar;
export const useEditorBottomToolBarVisible = () =>
  useContext(EditorCoreCtx).uiVisibility.bottomToolBar;
export const useEditorHeaderControlsVisible = () =>
  useContext(EditorCoreCtx).uiVisibility.headerControls;
export const useEditorZoomToolBarVisible = () => useContext(EditorCoreCtx).uiVisibility.zoomToolBar;

export const useEditorPreviewDevicesOpen = () => useContext(EditorCoreCtx).previewDevicesOpen;
export const useEditorPreviewDevicesOpenSetter = () => useContext(EditorCoreCtx).setPreviewDevicesOpen;

export const useEditorCropToolOpen = () => useContext(EditorCoreCtx).cropToolOpen;
export const useEditorCropToolOpenSetter = () => useContext(EditorCoreCtx).setCropToolOpen;

export const useEditorHideUISetter = () => useContext(EditorCoreCtx).setHideUI;