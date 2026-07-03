import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import type { Node as FlowNode } from '@xyflow/react';
import type { EditorCore } from '@/editor-core';
import { useParams } from '@umijs/max';
// import { nanoid } from 'nanoid';
// import { WidgetDefaultConfig } from '@/editor-core/defaultConfig';
// import { CONFIG_SIZE_MAP } from './widget/base-config'
import { widgetConfig2Nodes } from './widget/util';
import { nanoid } from 'nanoid';
import { isVisible } from '@rc-component/util';


type EditorCoreCtxValue = {
  projectId: string | null;
  projectName: string;
  setProjectName: (name: string) => void;
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
  addWidget: (config: any) => void;
  deleteSelectedNodes: () => void;
  undo: () => void;
  redo: () => void;
  canDeleteSelected: boolean;
  canUndo: boolean;
  canRedo: boolean;
  leftPanlOpen: boolean;
  setLeftPanlOpen: (bool: boolean) => void;
  rightPanlOpen: boolean;
  setRightPanlOpen: (bool: boolean) => void;
  cropToolOpen: boolean;
  setCropToolOpen: (bool: boolean) => void;
  hideUI: boolean;
  setHideUI: (bool: boolean) => void;
};

const noopSetNodes: React.Dispatch<React.SetStateAction<FlowNode[]>> = () => {};
const noopChangeNodeProp = (_updater: (prev: FlowNode[]) => FlowNode[]) => {};
const noopSelectNode = (_fn: FlowNode, _append?: boolean) => {};
const noopDeselectedNode = (_nodeId?: string) => {};
const noopAddNodeGroup = () => {};
const noopDeleteSelectedNodes = () => {};
const noopGetParentNodeData = (_nodeId: string) => null;

const EditorCoreCtx = createContext<EditorCoreCtxValue>({
  projectId: null,
  projectName: '',
  setProjectName: () => {},
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
  deleteSelectedNodes: noopDeleteSelectedNodes,
  undo: () => {},
  redo: () => {},
  canDeleteSelected: false,
  canUndo: false,
  canRedo: false,
  leftPanlOpen: false,
  setLeftPanlOpen: (_bool: boolean) => {},
  rightPanlOpen: false,
  setRightPanlOpen: (bool: boolean) => {},
  cropToolOpen: false,
  setCropToolOpen: (_bool: boolean) => {},
  hideUI: false,
  setHideUI: (_bool: boolean) => {},
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
  const [actionPropNode, setActionPropNode] = useState<FlowNode>({
    id: nanoid(),
    position: { x: 0, y: 0 },
    type: 'node-with-toolbar',
    data: { isVisible: false, actionList: [], },
  });
  const [past, setPast] = useState<FlowNode[][]>([]);
  const [future, setFuture] = useState<FlowNode[][]>([]);

  const [leftPanlOpen, setLeftPanlOpen] = useState<boolean>(false);
  const [rightPanlOpen, setRightPanlOpen] = useState<boolean>(false);
  const [cropToolOpen, setCropToolOpen] = useState<boolean>(false);
  const [hideUI, setHideUI] = useState<boolean>(false);

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

  const addWidget = (config: any) => {
    const { nodes: newNodes, rootNode } = widgetConfig2Nodes(config);
    if (!rootNode) return;

    commitNodes((prev) => {
      const SLOT_SIZE = 1000;
      const COLUMN_COUNT = 6;
      const occupiedSlots = new Set<number>();

      prev
        .filter((node) => node.type === 'group' && !node.parentId)
        .forEach((node) => {
          const x = typeof node.position?.x === 'number' ? node.position.x : 0;
          const y = typeof node.position?.y === 'number' ? node.position.y : 0;
          const col = Math.round(x / SLOT_SIZE);
          const row = Math.round(y / SLOT_SIZE);
          if (col < 0 || row < 0 || col >= COLUMN_COUNT) return;
          occupiedSlots.add(row * COLUMN_COUNT + col);
        });

      let slotIndex = 0;
      while (occupiedSlots.has(slotIndex)) {
        slotIndex += 1;
      }
      const nextPosition = {
        x: (slotIndex % COLUMN_COUNT) * SLOT_SIZE,
        y: Math.floor(slotIndex / COLUMN_COUNT) * SLOT_SIZE,
      };

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
        const { packable, deleteable, cropable, data } = node;
        packable && action.push('packable');
        deleteable && action.push('deleteable');
        cropable && data && data.source && action.push('cropable');
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

  useEffect(() => {
    if (!hideUI) return;
    setLeftPanlOpen(false);
    setRightPanlOpen(false);
  }, [hideUI]);

  const value = useMemo<EditorCoreCtxValue>(
    () => ({
      projectId,
      projectName,
      setProjectName,
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
      deleteSelectedNodes,
      undo,
      redo,
      canDeleteSelected,
      canUndo,
      canRedo,
      leftPanlOpen,
      setLeftPanlOpen,
      rightPanlOpen,
      setRightPanlOpen,
      cropToolOpen,
      setCropToolOpen,
      hideUI,
      setHideUI,
    }),
    [
      nodes,
      projectId,
      projectName,
      selectedNodesMap,
      actionPropNode,
      selectedBranchNodes,
      selectedBranchNodeIds,
      selectedBranchNodeIdsKey,
      selectedDirectNodes,
      getParentNodeData,
      deleteSelectedNodes,
      canDeleteSelected,
      canUndo,
      canRedo,
      leftPanlOpen,
      rightPanlOpen,
      cropToolOpen,
      hideUI,
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
export const useEditorFontsReady = () => true;
export const useEditorCoreLoading = () => false;
export const useEditorCoreSetter = () => noopCoreSetter;
export const useEditorUIVisibility = () => DEFAULT_EDITOR_UI_VISIBILITY;
export const useEditorUIVisibilitySetter = () => noopUISetter;
export const useEditorLeftPanlOpen = () => useContext(EditorCoreCtx).leftPanlOpen;
export const useEditorLeftPanlOpenSetter = () => useContext(EditorCoreCtx).setLeftPanlOpen;
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
