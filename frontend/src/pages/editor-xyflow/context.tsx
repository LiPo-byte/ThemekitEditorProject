import React, { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Node as FlowNode } from '@xyflow/react';
import type { EditorCore } from '@/editor-core';
import { useParams } from '@umijs/max';
import { nanoid } from 'nanoid';  
import { WidgetDefaultConfig } from '@/editor-core/defaultConfig';
import { CONFIG_SIZE_MAP } from './widget/base-config'

let x = 0;
const config2Nodes: any = (config: any) => {
  const gap = 30;
  const res:any = [];
  const { ios, android } = config;
  const rootGroupId = nanoid();
  const platformNodes: any[] = [];

  const pushPlatformNodes = (platformConfig: any, groupX: number, system: string) => {
    if (!platformConfig) {
      return null;
    }

    const groupId = nanoid() + '_' + system;
    let groupWidth = gap;
    let groupHeight = gap;
    let startY = gap;
    const sizes = Array.isArray(platformConfig.sizes)
      ? [...platformConfig.sizes].reverse()
      : [];
    const widgetNodes: any[] = [];

    sizes.forEach((item: any) => {
      const sizeConfig = CONFIG_SIZE_MAP[item.size] || CONFIG_SIZE_MAP[1];
      const { width, height } = sizeConfig;
      groupWidth = Math.max(groupWidth, width + gap * 2);

      widgetNodes.push({
        id: nanoid(),
        type: 'time_1',
        data: { ...item },
        position: { x: gap, y: startY },
        parentId: groupId,
        extent: 'parent',
        draggable: false,
        selectable: false,
        connectable: false,
        focusable: false,
        style: {
          border: '2px solid transparent',
        },
      });

      startY += height + gap;
      groupHeight += height + gap;
    });

    platformNodes.push({
      id: groupId,
      type: 'group',
      className: 'widget-group-node',
      position: { x: groupX, y: gap },
      data: {
        isLockScreen: platformConfig.isLockScreen,
        textAlignment: platformConfig.textAlignment,
        type: platformConfig.type,
        version: platformConfig.version,
      },
      parentId: rootGroupId,
      extent: 'parent',
      draggable: false,
      selectable: false,
      connectable: false,
      focusable: false,
      zIndex: 10,
      style: {
        width: groupWidth,
        height: groupHeight,
        background: '#eef3ff',
        border: '1px solid #dfe5ff',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(63, 93, 255, 0.06)',
      },
    });
    platformNodes.push(...widgetNodes);

    return {
      width: groupWidth,
      height: groupHeight,
    };
  };

  const iosMeta = pushPlatformNodes(ios, gap, 'ios');
  const androidMeta = pushPlatformNodes(
    android,
    iosMeta ? gap + iosMeta.width + gap : gap,
    'android',
  );

  const rootWidth = iosMeta && androidMeta
    ? gap + iosMeta.width + gap + androidMeta.width + gap
    : gap + (iosMeta?.width || androidMeta?.width || 0) + gap;
  const rootHeight = gap
    + Math.max(iosMeta?.height || 0, androidMeta?.height || 0)
    + gap;

  res.push({
    id: rootGroupId,
    type: 'group',
    className: 'widget-group-node',
    position: { x: x, y: 0 },
    draggable: false,
    selectable: false,
    connectable: false,
    focusable: false,
    zIndex: 1,
    style: {
      width: rootWidth,
      height: rootHeight,
      background: '#f5f7ff',
      border: '1px solid #b4c0ff',
      borderRadius: 16,
    },
  });
  res.push(...platformNodes);
  x += 1000;
  return res;
};


type EditorCoreCtxValue = {
  projectId: string | null;
  projectName: string;
  setProjectName: (name: string) => void;
  nodes: FlowNode[];
  setNodes: React.Dispatch<React.SetStateAction<FlowNode[]>>;
  changeNodeProp: (updater: (prev: FlowNode[]) => FlowNode[]) => void;
  selectedNodesMap: Map<string, FlowNode>;
  selectedBranchNodes: FlowNode[];
  selectedBranchNodeIds: string[];
  selectedBranchNodeIdsKey: string;
  getParentNodeData: (nodeId: string) => Record<string, any> | null;
  selectNode: (fn: FlowNode, append?: boolean) => void;
  deselectedNode: (nodeId?: string) => void;
  addWidget: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  rightPanlOpen: boolean;
  setRightPanlOpen: (bool: boolean) => void;
};

const noopSetNodes: React.Dispatch<React.SetStateAction<FlowNode[]>> = () => {};
const noopChangeNodeProp = (_updater: (prev: FlowNode[]) => FlowNode[]) => {};
const noopSelectNode = (_fn: FlowNode, _append?: boolean) => {};
const noopDeselectedNode = (_nodeId?: string) => {};
const noopAddNodeGroup = () => {};
const noopGetParentNodeData = (_nodeId: string) => null;

const EditorCoreCtx = createContext<EditorCoreCtxValue>({
  projectId: null,
  projectName: '',
  setProjectName: () => {},
  nodes: [],
  setNodes: noopSetNodes,
  changeNodeProp: noopChangeNodeProp,
  selectedNodesMap: new Map(),
  selectedBranchNodes: [],
  selectedBranchNodeIds: [],
  selectedBranchNodeIdsKey: '',
  getParentNodeData: noopGetParentNodeData,
  selectNode: noopSelectNode,
  deselectedNode: noopDeselectedNode,
  addWidget: noopAddNodeGroup,
  undo: () => {},
  redo: () => {},
  canUndo: false,
  canRedo: false,
  rightPanlOpen: false,
  setRightPanlOpen: (bool: boolean) => {},
});

