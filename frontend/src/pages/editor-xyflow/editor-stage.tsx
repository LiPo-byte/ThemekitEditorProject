
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  ViewportPortal,
  applyNodeChanges,
  useNodesState,
  type Node as FlowNode,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './editor-stage.css';
import Preview from './icon/preview';
import ActionPopover from './components/ActionPopover';
import PreviewLong from './theme/preview_long';
import PreviewShort from './theme/preview_short';
import ListView from './theme/list_view';
import ListViewShort from './theme/list_view_short';
import PreviewLongIpad from './theme/preview_long_ipad';
import ListViewIpad from './theme/list_view_ipad';
import {
  LockpackListView,
  LockpackPreviewLong,
  LockpackPreviewShort,
} from './lockpack/surfaces';
import { xyFlowTypeNodeType as baseXyFlowTypeNodeType } from './xyFlowTypeNodeType';
import {
  useEditorNodes,
  useEditorSelectNode,
  useEditorDeselectedNode,
  useEditorActionPropNode,
  useEditorCropToolOpen,
  useEditorDesktopEditOpen,
  useEditorShowAxis,
  useEditorBackgroundVariant,
  useEditorBackgroundColor,
  useEditorSelectedNodesMap,
  useEditorFitView,
  useEditorThemeMode,
  useEditorNodesSetter,
  useEditorChangeNodeProp,
  useEditorActionPropNodeSetter,
} from './context';

export const xyFlowTypeNodeType = {
  ...baseXyFlowTypeNodeType,
  preview_long: PreviewLong,
  preview_short: PreviewShort,
  list_view: ListView,
  list_view_short: ListViewShort,
  preview_long_ipad: PreviewLongIpad,
  list_view_ipad: ListViewIpad,
  preview: Preview,
  lockpack_preview_long: LockpackPreviewLong,
  lockpack_preview_short: LockpackPreviewShort,
  lockpack_list_view: LockpackListView,
};

/** 自身可选则返回自身；否则沿 parentId 找最近 selectable !== false 的祖先 */
const resolveSelectableTarget = (
  node: FlowNode,
  allNodes: FlowNode[],
): FlowNode | null => {
  const nodeById = new Map(allNodes.map((item) => [item.id, item] as const));
  let current: FlowNode | undefined = nodeById.get(node.id) ?? node;

  if (current.selectable !== false) {
    return current;
  }

  let parentId = current.parentId;
  while (parentId) {
    const parent = nodeById.get(parentId);
    if (!parent) break;
    if (parent.selectable !== false) {
      return parent;
    }
    parentId = parent.parentId;
  }

  return null;
};

