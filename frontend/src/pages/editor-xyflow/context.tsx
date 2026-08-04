import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { useReactFlow } from '@xyflow/react';
import type { Node as FlowNode } from '@xyflow/react';
import type { EditorCore } from '@/editor-core';
import { history, useLocation, useParams } from '@umijs/max';
import fontManifest from './components/font-manifest.json';
// import { nanoid } from 'nanoid';
// import { WidgetDefaultConfig } from '@/editor-core/defaultConfig';
// import { CONFIG_SIZE_MAP } from './widget/base-config'
import { widgetConfig2Nodes } from './widget/util';
import { iconPackConfig2Nodes } from './icon/util';
import { wallpaperConfig2Nodes, buildWallpaperConfigJson } from './wallpaper/util';
import { themeConfig2Nodes, buildThemeConfigJson } from './theme/util';

import { buildIconPackConfigJson } from './icon/buildIconPackConfig';

import { DEFAULT_CROP_PROPS } from './widget/base-config';

import { nanoid } from 'nanoid';
import { getProjectDetail, postApiV1Project, putApiV1ProjectElementsBatch } from './service';
import { toJpeg } from 'html-to-image';

const FONT_FACE_STYLE_ID = 'editor-xyflow-font-face-manifest';
const FONT_LOAD_TIMEOUT_MS = 4000;

const getFontFaceFormat = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'otf') return 'opentype';
  if (ext === 'woff') return 'woff';
  if (ext === 'woff2') return 'woff2';
  return 'truetype';
};

type FontManifestItem = {
  file?: string;
  postscriptName?: string;
};

const MANIFEST_FONTS = (fontManifest as FontManifestItem[]).filter(
  (item) => item.file && item.postscriptName,
);

export type LeftPanlContent = 'widget' | 'lockScreen' | 'theme' | 'wallpaper';

export type CropProps = {
  scaleX: number;
  scaleY: number;
  rotation: number;
  translateX: number;
  translateY: number;
};

// const DEFAULT_CROP_PROPS: CropProps = {
//   scaleX: 1,
//   scaleY: 1,
//   rotation: 0,
//   translateX: 0,
//   translateY: 0,
// };

const toCropProps = (value: unknown): CropProps => {
  if (!value || typeof value !== 'object') return { ...DEFAULT_CROP_PROPS };
  const source = value as Record<string, unknown>;
  const readNumber = (key: keyof CropProps, fallback: number) => {
    const next = source[key];
    return typeof next === 'number' && Number.isFinite(next) ? next : fallback;
  };
  return {
    scaleX: readNumber('scaleX', DEFAULT_CROP_PROPS.scaleX),
    scaleY: readNumber('scaleY', DEFAULT_CROP_PROPS.scaleY),
    rotation: readNumber('rotation', DEFAULT_CROP_PROPS.rotation),
    translateX: readNumber('translateX', DEFAULT_CROP_PROPS.translateX),
    translateY: readNumber('translateY', DEFAULT_CROP_PROPS.translateY),
  };
};


export type ViewFitOptions = {
  /** 留白比例，默认 0.1 */
  padding?: number;
  /** 动画时长(ms)，默认 300 */
  duration?: number;
};

type EditorCoreCtxValue = {
  projectId: string | null;
  projectName: string;
  setProjectName: (name: string) => void;
  fontsReady: boolean;
  nodes: FlowNode[];
  setNodes: React.Dispatch<React.SetStateAction<FlowNode[]>>;
  changeNodeProp: (updater: (prev: FlowNode[]) => FlowNode[]) => void;
  selectedNodesMap: Map<string, FlowNode>;
  actionPropNode: FlowNode;
  setActionPropNode: (node: FlowNode) => void;
  selectedBranchNodes: FlowNode[];
  selectedBranchNodeIds: string[];
  selectedBranchNodeIdsKey: string;
  getParentNodeData: (nodeId: string) => Record<string, any> | null;
  selectNode: (fn: FlowNode, append?: boolean) => void;
  deselectedNode: (nodeId?: string) => void;
  addWidget: (config: any) => string | undefined;
  addIconPack: (config: any) => string | undefined;
  addWallpaper: (config: any) => string | undefined;
  addTheme: (config: any) => string | undefined;
  /** 全览：把画布缩放平移到刚好容纳所有根元素 */
  fitView: (options?: ViewFitOptions) => void;
  /** 聚焦：把视角移到指定根元素；元素尚未落到 nodes 时会等它出现后再执行 */
  focusElement: (rootId: string, options?: ViewFitOptions) => void;
  deleteSelectedNodes: () => void;
  undo: () => void;
  redo: () => void;
  canDeleteSelected: boolean;
  canUndo: boolean;
  canRedo: boolean;
  leftPanlOpen: boolean;
  setLeftPanlOpen: (bool: boolean) => void;
  leftPanlContent: LeftPanlContent;
  setLeftPanlContent: (content: LeftPanlContent) => void;
  rightPanlOpen: boolean;
  setRightPanlOpen: (bool: boolean) => void;
  cropToolOpen: boolean;
  setCropToolOpen: (bool: boolean) => void;
  desktopEditOpen: boolean;
  hideUI: boolean;
  setHideUI: (bool: boolean) => void;
  importModalOpen: boolean;
  setImportModalOpen: (bool: boolean) => void;
  showAxis: boolean;
  setShowAxis: (bool: boolean) => void;
  backgroundVariant: 'lines' | 'dots' | 'cross';
  setBackgroundVariant: (variant: 'lines' | 'dots' | 'cross') => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  globalLoading: boolean;
  setGlobalLoading: (bool: boolean) => void;
  cropEditingNodeId: string;
  cropDraftProps: CropProps | null;
  setCropDraftProps: React.Dispatch<React.SetStateAction<CropProps | null>>;
  openCropEditor: (nodeId: string) => void;
  closeCropEditor: () => void;
  confirmCropEditor: () => void;
  desktopEditingNodeId: string;
  openDesktopEditor: (nodeId: string) => void;
  closeDesktopEditor: () => void;
  confirmDesktopEditor: () => void;
  /** ThemeHome 编辑态注册/清理 Confirm 时读取 showElements 的 getter */
  registerDesktopEditDraft: (getter: (() => any[] | null) | null) => void;
  generatePreviewImage: (rootId?: string) => Promise<string | null>;
  generateProjectPayload: () => Promise<Record<string, any> | null>;
  saveProjectPayload: () => Promise<Record<string, any> | null>;
  getElementsConfigMap: () => Record<string, any>;
};

const noopSetNodes: React.Dispatch<React.SetStateAction<FlowNode[]>> = () => {};
const noopChangeNodeProp = (_updater: (prev: FlowNode[]) => FlowNode[]) => {};
const noopSelectNode = (_fn: FlowNode, _append?: boolean) => {};
const noopDeselectedNode = (_nodeId?: string) => {};
const noopAddNodeGroup = (_config?: any): string | undefined => undefined;
const noopDeleteSelectedNodes = () => {};
const noopGetParentNodeData = (_nodeId: string) => null;

