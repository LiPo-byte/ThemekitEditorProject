import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { EditorCore } from '@/editor-core';
import fontManifest from './components/font-manifest.json';

const FONT_FACE_STYLE_ID = 'editor-font-face-manifest';
const FONT_LOAD_TIMEOUT_MS = 4000;

type FontManifestItem = {
  file?: string;
  postscriptName?: string;
};

const MANIFEST_FONTS = (fontManifest as FontManifestItem[]).filter(
  (item) => item.file && item.postscriptName,
);

type EditorCoreCtxValue = {
  /** EditorCore 实例，画布挂载前为 null */
  core: EditorCore | null;
  coreLoading: boolean;
  /** 字体是否已准备就绪 */
  fontsReady: boolean;
  /** 仅给画布组件用：注入/卸载实例 */
  setCore: (c: EditorCore | null) => void;
  leftPanlOpen: boolean;
  setLeftPanlOpen: (b: boolean) => void;
};

const EditorCoreCtx = createContext<EditorCoreCtxValue>({
  core: null,
  fontsReady: false,
  coreLoading: false,
  setCore: () => {},
  leftPanlOpen: false,
  setLeftPanlOpen: () => {},
});

/** 包裹整个编辑器页面，子组件可通过 useEditorCore 取到实例 */
export const EditorCoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [core, setCore] = useState<EditorCore | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [coreLoading, setCoreLoading] = useState(true);

  const [leftPanlOpen, setLeftPanlOpen] = useState(true);

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
        core,
        fontsReady,
        setCore,
        coreLoading,
        leftPanlOpen,
        setLeftPanlOpen,
    }),
    [
        core,
        fontsReady,
        coreLoading,
        leftPanlOpen,
    ],
  );
  return <EditorCoreCtx.Provider value={value}>{children}</EditorCoreCtx.Provider>;
};

/** 子组件读取 core 实例（未就绪返回 null，调用方自行判空） */
export const useEditorCore = () => useContext(EditorCoreCtx).core;
export const useEditorFontsReady = () => useContext(EditorCoreCtx).fontsReady;
export const useEditorCoreLoading = () => useContext(EditorCoreCtx).coreLoading;

/** 仅 EditorCanvas 用：在 useEffect 中注入/卸载实例 */
export const useEditorCoreSetter = () => useContext(EditorCoreCtx).setCore;

export const useEditorLeftPanlOpen = () => useContext(EditorCoreCtx).leftPanlOpen;
export const useEditorLeftPanlOpenSetter = () => useContext(EditorCoreCtx).setLeftPanlOpen;