export default function EditorStage() {
  const actionNode = useEditorActionPropNode();
  const nodes = useEditorNodes();
  const selectedNodesMap = useEditorSelectedNodesMap();
  const seletNode = useEditorSelectNode();
  const deselectedNode = useEditorDeselectedNode();
  const cropToolOpen = useEditorCropToolOpen();
  const desktopEditOpen = useEditorDesktopEditOpen();
  const interactionLocked = cropToolOpen || desktopEditOpen;
  const showAxis = useEditorShowAxis();
  const backgroundVariant = useEditorBackgroundVariant();
  const backgroundColor = useEditorBackgroundColor();
  const themeMode = useEditorThemeMode();
  const fitView = useEditorFitView();
  const setNodes = useEditorNodesSetter();
  const changeNodeProp = useEditorChangeNodeProp();
  const setActionPropNode = useEditorActionPropNodeSetter();

  // selected 以 selectedNodesMap 为准，避免 React Flow 默认单选覆盖多选状态
  const flowNodes = useMemo(
    () => [
      actionNode,
      ...nodes.map((node) => ({
        ...node,
        selected: selectedNodesMap.has(node.id),
      })),
    ],
    [actionNode, nodes, selectedNodesMap],
  );

  // React Flow 拖拽过程会高频改 position，需本地 rfNodes；context.nodes 仍是权威数据源，松手后再写回。
  const [rfNodes, setRfNodes, onRfNodesChange] = useNodesState(flowNodes);
  // 拖拽中若用 flowNodes 覆盖 rfNodes，会把正在拖的位置打回起点，造成抖动。
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isDraggingRef.current) return;
    setRfNodes(flowNodes);
  }, [flowNodes, setRfNodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const actionId = actionNode.id;
      // 选中以 selectedNodesMap 为准，忽略 RF 内建的 select change，避免和自定义多选冲突。
      const rfChanges = changes.filter((change) => change.type !== 'select');
      if (rfChanges.length) {
        onRfNodesChange(rfChanges);
      }

      const actionChanges = changes.filter(
        (change) => 'id' in change && change.id === actionId,
      );
      if (actionChanges.length) {
        const nextAction = applyNodeChanges(actionChanges, [actionNode])[0];
        if (nextAction) setActionPropNode(nextAction as FlowNode);
      }

      const filtered = changes.filter((change) => {
        if (change.type === 'select') return false;
        if ('id' in change && change.id === actionId) return false;
        return true;
      });
      if (!filtered.length) return;

      const isDragEnd = filtered.some(
        (change) =>
          change.type === 'position' &&
          'dragging' in change &&
          change.dragging === false,
      );
      const isDragging = filtered.some(
        (change) =>
          change.type === 'position' && 'dragging' in change && change.dragging,
      );

      if (isDragging) {
        isDraggingRef.current = true;
        return;
      }

      if (isDragEnd) {
        isDraggingRef.current = false;
        // 拖拽结束走 changeNodeProp（带 undo/脏标记），只更新位置，不在拖动过程中 commit。
        changeNodeProp((prev) => applyNodeChanges(filtered, prev) as FlowNode[]);
        return;
      }

      setNodes((prev) => applyNodeChanges(filtered, prev) as FlowNode[]);
    },
    [actionNode, changeNodeProp, onRfNodesChange, setActionPropNode, setNodes],
  );

  const backgroundVariantMap: Record<'lines' | 'dots' | 'cross', BackgroundVariant> = {
    lines: BackgroundVariant.Lines,
    dots: BackgroundVariant.Dots,
    cross: BackgroundVariant.Cross,
  };

  return (
    <div
      className="xyflow-stage"
      style={{ height: '100%', width: '100%', background: backgroundColor }}
    >
      <ReactFlow
        nodes={rfNodes}
        // xyflow 内置控件（Controls 等）只认它自己的 colorMode，不受 antd token 影响
        colorMode={themeMode === 'realDark' ? 'dark' : 'light'}
        nodeTypes={{
          'node-with-toolbar': ActionPopover,
          ...xyFlowTypeNodeType,
        }}
        // 改为按节点 draggable 控制（context 里单选 root 时为 true），不再全局 nodesDraggable={false}
        onlyRenderVisibleElements
        onNodesChange={onNodesChange}
        elementsSelectable={!interactionLocked}
        nodesConnectable={false}
        nodesFocusable={false}
        selectionOnDrag={false}
        onNodeClick={(event, node) => {
          if (interactionLocked) return;
          const target = resolveSelectableTarget(node, nodes);
          if (!target) return;
          seletNode(target, Boolean(event.shiftKey));
        }}
        onPaneClick={(_) => {
          if (interactionLocked) return;
          deselectedNode()
        }}
        panOnDrag={!interactionLocked}
        zoomOnScroll={!interactionLocked}
        zoomOnPinch={!interactionLocked}
        zoomOnDoubleClick={!interactionLocked}
        // 删除统一走 useEditorShortcuts，关掉内建删除避免它绕过 canDeleteSelected 直接改内部节点
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode="Shift"
        fitView
        maxZoom={1.5}
        minZoom={0.01}
      >
        {showAxis && (
          <ViewportPortal>
            <div className="xyflow-origin-axis" aria-hidden>
              <div className="xyflow-origin-axis__line xyflow-origin-axis__line--horizontal" />
              <div className="xyflow-origin-axis__line xyflow-origin-axis__line--vertical" />
            </div>
          </ViewportPortal>
        )}
        <Background
          variant={backgroundVariantMap[backgroundVariant]}
          bgColor={backgroundColor}
        />
        <Controls
            showInteractive={false}
            showZoom={!interactionLocked}
            showFitView={!false}
            onFitView={() => {
              fitView()
            }}
            position="bottom-right"
            orientation="horizontal"
            style={{
              margin: 3,
              zIndex: 9,
            }}
        >
        </Controls>
      </ReactFlow>
    </div>
  );
}