const EditorCoreCtx = createContext<EditorCoreCtxValue>({
  projectId: null,
  projectName: '',
  setProjectName: () => {},
  fontsReady: false,
  nodes: [],
  setNodes: noopSetNodes,
  changeNodeProp: noopChangeNodeProp,
  selectedNodesMap: new Map(),
  actionPropNode: {
    id: nanoid(),
    position: { x: 0, y: 0 },
    type: 'node-with-toolbar',
    data: { isVisible: false, actionList: [], },
  },
  setActionPropNode: (_node: FlowNode | null) => {},
  selectedBranchNodes: [],
  selectedBranchNodeIds: [],
  selectedBranchNodeIdsKey: '',
  getParentNodeData: noopGetParentNodeData,
  selectNode: noopSelectNode,
  deselectedNode: noopDeselectedNode,
  addWidget: noopAddNodeGroup,
  addIconPack: noopAddNodeGroup,
  addWallpaper: noopAddNodeGroup,
  addTheme: noopAddNodeGroup,
  fitView: (_options?: ViewFitOptions) => {},
  focusElement: (_rootId: string, _options?: ViewFitOptions) => {},
  deleteSelectedNodes: noopDeleteSelectedNodes,
  undo: () => {},
  redo: () => {},
  canDeleteSelected: false,
  canUndo: false,
  canRedo: false,
  leftPanlOpen: false,
  setLeftPanlOpen: (_bool: boolean) => {},
  leftPanlContent: 'widget',
  setLeftPanlContent: (_content: LeftPanlContent) => {},
  rightPanlOpen: false,
  setRightPanlOpen: (bool: boolean) => {},
  cropToolOpen: false,
  setCropToolOpen: (_bool: boolean) => {},
  desktopEditOpen: false,
  hideUI: false,
  setHideUI: (_bool: boolean) => {},
  importModalOpen: false,
  setImportModalOpen: (_bool: boolean) => {},
  showAxis: true,
  setShowAxis: (_bool: boolean) => {},
  backgroundVariant: 'dots',
  setBackgroundVariant: (_variant: 'lines' | 'dots' | 'cross') => {},
  backgroundColor: '#ffffff',
  setBackgroundColor: (_color: string) => {},
  globalLoading: false,
  setGlobalLoading: (_bool: boolean) => {},
  cropEditingNodeId: '',
  cropDraftProps: null,
  setCropDraftProps: () => {},
  openCropEditor: (_nodeId: string) => {},
  closeCropEditor: () => {},
  confirmCropEditor: () => {},
  desktopEditingNodeId: '',
  openDesktopEditor: (_nodeId: string) => {},
  closeDesktopEditor: () => {},
  confirmDesktopEditor: () => {},
  registerDesktopEditDraft: (_getter: (() => any[] | null) | null) => {},
  generatePreviewImage: async () => null,
  generateProjectPayload: async () => null,
  saveProjectPayload: async () => null,
  getElementsConfigMap: () => ({}),
});

const VIEW_FIT_PADDING = 0.1;
const VIEW_FIT_DURATION = 300;

