
import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  ViewportPortal,
  type Node as FlowNode,
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
        nodes={flowNodes}
        // xyflow 内置控件（Controls 等）只认它自己的 colorMode，不受 antd token 影响
        colorMode={themeMode === 'realDark' ? 'dark' : 'light'}
        nodeTypes={{
          'node-with-toolbar': ActionPopover,
          ...xyFlowTypeNodeType,
        }}
        nodesDraggable={false}
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