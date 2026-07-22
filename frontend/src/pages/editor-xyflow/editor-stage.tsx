
import { useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useKeyPress,
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
import PreviewLongIpad from './theme/preview_long_ipad';
import ListViewIpad from './theme/list_view_ipad';
import { xyFlowTypeNodeType as baseXyFlowTypeNodeType } from './xyFlowTypeNodeType';
import {
  useEditorNodes,
  useEditorSelectNode,
  useEditorDeselectedNode,
  useEditorDeleteSelectedNodes,
  useEditorCanDeleteSelected,
  useEditorActionPropNode,
  useEditorCropToolOpen,
  useEditorShowAxis,
  useEditorBackgroundVariant,
  useEditorBackgroundColor,
} from './context';

export const xyFlowTypeNodeType = {
  ...baseXyFlowTypeNodeType,
  preview_long: PreviewLong,
  preview_short: PreviewShort,
  list_view: ListView,
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
  const seletNode = useEditorSelectNode();
  const deselectedNode = useEditorDeselectedNode();
  const deleteSelectedNodes = useEditorDeleteSelectedNodes();
  const canDeleteSelected = useEditorCanDeleteSelected();
  const cropToolOpen = useEditorCropToolOpen();
  const showAxis = useEditorShowAxis();
  const backgroundVariant = useEditorBackgroundVariant();
  const backgroundColor = useEditorBackgroundColor();
  const deleteKeyPressed = useKeyPress(['Delete', 'Backspace']);
  const deleteKeyPressedRef = useRef(false);

  const backgroundVariantMap: Record<'lines' | 'dots' | 'cross', BackgroundVariant> = {
    lines: BackgroundVariant.Lines,
    dots: BackgroundVariant.Dots,
    cross: BackgroundVariant.Cross,
  };

  useEffect(() => {
    const isRisingEdge = deleteKeyPressed && !deleteKeyPressedRef.current;
    deleteKeyPressedRef.current = deleteKeyPressed;
    if (!isRisingEdge) return;
    if (cropToolOpen) return;
    if (!canDeleteSelected) return;
    const activeTagName = document.activeElement?.tagName?.toLowerCase();
    if (activeTagName === 'input' || activeTagName === 'textarea') return;
    deleteSelectedNodes();
  }, [cropToolOpen, deleteKeyPressed, canDeleteSelected, deleteSelectedNodes]);

  return (
    <div
      className="xyflow-stage"
      style={{ height: '100%', width: '100%', background: backgroundColor }}
    >
      <ReactFlow
        nodes={[actionNode, ...nodes]}
        nodeTypes={{
          'node-with-toolbar': ActionPopover,
          ...xyFlowTypeNodeType,
          // platform_group: PlatformGroupNode,
          // time_0: TimeLayout_0,
          // time_1: TimeLayout_1,
          // time_2: TimeLayout_2,
          // time_3: TimeLayout_3,
          // time_4: TimeLayout_4,
          // time_5: TimeLayout_5,
          // time_6: TimeLayout_6,
          // pureimage_0: pureimageLayout_0,
          // quotation_0: quotationLayout_0,
          // calendar_0: calendarLayout_0,
          // calendar_1: calendarLayout_1,
          // calendar_2: calendarLayout_2,
          // countdown_0: countdownLayout_0,
          // launcher_0: launcherLayout_0,
          // launcher_1: launcherLayout_1,
          // launcher_5: launcherLayout_5,
          // launcher_6: launcherLayout_6,
          // launcher_7: launcherLayout_7,
          // launcher_8: launcherLayout_8,
          // launcher_9: launcherLayout_9,
          // dynamic_0: dynamicLayout_0,
          // battery_0: batteryLayout_0,
          // battery_1: batteryLayout_1,
          // battery_2: batteryLayout_2,
          // digital_0: DigitalLayout_0,
          // weather_0: WeatherLayout_0,
          // weather_1: WeatherLayout_1,
          // weather_2: WeatherLayout_2,
          // clock_0: ClockLayout_0,
          // clock_1: ClockLayout_1,
          // music_0: MusicLayout_0,
          // timemixbattery_0: TimeMixBatteryLayout_0,
          // timemixcalendarmixbattery_0: TimeMixCalendarMixBatteryLayout_0,
          // timemixcalendarmixbattery_1: TimeMixCalendarMixBatteryLayout_1,
          // clockmixbattery_0: ClockMixBatteryLayout_0,
          // icon: Icon,
          // preview: Preview,
        }}
        nodesDraggable={false}
        elementsSelectable={!cropToolOpen}
        nodesConnectable={false}
        nodesFocusable={false}
        selectionOnDrag={false}
        onNodeClick={(event, node) => {
          if (cropToolOpen) return;
          const target = resolveSelectableTarget(node, nodes);
          if (!target) return;
          seletNode(target, Boolean(event.shiftKey));
        }}
        onPaneClick={(_) => {
          if (cropToolOpen) return;
          deselectedNode()
        }}
        panOnDrag={!cropToolOpen}
        zoomOnScroll={!cropToolOpen}
        zoomOnPinch={!cropToolOpen}
        zoomOnDoubleClick={!cropToolOpen}
        selectionKeyCode={null}
        fitView
        maxZoom={1.5}
        minZoom={0.1}
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
            showZoom={!cropToolOpen}
            showFitView={!cropToolOpen}
            position="bottom-right"
            orientation="horizontal"
            style={{
              margin: 3,
              zIndex: 9,
            }}
        />
      </ReactFlow>
    </div>
  );
}