// React Flow 内置 fitView 只统计 store 里 measured 尺寸非零的节点，而本项目 nodes 是受控
// 且没有接 onNodesChange，measured 恒为空，内置 fitView 因此永远算不出包围盒。这里改用
// root group 自身的 position + style 尺寸直接算，绕开 measured。
const getRootNodesBounds = (items: FlowNode[], rootIds?: Set<string>) => {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  items.forEach((node) => {
    if (node.type !== 'group' || node.parentId) return;
    if (rootIds && !rootIds.has(node.id)) return;
    const style = (node.style ?? {}) as { width?: number | string; height?: number | string };
    const width = Number(style.width);
    const height = Number(style.height);
    if (!(width > 0) || !(height > 0)) return;
    const x = Number(node.position?.x) || 0;
    const y = Number(node.position?.y) || 0;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

const cloneNodes = (items: FlowNode[]): FlowNode[] => {
  if (typeof structuredClone === 'function') {
    return structuredClone(items);
  }
  return JSON.parse(JSON.stringify(items)) as FlowNode[];
};

// 比较前后两次 nodes，找出发生变更（增/删/改）的节点所属的 root group id。
// 用于记录「最近改动过的 root」，给 generatePreviewImage 默认截图用。
const detectChangedRootId = (
  prev: FlowNode[],
  next: FlowNode[],
): string | null => {
  const prevById = new Map(prev.map((node) => [node.id, node] as const));
  const nextById = new Map(next.map((node) => [node.id, node] as const));
  const nextIdSet = new Set(next.map((node) => node.id));

  const changedIds: string[] = [];
  // 改/增：引用变了即视为改动（commitNodes 上游 updater 对未改节点会保留原引用）
  for (const node of next) {
    if (prevById.get(node.id) !== node) changedIds.push(node.id);
  }
  // 删
  for (const node of prev) {
    if (!nextIdSet.has(node.id)) changedIds.push(node.id);
  }
  if (!changedIds.length) return null;

  const parentOf = (id: string): string | undefined =>
    nextById.get(id)?.parentId ?? prevById.get(id)?.parentId;

  for (const id of changedIds) {
    const visited = new Set<string>();
    let cur = id;
    let rootId: string | null = null;
    while (cur && !visited.has(cur)) {
      visited.add(cur);
      const parentId = parentOf(cur);
      if (!parentId) {
        rootId = cur;
        break;
      }
      cur = parentId;
    }
    if (!rootId) continue;
    const rootNode = nextById.get(rootId) ?? prevById.get(rootId);
    if (rootNode?.type === 'group' && !rootNode.parentId) {
      return String(rootId);
    }
  }
  return null;
};

const ELEMENT_LOADERS: Record<
  string,
  ((configJson: any, element_key?: any) => { nodes: FlowNode[]; rootNode: FlowNode } | null | undefined)
> = {
  widget: (configJson, element_key) => widgetConfig2Nodes(configJson, element_key),
  iconpack: (configJson, element_key) => iconPackConfig2Nodes(configJson, element_key),
  wallpaper: (configJson, element_key) => wallpaperConfig2Nodes(configJson, element_key),
  theme: (configJson, element_key) => themeConfig2Nodes(configJson, element_key),
};

const mapProjectElementsToNodes = (elements: any[]): FlowNode[] => {
  if (!Array.isArray(elements)) return [];
  const allNodes: FlowNode[] = [];
  const normalizeNodes = (
    createdNodes: FlowNode[],
    rootNode: FlowNode,
    element: any,
  ) => {
    const rootKey = String(element.element_key ?? rootNode.id);
    const baseX =
      typeof element.x === 'number' && Number.isFinite(element.x) ? element.x : 0;
    const baseY =
      typeof element.y === 'number' && Number.isFinite(element.y) ? element.y : 0;

    return createdNodes.map((node: any) => {
      if (!node || typeof node !== 'object') return node;
      if (node.id === rootNode.id) {
        return {
          ...node,
          id: rootKey,
          position: { x: baseX, y: baseY },
        };
      }
      if (node.parentId === rootNode.id) {
        return {
          ...node,
          parentId: rootKey,
        };
      }
      return node;
    });
  };

  elements.forEach((element) => {
    if (!element) return;
    const configJson = element.config_json;
    // const key = element.key
    if (!configJson || typeof configJson !== 'object') return;
    const category = String(element.category || '');
    const loader = ELEMENT_LOADERS[category];
    if (!loader) return;
    const result = loader(configJson, element.element_key);
    if (!result?.nodes || !result.rootNode) return;
    const normalizedNodes = normalizeNodes(result.nodes, result.rootNode, element);
    allNodes.push(...(normalizedNodes as FlowNode[]));
  });
  return allNodes;
};

// /** 目前上下文只保留 nodes/setNodes */
export const EditorCoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const params = useParams<{ projectId?: string }>();
  const projectId = params.projectId ?? null;
  const creatingProjectRef = useRef(false);
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const [fontsReady, setFontsReady] = useState(false);
  const [nodes, setNodes] = useState<FlowNode[]>([]);

  const [selectedNodesMap, setSelectedNodesMapState] = useState<Map<string, FlowNode>>(
    new Map(),
  );
  const [actionPropNode, setActionPropNode] = useState<FlowNode>({
    id: nanoid(),
    position: { x: 0, y: 0 },
    type: 'node-with-toolbar',
    data: { isVisible: false, actionList: [], },
  });
  const [past, setPast] = useState<FlowNode[][]>([]);
  const [future, setFuture] = useState<FlowNode[][]>([]);

  const [leftPanlOpen, setLeftPanlOpen] = useState<boolean>(false);
  const [leftPanlContent, setLeftPanlContent] = useState<LeftPanlContent>('widget');
  const [rightPanlOpen, setRightPanlOpen] = useState<boolean>(false);
  const [cropToolOpen, setCropToolOpen] = useState<boolean>(false);
  const [desktopEditOpen, setDesktopEditOpen] = useState<boolean>(false);
  const [hideUI, setHideUI] = useState<boolean>(false);
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [showAxis, setShowAxis] = useState<boolean>(true);
  const [backgroundVariant, setBackgroundVariant] = useState<'lines' | 'dots' | 'cross'>('dots');
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [globalLoading, setGlobalLoading] = useState<boolean>(false);
  const [cropEditingNodeId, setCropEditingNodeId] = useState<string>('');
  const [cropDraftProps, setCropDraftProps] = useState<CropProps | null>(null);
  const [desktopEditingNodeId, setDesktopEditingNodeId] = useState<string>('');
  const desktopEditDraftGetterRef = useRef<(() => any[] | null) | null>(null);
  const previewSaveTimerRef = useRef<number | null>(null);
  const previewIdleHandleRef = useRef<number | null>(null);
  const previewSavingRef = useRef(false);
  const previewSaveTaskIdRef = useRef(0);
  const PREVIEW_CAPTURE_DELAY_MS = 1500;
  const lastChangedRootIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const prepareFonts = async () => {
      if (typeof document === 'undefined') return;
      if (!document.getElementById(FONT_FACE_STYLE_ID)) {
        const css = MANIFEST_FONTS.map((item) => {
          const fontFamily = item.postscriptName?.replace(/'/g, "\\'");
          const fileName = String(item.file);
          const fontUrl = `/fonts/${encodeURIComponent(fileName)}`;
          const format = getFontFaceFormat(fileName);
          return `@font-face{font-family:'${fontFamily}';src:url('${fontUrl}') format('${format}');font-style:normal;font-weight:100 900;font-display:swap;}`;
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
    if (params.projectId) return;
    if (creatingProjectRef.current) return;
    creatingProjectRef.current = true;
    const createProjectAndReplacePath = async () => {
      try {
        const { project_id: createdProjectId } = await postApiV1Project();
        const latestPath = history.location.pathname;
        if (latestPath.includes(`/${createdProjectId}`)) return;
        history.replace({
          pathname: `${location.pathname.replace(/\/$/, '')}/${createdProjectId}`,
          search: history.location.search,
          hash: history.location.hash,
        });
      } catch (error) {
        console.warn('[EditorCoreProvider] create project failed:', error);
      } finally {
        creatingProjectRef.current = false;
      }
    };
    void createProjectAndReplacePath();
  }, [location.pathname, params.projectId]);

  useEffect(() => {
    if (!projectId) return;
    let disposed = false;
    const loadProjectName = async () => {
      try {
        const detail = await getProjectDetail(projectId);
        if (disposed) return;
        if (detail?.name) {
          setProjectName(detail.name);
        }
        if (Array.isArray(detail?.elements)) {
          setNodes(mapProjectElementsToNodes(detail.elements));
        }
      } catch (error) {
        console.warn('[EditorCoreProvider] fetch project detail failed:', error);
      }
    };
    void loadProjectName();
    return () => {
      disposed = true;
    };
  }, [projectId]);

  const selectNode = (fn: FlowNode, append = false) => {
    setRightPanlOpen(true);
    setSelectedNodesMapState((prev) => {
      const nodeById = new Map(nodes.map((node) => [node.id, node] as const));
      const targetNode = nodeById.get(fn.id) ?? fn;
      const next = append ? new Map(prev) : new Map<string, FlowNode>();
      next.set(targetNode.id, targetNode);

      // 统一清洗：若父元素已选中，则移除子元素。
      const selectedIds = Array.from(next.keys());
      selectedIds.forEach((id) => {
        let parentId = nodeById.get(id)?.parentId;
        while (parentId) {
          if (next.has(parentId)) {
            next.delete(id);
            break;
          }
          parentId = nodeById.get(parentId)?.parentId;
        }
      });

      return next;
    });
  };

  const deselectedNode = (nodeId?: string) => {
    if (!nodeId) {
      setSelectedNodesMapState(new Map());
      return;
    }
    setSelectedNodesMapState((prev) => {
      if (!prev.has(nodeId)) return prev;
      const next = new Map(prev);
      next.delete(nodeId);
      return next;
    });
  };

  useEffect(() => {
    setNodes((prevNodes) => {
      let changed = false;
      const nextNodes = prevNodes.map((node) => {
        const isSelected = selectedNodesMap.has(node.id);
        if (Boolean(node.selected) === isSelected) {
          return node;
        }
        changed = true;
        return {
          ...node,
          selected: isSelected,
        };
      });

      return changed ? nextNodes : prevNodes;
    });
  }, [selectedNodesMap]);

  // 撤销回退
  const commitNodes = (updater: (prev: FlowNode[]) => FlowNode[]) => {
    setNodes((prev) => {
      const next = updater(prev);
      const changedRootId = detectChangedRootId(prev, next);
      if (changedRootId) {
        lastChangedRootIdRef.current = changedRootId;
      }
      setPast((prevPast) => [...prevPast, cloneNodes(prev)]);
      setFuture([]);
      return cloneNodes(next);
    });
  };

  const undo = () => {
    setPast((prevPast) => {
      if (!prevPast.length) return prevPast;
      const target = prevPast[prevPast.length - 1];
      setNodes((current) => {
        setFuture((prevFuture) => [...prevFuture, cloneNodes(current)]);
        return cloneNodes(target);
      });
      return prevPast.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((prevFuture) => {
      if (!prevFuture.length) return prevFuture;
      const target = prevFuture[prevFuture.length - 1];
      setNodes((current) => {
        setPast((prevPast) => [...prevPast, cloneNodes(current)]);
        return cloneNodes(target);
      });
      return prevFuture.slice(0, -1);
    });
  };

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  // 撤销回退

  const { fitBounds } = useReactFlow();
  const nodesRef = useRef<FlowNode[]>(nodes);
  const pendingFocusRef = useRef<{ rootId: string; options?: ViewFitOptions } | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const applyBounds = useCallback(
    (
      bounds: { x: number; y: number; width: number; height: number },
      options?: ViewFitOptions,
    ) => {
      fitBounds(bounds, {
        padding: options?.padding ?? VIEW_FIT_PADDING,
        duration: options?.duration ?? VIEW_FIT_DURATION,
      });
    },
    [fitBounds],
  );

  const fitView = useCallback(
    (options?: ViewFitOptions) => {
      const bounds = getRootNodesBounds(nodesRef.current);
      if (!bounds) return;
      applyBounds(bounds, options);
    },
    [applyBounds],
  );

  const focusElement = useCallback(
    (rootId: string, options?: ViewFitOptions) => {
      if (!rootId) return;
      const bounds = getRootNodesBounds(nodesRef.current, new Set([rootId]));
      // 新增元素后 nodes 是异步提交的，此时算不出包围盒，先挂起等节点入场
      if (!bounds) {
        pendingFocusRef.current = { rootId, options };
        return;
      }
      applyBounds(bounds, options);
    },
    [applyBounds],
  );

  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    const bounds = getRootNodesBounds(nodes, new Set([pending.rootId]));
    if (!bounds) return;
    pendingFocusRef.current = null;
    applyBounds(bounds, pending.options);
  }, [nodes, applyBounds]);

  const appendNodesBySlot = (newNodes: FlowNode[], rootNode: FlowNode) => {
    const COLUMN_COUNT = 6;
    const DEFAULT_GAP = 100;
    const ROW_TOLERANCE = 4;

    const readNumber = (value: unknown) => {
      const num = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(num) ? num : 0;
    };

    const getNodeSize = (node: FlowNode) => {
      const style = (node.style ?? {}) as { width?: number | string; height?: number | string };
      const measured = ((node as any).measured ?? {}) as { width?: number; height?: number };
      return {
        width: readNumber(style.width ?? measured.width),
        height: readNumber(style.height ?? measured.height),
      };
    };

    const resolveNextPosition = (prevNodes: FlowNode[], targetNode: FlowNode) => {
      const roots = prevNodes.filter((node) => node.type === 'group' && !node.parentId);
      if (!roots.length) return { x: 0, y: 0 };

      const rows: Array<{
        y: number;
        bottom: number;
        nodes: Array<{ node: FlowNode; x: number; width: number }>;
        maxRight: number;
        minX: number;
      }> = [];

      const sortedRoots = [...roots].sort((a, b) => {
        const ay = readNumber(a.position?.y);
        const by = readNumber(b.position?.y);
        if (ay !== by) return ay - by;
        return readNumber(a.position?.x) - readNumber(b.position?.x);
      });

      sortedRoots.forEach((node) => {
        const x = readNumber(node.position?.x);
        const y = readNumber(node.position?.y);
        const size = getNodeSize(node);
        const row = rows.find((item) => Math.abs(item.y - y) <= ROW_TOLERANCE);
        const entry = { node, x, width: size.width };
        if (row) {
          row.nodes.push(entry);
          row.maxRight = Math.max(row.maxRight, x + size.width);
          row.minX = Math.min(row.minX, x);
          row.bottom = Math.max(row.bottom, y + size.height);
        } else {
          rows.push({
            y,
            bottom: y + size.height,
            nodes: [entry],
            maxRight: x + size.width,
            minX: x,
          });
        }
      });

      rows.forEach((row) => {
        row.nodes.sort((a, b) => a.x - b.x);
      });
      rows.sort((a, b) => a.y - b.y);

      let gapX = DEFAULT_GAP;
      let gapY = DEFAULT_GAP;
      rows.forEach((row) => {
        for (let index = 1; index < row.nodes.length; index += 1) {
          const prev = row.nodes[index - 1];
          const current = row.nodes[index];
          const candidate = current.x - (prev.x + prev.width);
          if (candidate > 0) {
            gapX = Math.min(gapX, candidate);
          }
        }
      });
      for (let index = 1; index < rows.length; index += 1) {
        const prev = rows[index - 1];
        const current = rows[index];
        const candidate = current.y - prev.bottom;
        if (candidate > 0) {
          gapY = Math.min(gapY, candidate);
        }
      }

      const rowWithSpace = rows.find((row) => row.nodes.length < COLUMN_COUNT);
      if (rowWithSpace) {
        return {
          x: rowWithSpace.maxRight + gapX,
          y: rowWithSpace.y,
        };
      }

      const lastRow = rows[rows.length - 1];
      const minRowX = Math.min(...rows.map((row) => row.minX));
      return {
        x: Number.isFinite(minRowX) ? minRowX : 0,
        y: lastRow.bottom + gapY,
      };
    };

    commitNodes((prev) => {
      const nextPosition = resolveNextPosition(prev, rootNode);

      const patchedNodes = cloneNodes(newNodes);
      const rootNodeIndex = patchedNodes.findIndex(
        (node) => node.id === rootNode.id && node.type === 'group' && !node.parentId,
      );
      if (rootNodeIndex >= 0) {
        patchedNodes[rootNodeIndex] = {
          ...patchedNodes[rootNodeIndex],
          position: nextPosition,
        };
      }

      return [...prev, ...patchedNodes];
    });

    // nodes 提交后才算得出包围盒，focusElement 内部会挂起等节点入场
    focusElement(String(rootNode.id));
  };

  const addIconPack = (config: any) => {
    const { nodes: newNodes, rootNode } = iconPackConfig2Nodes(config);
    if (!rootNode) return undefined;
    appendNodesBySlot(newNodes, rootNode);
    return String(rootNode.id);
  };
  const addWidget = (config: any) => {
    const { nodes: newNodes, rootNode } = widgetConfig2Nodes(config);
    if (!rootNode) return undefined;
    appendNodesBySlot(newNodes, rootNode);
    return String(rootNode.id);
  };
  const addWallpaper = (config: any) => {
    const { nodes: newNodes, rootNode } = wallpaperConfig2Nodes(config);
    if (!rootNode) return undefined;
    appendNodesBySlot(newNodes, rootNode);
    return String(rootNode.id);
  };
  const addTheme = (config: any) => {
    const { nodes: newNodes, rootNode } = themeConfig2Nodes(config);
    if (!rootNode) return undefined;
    appendNodesBySlot(newNodes, rootNode);
    return String(rootNode.id);
  };

  const selectedBranchNodes = useMemo(
    () => {
      if (!selectedNodesMap.size) return [];

      const nodeById = new Map(nodes.map((node) => [node.id, node] as const));
      const childrenByParent = new Map<string, FlowNode[]>();
      nodes.forEach((node) => {
        if (!node.parentId) return;
        const list = childrenByParent.get(node.parentId) ?? [];
        list.push(node);
        childrenByParent.set(node.parentId, list);
      });

      const visited = new Set<string>();
      const result: FlowNode[] = [];
      const stack = Array.from(selectedNodesMap.keys());

      while (stack.length) {
        const currentId = stack.pop()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const currentNode = nodeById.get(currentId);
        if (!currentNode) continue;
        result.push(currentNode);

        const children = childrenByParent.get(currentId);
        if (!children?.length) continue;
        for (let i = children.length - 1; i >= 0; i -= 1) {
          stack.push(children[i].id);
        }
      }

      return result;
    },
    [nodes, selectedNodesMap],
  );
  const selectedBranchNodeIds = useMemo(
    () => selectedBranchNodes.map((node) => node.id),
    [selectedBranchNodes],
  );
  const selectedBranchNodeIdsKey = useMemo(
    () => selectedBranchNodeIds.join(','),
    [selectedBranchNodeIds],
  );

  useEffect(() => {
    const action:any = [];
    let nodeid:string = ';'
    if (selectedNodesMap.size === 1) {
      selectedNodesMap.forEach((node: any, id: string) => {
        const { packable, deleteable, cropable, desktopeditable, data } = node;
        packable && action.push('packable');
        deleteable && action.push('deleteable');
        cropable && data && data.source && action.push('cropable');
        desktopeditable && action.push('desktopeditable');
        nodeid = id;
      })
    }
    if (action.length) {
      setActionPropNode({
        ...actionPropNode,
        data: {
          nodeId: nodeid,
          actionList: action,
          isVisible: true,
        }
      })
    } else {
      setActionPropNode({
        ...actionPropNode,
        data: {
          nodeId: '',
          actionList: [],
          isVisible: false,
        }
      })
    }
  }, [selectedNodesMap])

  const getParentNodeData = (nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId);
    if (!node?.parentId) return null;
    const parentNode = nodes.find((item) => item.id === node.parentId);
    return (parentNode?.data as Record<string, any> | undefined) ?? null;
  };

  const selectedDirectNodes = useMemo(
    () =>
      Array.from(selectedNodesMap.keys())
        .map((id) => nodes.find((node) => node.id === id))
        .filter((node): node is FlowNode => Boolean(node)),
    [nodes, selectedNodesMap],
  );

  const canDeleteSelected =
    selectedDirectNodes.length > 0 &&
    selectedDirectNodes.every((node) => !node.parentId);

  const deleteSelectedNodes = () => {
    if (!canDeleteSelected) return;
    const rootIds = selectedDirectNodes.map((node) => node.id);
    const idsToDelete = new Set<string>();
    const stack = [...rootIds];
    const childrenByParent = new Map<string, string[]>();
    nodes.forEach((node) => {
      if (!node.parentId) return;
      const list = childrenByParent.get(node.parentId) ?? [];
      list.push(node.id);
      childrenByParent.set(node.parentId, list);
    });
    while (stack.length) {
      const currentId = stack.pop()!;
      if (idsToDelete.has(currentId)) continue;
      idsToDelete.add(currentId);
      const children = childrenByParent.get(currentId) ?? [];
      for (let i = 0; i < children.length; i += 1) {
        stack.push(children[i]);
      }
    }

    commitNodes((prev) => prev.filter((node) => !idsToDelete.has(node.id)));
    setSelectedNodesMapState(new Map());
    setRightPanlOpen(false);
  };

  const registerDesktopEditDraft = useCallback(
    (getter: (() => any[] | null) | null) => {
      desktopEditDraftGetterRef.current = getter;
    },
    [],
  );

  const closeDesktopEditor = () => {
    desktopEditDraftGetterRef.current = null;
    setDesktopEditOpen(false);
    setHideUI(false);
    setDesktopEditingNodeId('');
  };

  const openDesktopEditor = (nodeId: string) => {
    if (!nodeId) return;
    const targetNode = nodes.find((node) => node.id === nodeId) as
      | (FlowNode & { desktopeditable?: boolean })
      | undefined;
    if (!targetNode?.desktopeditable) return;
    if (cropToolOpen) {
      setCropToolOpen(false);
      setCropEditingNodeId('');
      setCropDraftProps(null);
    }
    setDesktopEditingNodeId(nodeId);
    setHideUI(true);
    setDesktopEditOpen(true);
  };

  const confirmDesktopEditor = () => {
    const nodeId = desktopEditingNodeId;
    const nextShowElements = desktopEditDraftGetterRef.current?.() ?? null;
    if (nodeId && Array.isArray(nextShowElements)) {
      commitNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id !== nodeId) return node;
          const prevData =
            (node.data as Record<string, unknown> | undefined) ?? {};
          return {
            ...node,
            data: {
              ...prevData,
              showElements: nextShowElements,
            },
          };
        }),
      );
    }
    closeDesktopEditor();
  };

  const openCropEditor = (nodeId: string) => {
    if (!nodeId) return;
    if (desktopEditOpen) {
      setDesktopEditOpen(false);
      setDesktopEditingNodeId('');
    }
    const targetNode = nodes.find((node) => node.id === nodeId);
    const nextCropProps = toCropProps((targetNode?.data as Record<string, unknown> | undefined)?.crop_props);
    setCropEditingNodeId(nodeId);
    setCropDraftProps(nextCropProps);
    setHideUI(true);
    setCropToolOpen(true);
  };

  const closeCropEditor = () => {
    setCropToolOpen(false);
    setHideUI(false);
    setCropEditingNodeId('');
    setCropDraftProps(null);
  };

  const confirmCropEditor = () => {
    if (!cropEditingNodeId || !cropDraftProps) {
      closeCropEditor();
      return;
    }
    commitNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id !== cropEditingNodeId) return node;
        return {
          ...node,
          data: {
            ...(node.data as Record<string, unknown>),
            crop_props: cropDraftProps,
          },
        };
      }),
    );
    closeCropEditor();
  };

  const generatePreviewImage = async (rootId?: string) => {
    if (typeof document === 'undefined') return null;

    // 截指定 root widget 的整片区域（含它所有 platform + size 子节点）。
    // 未传 rootId 时优先截「最近改动过的 root」，再 fallback 到画布上第一个 root。
    // 做法：把 viewport 当作截图源，通过覆写它的 transform 让内容按 1x 世界坐标
    // 渲染，同时把 canvas 尺寸限制为 root 的 bbox，从而把画面裁到 root 那块。
    const lastChangedRootId = lastChangedRootIdRef.current;
    const targetRoot = rootId
      ? nodes.find(
          (node) =>
            String(node.id) === String(rootId) &&
            node.type === 'group' &&
            !node.parentId,
        )
      : nodes.find(
          (node) =>
            String(node.id) === String(lastChangedRootId) &&
            node.type === 'group' &&
            !node.parentId,
        ) ?? nodes.find((node) => node.type === 'group' && !node.parentId);
    if (!targetRoot) return null;

    const resolvedRootId = String(targetRoot.id ?? '');
    if (!resolvedRootId) return null;
    const safeId =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(resolvedRootId)
        : resolvedRootId;
    const rootEl = document.querySelector(
      `.xyflow-stage .react-flow__node[data-id="${safeId}"]`,
    ) as HTMLElement | null;
    if (!rootEl) return null;

    const viewportEl = document.querySelector(
      '.xyflow-stage .react-flow__viewport',
    ) as HTMLElement | null;
    if (!viewportEl) return null;

    // 世界坐标下的位置来自 node.position；宽高优先取 node.style/measured，
    // 兜底用 rootEl.offsetWidth/Height（也是世界坐标，不含 viewport scale）
    const rootPos = (targetRoot.position ?? {}) as { x?: number; y?: number };
    const rootStyle = (targetRoot.style ?? {}) as {
      width?: number | string;
      height?: number | string;
    };
    const rootMeasured = ((targetRoot as any).measured ?? {}) as {
      width?: number;
      height?: number;
    };
    const rootX = Number(rootPos.x ?? 0);
    const rootY = Number(rootPos.y ?? 0);
    const rootW =
      Number(rootStyle.width) ||
      Number(rootMeasured.width) ||
      rootEl.offsetWidth;
    const rootH =
      Number(rootStyle.height) ||
      Number(rootMeasured.height) ||
      rootEl.offsetHeight;
    if (!rootW || !rootH) return null;

    // 列表卡片只需缩略图：限制输出边长，避免 pixelRatio=3 的巨图导致列表 hover/点击卡顿
    const previewMax = 320;
    const scale = Math.min(1, previewMax / rootW, previewMax / rootH);
    const outW = Math.max(1, Math.round(rootW * scale));
    const outH = Math.max(1, Math.round(rootH * scale));

    try {
      return await toJpeg(viewportEl, {
        pixelRatio: 1,
        quality: 0.82,
        backgroundColor: '#ffffff',
        cacheBust: true,
        width: outW,
        height: outH,
        style: {
          transform: `scale(${scale}) translate(${-rootX}px, ${-rootY}px)`,
          transformOrigin: '0 0',
        },
      });
    } catch (error) {
      console.warn('[EditorCoreProvider] generate preview image failed:', error);
      return null;
    }
  };

  const buildWidgetElementPayload = (rootNode: FlowNode) => {
    const platformNodes = nodes.filter(
      (node) => (node.type === 'platform_group') && node.parentId === rootNode.id,
    );
    const pickPlatformNode = (platform: 'ios' | 'android' | 'common') => {
      const bySuffix = platformNodes.find((node) => String(node.id).endsWith(`_${platform}`));
      if (bySuffix) return bySuffix;
      const bySystem = platformNodes.find((node) => {
        const system = String((node.data as Record<string, any>)?.system ?? '').toLowerCase();
        return system === platform;
      });
      if (bySystem) return bySystem;
      const sorted = [...platformNodes].sort(
        (a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0),
      );
      if (sorted.length >= 2) {
        if (platform === 'ios') return sorted[0];
        if (platform === 'android') return sorted[1];
        return undefined;
      }
      return undefined;
    };
    const buildPlatformConfig = (platformNode: FlowNode | undefined) => {
      if (!platformNode) return null;
      const platformData = ((platformNode.data as Record<string, any>) ?? {}) as Record<string, any>;
      const sizeNodes = nodes
        .filter((node: any) => node.parentId === platformNode.id && node.metaable)
        .map((node) => ({ ...((node.data as Record<string, any>) ?? {}) }))
        .sort((a: any, b: any) => Number(a.size ?? 0) - Number(b.size ?? 0));
      return {
        ...platformData,
        sizes: sizeNodes,
      };
    };

    const iosConfig = buildPlatformConfig(pickPlatformNode('ios'));
    const androidConfig = buildPlatformConfig(pickPlatformNode('android'));
    const commonConfig = buildPlatformConfig(pickPlatformNode('common'));
    const config_json = {
      ios: iosConfig?.sizes.length ? iosConfig : undefined,
      android: androidConfig?.sizes.length ? androidConfig : undefined,
      common: commonConfig?.sizes.length ? commonConfig : undefined,
    };

    return {
      element_key: rootNode.id,
      category: 'widget',
      subtype: 'time',
      x: rootNode.position?.x ?? 0,
      y: rootNode.position?.y ?? 0,
      visible: true,
      locked: false,
      schema_version: 1,
      config_json,
    };
  };

  const buildIconPackElementPayload = (rootNode: FlowNode) => ({
    element_key: rootNode.id,
    category: 'iconpack',
    subtype: 'iconpack',
    x: rootNode.position?.x ?? 0,
    y: rootNode.position?.y ?? 0,
    visible: true,
    locked: false,
    schema_version: 1,
    config_json: buildIconPackConfigJson(rootNode, nodes),
  });

  const buildWallpaperElementPayload = (rootNode: FlowNode) => ({
    element_key: rootNode.id,
    category: 'wallpaper',
    subtype: 'wallpaper',
    x: rootNode.position?.x ?? 0,
    y: rootNode.position?.y ?? 0,
    visible: true,
    locked: false,
    schema_version: 1,
    config_json: buildWallpaperConfigJson(rootNode, nodes),
  });

  const buildThemeElementPayload = (rootNode: FlowNode) => {
    const sourceConfigMap: Record<string, any> = {};
    nodes
      .filter((node) => node.type === 'group' && !node.parentId && node.id !== rootNode.id)
      .forEach((root) => {
        const category =
          ((root.data as Record<string, any> | undefined)?.category as string) ?? 'widget';
        if (category === 'theme') return;
        if (category === 'iconpack') {
          sourceConfigMap[root.id] = buildIconPackConfigJson(root, nodes);
          return;
        }
        if (category === 'wallpaper') {
          sourceConfigMap[root.id] = buildWallpaperConfigJson(root, nodes);
          return;
        }
        if (category === 'widget') {
          sourceConfigMap[root.id] = buildWidgetElementPayload(root).config_json ?? {};
        }
      });

    return {
      element_key: rootNode.id,
      category: 'theme',
      subtype: 'theme',
      x: rootNode.position?.x ?? 0,
      y: rootNode.position?.y ?? 0,
      visible: true,
      locked: false,
      schema_version: 1,
      config_json: buildThemeConfigJson(rootNode, nodes, sourceConfigMap),
    };
  };

  const ELEMENT_BUILDERS: Record<
    string,
    ((rootNode: FlowNode) => Record<string, any>) | undefined
  > = {
    widget: buildWidgetElementPayload,
    iconpack: buildIconPackElementPayload,
    wallpaper: buildWallpaperElementPayload,
    theme: buildThemeElementPayload,
  };

  const buildElementsPayloadFromNodes = () => {
    const rootNodes = nodes.filter((node) => node.type === 'group' && !node.parentId);
    const elements: any[] = [];
    rootNodes.forEach((rootNode) => {
      const category = (rootNode.data as Record<string, any> | undefined)?.category ?? 'widget';
      const builder = ELEMENT_BUILDERS[category];
      if (!builder) return;
      elements.push(builder(rootNode));
    });
    return elements;
  };

  const elementsConfigMap = useMemo(() => {
    const map: Record<string, any> = {};
    buildElementsPayloadFromNodes().forEach((element) => {
      const key = String(element?.element_key ?? '');
      if (!key) return;
      map[key] = element?.config_json ?? {};
    });
    return map;
  }, [nodes]);

  const getElementsConfigMap = useMemo(
    () => () => elementsConfigMap,
    [elementsConfigMap],
  );

  const generateProjectPayload = async () => {
    if (!projectId) return null;
    let projectDetail: Record<string, any> | null = null;
    try {
      projectDetail = await getProjectDetail(projectId);
    } catch (error) {
      console.warn('[EditorCoreProvider] generate payload detail fetch failed:', error);
    }

    // console.time('生成预览图');
    // const previewImage = await generatePreviewImage();
    // console.timeEnd('生成预览图');
    return {
      project_id: projectId,
      name: projectName,
      status: projectDetail?.status ?? 'draft',
      current_version: projectDetail?.current_version ?? 0,
      // preview_image: previewImage ?? projectDetail?.preview_image ?? null,
      created_at: projectDetail?.created_at ?? null,
      updated_at: new Date().toISOString(),
      elements: buildElementsPayloadFromNodes(),
    };
  };

  const saveProjectPayload = async () => {
    if (!projectId) return null;
    const payload = {
      project_id: projectId,
      updated_at: new Date().toISOString(),
      elements: buildElementsPayloadFromNodes(),
    };
    try {
      const response = await putApiV1ProjectElementsBatch(projectId, {
        elements: payload.elements ?? [],
      });
      previewSaveTaskIdRef.current += 1;
      const currentTaskId = previewSaveTaskIdRef.current;
      if (previewSaveTimerRef.current !== null) {
        window.clearTimeout(previewSaveTimerRef.current);
      }
      if (
        previewIdleHandleRef.current !== null
        && typeof window !== 'undefined'
        && 'cancelIdleCallback' in window
      ) {
        (window as any).cancelIdleCallback(previewIdleHandleRef.current);
        previewIdleHandleRef.current = null;
      }
      previewSaveTimerRef.current = window.setTimeout(() => {
        previewSaveTimerRef.current = null;
        const doSavePreview = async () => {
          if (currentTaskId !== previewSaveTaskIdRef.current) return;
          if (previewSavingRef.current) return;
          previewSavingRef.current = true;
          try {
            const previewImage = await generatePreviewImage();
            if (currentTaskId !== previewSaveTaskIdRef.current) return;
            if (!previewImage) return;
            await putApiV1ProjectElementsBatch(projectId, {
              preview_image: previewImage,
            });
          } catch (error) {
            console.warn('[EditorCoreProvider] async save preview image failed:', error);
          } finally {
            previewSavingRef.current = false;
          }
        };
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          const runWhenIdle = () => {
            previewIdleHandleRef.current = (window as any).requestIdleCallback(
              (deadline: IdleDeadline) => {
                previewIdleHandleRef.current = null;
                if (currentTaskId !== previewSaveTaskIdRef.current) return;
                const isInputPending =
                  (navigator as any)?.scheduling?.isInputPending?.() ?? false;
                if (isInputPending || deadline.timeRemaining() < 8) {
                  runWhenIdle();
                  return;
                }
                void doSavePreview();
              },
              { timeout: 10000 },
            );
          };
          runWhenIdle();
          return;
        }
        void doSavePreview();
      }, PREVIEW_CAPTURE_DELAY_MS);
      return { payload, response };
    } catch (error) {
      console.warn('[EditorCoreProvider] save project payload failed:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!hideUI) return;
    setLeftPanlOpen(false);
    setRightPanlOpen(false);
  }, [hideUI]);

  useEffect(
    () => () => {
      if (previewSaveTimerRef.current !== null) {
        window.clearTimeout(previewSaveTimerRef.current);
        previewSaveTimerRef.current = null;
      }
      if (
        previewIdleHandleRef.current !== null
        && typeof window !== 'undefined'
        && 'cancelIdleCallback' in window
      ) {
        (window as any).cancelIdleCallback(previewIdleHandleRef.current);
        previewIdleHandleRef.current = null;
      }
    },
    [],
  );

  const value = useMemo<EditorCoreCtxValue>(
    () => ({
      projectId,
      projectName,
      setProjectName,
      fontsReady,
      nodes,
      setNodes,
      changeNodeProp: commitNodes,
      selectedNodesMap,
      actionPropNode,
      setActionPropNode,
      selectedBranchNodes,
      selectedBranchNodeIds,
      selectedBranchNodeIdsKey,
      getParentNodeData,
      selectNode,
      deselectedNode,
      addWidget,
      addIconPack,
      addWallpaper,
      addTheme,
      fitView,
      focusElement,
      deleteSelectedNodes,
      undo,
      redo,
      canDeleteSelected,
      canUndo,
      canRedo,
      leftPanlOpen,
      setLeftPanlOpen,
      leftPanlContent,
      setLeftPanlContent,
      rightPanlOpen,
      setRightPanlOpen,
      cropToolOpen,
      setCropToolOpen,
      desktopEditOpen,
      hideUI,
      setHideUI,
      importModalOpen,
      setImportModalOpen,
      showAxis,
      setShowAxis,
      backgroundVariant,
      setBackgroundVariant,
      backgroundColor,
      setBackgroundColor,
      globalLoading,
      setGlobalLoading,
      cropEditingNodeId,
      cropDraftProps,
      setCropDraftProps,
      openCropEditor,
      closeCropEditor,
      confirmCropEditor,
      desktopEditingNodeId,
      openDesktopEditor,
      closeDesktopEditor,
      confirmDesktopEditor,
      registerDesktopEditDraft,
      generatePreviewImage,
      generateProjectPayload,
      saveProjectPayload,
      getElementsConfigMap,
    }),
    [
      nodes,
      projectId,
      projectName,
      fontsReady,
      selectedNodesMap,
      actionPropNode,
      selectedBranchNodes,
      selectedBranchNodeIds,
      selectedBranchNodeIdsKey,
      selectedDirectNodes,
      getParentNodeData,
      fitView,
      focusElement,
      deleteSelectedNodes,
      canDeleteSelected,
      canUndo,
      canRedo,
      leftPanlOpen,
      leftPanlContent,
      rightPanlOpen,
      cropToolOpen,
      desktopEditOpen,
      hideUI,
      importModalOpen,
      showAxis,
      backgroundVariant,
      backgroundColor,
      globalLoading,
      cropEditingNodeId,
      cropDraftProps,
      desktopEditingNodeId,
      registerDesktopEditDraft,
      generatePreviewImage,
      generateProjectPayload,
      saveProjectPayload,
      getElementsConfigMap,
    ],
  );

  return <EditorCoreCtx.Provider value={value}>{children}</EditorCoreCtx.Provider>;
};