const cloneNodes = (items: FlowNode[]): FlowNode[] => {
  if (typeof structuredClone === 'function') {
    return structuredClone(items);
  }
  return JSON.parse(JSON.stringify(items)) as FlowNode[];
};

// /** 目前上下文只保留 nodes/setNodes */
export const EditorCoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const params = useParams<{ projectId?: string }>();
  const projectId = params.projectId ?? null;
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [selectedNodesMap, setSelectedNodesMapState] = useState<Map<string, FlowNode>>(
    new Map(),
  );
  const [past, setPast] = useState<FlowNode[][]>([]);
  const [future, setFuture] = useState<FlowNode[][]>([]);

  const [rightPanlOpen, setRightPanlOpen] = useState<boolean>(false);

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

  const addWidget = () => {
    const group = config2Nodes(WidgetDefaultConfig['Time_LayoutType_0']);
    commitNodes((prev) => [...prev, ...cloneNodes(group)]);
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

  const getParentNodeData = (nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId);
    if (!node?.parentId) return null;
    const parentNode = nodes.find((item) => item.id === node.parentId);
    return (parentNode?.data as Record<string, any> | undefined) ?? null;
  };

  const value = useMemo<EditorCoreCtxValue>(
    () => ({
      projectId,
      projectName,
      setProjectName,
      nodes,
      setNodes,
      changeNodeProp: commitNodes,
      selectedNodesMap,
      selectedBranchNodes,
      selectedBranchNodeIds,
      selectedBranchNodeIdsKey,
      getParentNodeData,
      selectNode,
      deselectedNode,
      addWidget,
      undo,
      redo,
      canUndo,
      canRedo,
      rightPanlOpen,
      setRightPanlOpen,
    }),
    [
      nodes,
      projectId,
      projectName,
      selectedNodesMap,
      selectedBranchNodes,
      selectedBranchNodeIds,
      selectedBranchNodeIdsKey,
      getParentNodeData,
      canUndo,
      canRedo,
      rightPanlOpen,
    ],
  );

  return <EditorCoreCtx.Provider value={value}>{children}</EditorCoreCtx.Provider>;
};

export const useEditorNodes = () => useContext(EditorCoreCtx).nodes;
export const useEditorNodesSetter = () => useContext(EditorCoreCtx).setNodes;
export const useEditorChangeNodeProp = () => useContext(EditorCoreCtx).changeNodeProp;
export const useEditorSelectedNodesMap = () => useContext(EditorCoreCtx).selectedNodesMap;
export const useEditorSelectedBranchNodes = () => useContext(EditorCoreCtx).selectedBranchNodes;
export const useEditorSelectedBranchNodeIds = () => useContext(EditorCoreCtx).selectedBranchNodeIds;
export const useEditorSelectedBranchNodeIdsKey = () =>
  useContext(EditorCoreCtx).selectedBranchNodeIdsKey;
export const useEditorGetParentNodeData = () => useContext(EditorCoreCtx).getParentNodeData;
export const useEditorSelectNode = () => useContext(EditorCoreCtx).selectNode;
export const useEditorDeselectedNode = () => useContext(EditorCoreCtx).deselectedNode;
export const useEditorAddWidget = () => useContext(EditorCoreCtx).addWidget;
export const useEditorUndo = () => useContext(EditorCoreCtx).undo;
export const useEditorRedo = () => useContext(EditorCoreCtx).redo;
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
export const useEditorFontsReady = () => true;
export const useEditorCoreLoading = () => false;
export const useEditorCoreSetter = () => noopCoreSetter;
export const useEditorUIVisibility = () => DEFAULT_EDITOR_UI_VISIBILITY;
export const useEditorUIVisibilitySetter = () => noopUISetter;
export const useEditorLeftPanlOpen = () => DEFAULT_EDITOR_UI_VISIBILITY.leftPanel;
export const useEditorLeftPanlOpenSetter = () => noopBooleanSetter;
// export const useEditorRightPanlOpen = () => DEFAULT_EDITOR_UI_VISIBILITY.rightPanel;
// export const useEditorRightPanlOpenSetter = () => noopBooleanSetter;
export const useEditorToolbarVisible = () => DEFAULT_EDITOR_UI_VISIBILITY.editorToolbar;
export const useEditorBottomToolBarVisible = () => DEFAULT_EDITOR_UI_VISIBILITY.bottomToolBar;
export const useEditorHeaderControlsVisible = () => DEFAULT_EDITOR_UI_VISIBILITY.headerControls;
export const useEditorZoomToolBarVisible = () => DEFAULT_EDITOR_UI_VISIBILITY.zoomToolBar;
export const useEditorPreviewDevicesOpen = () => false;
export const useEditorPreviewDevicesOpenSetter = () => noopBooleanSetter;
export const useEditorCropToolOpen = () => false;
export const useEditorCropToolOpenSetter = () => noopBooleanSetter;
export const useEditorHideUISetter = () => noopBooleanSetter;