export const useEditorNodes = () => useContext(EditorCoreCtx).nodes;
export const useEditorNodesSetter = () => useContext(EditorCoreCtx).setNodes;
export const useEditorChangeNodeProp = () => useContext(EditorCoreCtx).changeNodeProp;
export const useEditorSelectedNodesMap = () => useContext(EditorCoreCtx).selectedNodesMap;
export const useEditorActionPropNode = () => useContext(EditorCoreCtx).actionPropNode;
export const useEditorActionPropNodeSetter = () => useContext(EditorCoreCtx).setActionPropNode;
export const useEditorSelectedBranchNodes = () => useContext(EditorCoreCtx).selectedBranchNodes;
export const useEditorSelectedBranchNodeIds = () => useContext(EditorCoreCtx).selectedBranchNodeIds;
export const useEditorSelectedBranchNodeIdsKey = () =>
  useContext(EditorCoreCtx).selectedBranchNodeIdsKey;
export const useEditorGetParentNodeData = () => useContext(EditorCoreCtx).getParentNodeData;
export const useEditorSelectNode = () => useContext(EditorCoreCtx).selectNode;
export const useEditorDeselectedNode = () => useContext(EditorCoreCtx).deselectedNode;
export const useEditorAddWidget = () => useContext(EditorCoreCtx).addWidget;
export const useEditorAddIconPack = () => useContext(EditorCoreCtx).addIconPack;
export const useEditorAddWallpaper = () => useContext(EditorCoreCtx).addWallpaper;
export const useEditorAddTheme = () => useContext(EditorCoreCtx).addTheme;
export const useEditorFitView = () => useContext(EditorCoreCtx).fitView;
export const useEditorFocusElement = () => useContext(EditorCoreCtx).focusElement;
export const useEditorDeleteSelectedNodes = () => useContext(EditorCoreCtx).deleteSelectedNodes;
export const useEditorUndo = () => useContext(EditorCoreCtx).undo;
export const useEditorRedo = () => useContext(EditorCoreCtx).redo;
export const useEditorCanDeleteSelected = () => useContext(EditorCoreCtx).canDeleteSelected;
export const useEditorCanUndo = () => useContext(EditorCoreCtx).canUndo;
export const useEditorCanRedo = () => useContext(EditorCoreCtx).canRedo;
export const useEditorRightPanlOpen = () => useContext(EditorCoreCtx).rightPanlOpen;
export const useEditorRightPanlOpenSetter = () => useContext(EditorCoreCtx).setRightPanlOpen;

/**
 * 兼容旧导出：其他文件暂未迁移时避免直接报错。
 * 如果未来确认不再需要，可整块删除。
 */
export type ProjectAutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

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

const noop = () => {};
const noopStringSetter = (_value: string) => {};
const noopBooleanSetter = (_value: boolean) => {};
const noopCoreSetter = (_core: EditorCore | null) => {};
const noopUISetter = (_patch: Partial<EditorUIVisibility>) => {};

export const useEditorCore = () => null as EditorCore | null;
export const useEditorProjectId = () => useContext(EditorCoreCtx).projectId;
export const useEditorProjectName = () => useContext(EditorCoreCtx).projectName;
export const useEditorProjectNameSetter = () => useContext(EditorCoreCtx).setProjectName;
export const useEditorSaveStatus = () => 'idle' as ProjectAutoSaveStatus;
export const useEditorLastSavedAt = () => null as string | null;
export const useEditorSaveAllNow = () => noop;
export const useEditorFontsReady = () => useContext(EditorCoreCtx).fontsReady;
export const useEditorCoreLoading = () => false;
export const useEditorCoreSetter = () => noopCoreSetter;
export const useEditorUIVisibility = () => DEFAULT_EDITOR_UI_VISIBILITY;
export const useEditorUIVisibilitySetter = () => noopUISetter;
export const useEditorLeftPanlOpen = () => useContext(EditorCoreCtx).leftPanlOpen;
export const useEditorLeftPanlOpenSetter = () => useContext(EditorCoreCtx).setLeftPanlOpen;
export const useEditorLeftPanlContent = () => useContext(EditorCoreCtx).leftPanlContent;
export const useEditorLeftPanlContentSetter = () => useContext(EditorCoreCtx).setLeftPanlContent;
// export const useEditorRightPanlOpen = () => DEFAULT_EDITOR_UI_VISIBILITY.rightPanel;
// export const useEditorRightPanlOpenSetter = () => noopBooleanSetter;
export const useEditorToolbarVisible = () => DEFAULT_EDITOR_UI_VISIBILITY.editorToolbar && !useContext(EditorCoreCtx).hideUI;
export const useEditorBottomToolBarVisible = () => DEFAULT_EDITOR_UI_VISIBILITY.bottomToolBar && !useContext(EditorCoreCtx).hideUI;
export const useEditorHeaderControlsVisible = () => DEFAULT_EDITOR_UI_VISIBILITY.headerControls && !useContext(EditorCoreCtx).hideUI;
export const useEditorZoomToolBarVisible = () => DEFAULT_EDITOR_UI_VISIBILITY.zoomToolBar;
export const useEditorPreviewDevicesOpen = () => false;
export const useEditorPreviewDevicesOpenSetter = () => noopBooleanSetter;
export const useEditorCropToolOpen = () => useContext(EditorCoreCtx).cropToolOpen;
export const useEditorCropToolOpenSetter = () => useContext(EditorCoreCtx).setCropToolOpen;
export const useEditorHideUI = () => useContext(EditorCoreCtx).hideUI;
export const useEditorHideUISetter = () => useContext(EditorCoreCtx).setHideUI;
export const useEditorImportModalOpen = () => useContext(EditorCoreCtx).importModalOpen;
export const useEditorImportModalOpenSetter = () =>
  useContext(EditorCoreCtx).setImportModalOpen;
export const useEditorShowAxis = () => useContext(EditorCoreCtx).showAxis;
export const useEditorShowAxisSetter = () => useContext(EditorCoreCtx).setShowAxis;
export const useEditorBackgroundVariant = () => useContext(EditorCoreCtx).backgroundVariant;
export const useEditorBackgroundVariantSetter = () =>
  useContext(EditorCoreCtx).setBackgroundVariant;
export const useEditorBackgroundColor = () => useContext(EditorCoreCtx).backgroundColor;
export const useEditorBackgroundColorSetter = () =>
  useContext(EditorCoreCtx).setBackgroundColor;
export const useEditorGlobalLoading = () => useContext(EditorCoreCtx).globalLoading;
export const useEditorGlobalLoadingSetter = () => useContext(EditorCoreCtx).setGlobalLoading;
export const useEditorCropEditingNodeId = () => useContext(EditorCoreCtx).cropEditingNodeId;
export const useEditorCropDraftProps = () => useContext(EditorCoreCtx).cropDraftProps;
export const useEditorCropDraftPropsSetter = () => useContext(EditorCoreCtx).setCropDraftProps;
export const useEditorOpenCropEditor = () => useContext(EditorCoreCtx).openCropEditor;
export const useEditorCloseCropEditor = () => useContext(EditorCoreCtx).closeCropEditor;
export const useEditorConfirmCropEditor = () => useContext(EditorCoreCtx).confirmCropEditor;
export const useEditorDesktopEditOpen = () => useContext(EditorCoreCtx).desktopEditOpen;
export const useEditorDesktopEditingNodeId = () => useContext(EditorCoreCtx).desktopEditingNodeId;
export const useEditorOpenDesktopEditor = () => useContext(EditorCoreCtx).openDesktopEditor;
export const useEditorCloseDesktopEditor = () => useContext(EditorCoreCtx).closeDesktopEditor;
export const useEditorConfirmDesktopEditor = () => useContext(EditorCoreCtx).confirmDesktopEditor;
export const useEditorRegisterDesktopEditDraft = () =>
  useContext(EditorCoreCtx).registerDesktopEditDraft;
export const useEditorGeneratePreviewImage = () => useContext(EditorCoreCtx).generatePreviewImage;
export const useEditorGenerateProjectPayload = () => useContext(EditorCoreCtx).generateProjectPayload;
export const useEditorSaveProjectPayload = () => useContext(EditorCoreCtx).saveProjectPayload;
export const useEditorGetElementsConfigMap = () => useContext(EditorCoreCtx).getElementsConfigMap;
