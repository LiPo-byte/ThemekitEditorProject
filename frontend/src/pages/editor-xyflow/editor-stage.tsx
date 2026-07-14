
import { useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useKeyPress,
  Controls,
  ViewportPortal,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './editor-stage.css';
import TimeLayout_0 from './widget/time-layout_0';
import TimeLayout_1 from './widget/time-layout_1';
import TimeLayout_2 from './widget/time-layout_2';
import TimeLayout_3 from './widget/time-layout_3';
import TimeLayout_4 from './widget/time-layout_4';
import TimeLayout_5 from './widget/time-layout_5';
import TimeLayout_6 from './widget/time-layout_6';
import pureimageLayout_0 from './widget/pureimage-layout_0';
import quotationLayout_0 from './widget/quotation-layout_0';
import calendarLayout_0 from './widget/calendar-layout_0';
import calendarLayout_1 from './widget/calendar-layout_1';
import calendarLayout_2 from './widget/calendar-layout_2';
import countdownLayout_0 from './widget/countdown-layout_0';
import launcherLayout_0 from './widget/launcher-layout_0';
import launcherLayout_1 from './widget/launcher-layout_1';
import launcherLayout_5 from './widget/launcher-layout_5';
import launcherLayout_6 from './widget/launcher-layout_6';
import launcherLayout_7 from './widget/launcher-layout_7';
import launcherLayout_8 from './widget/launcher-layout_8';
import launcherLayout_9 from './widget/launcher-layout_9';
import dynamicLayout_0 from './widget/dynamic-layout_0';


import ActionPopover from './components/ActionPopover';
import PlatformGroupNode from './components/PlatformGroupNode';
// import { useMemo, useState } from 'react';
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

  const backgroundVariantMap: Record<'lines' | 'dots' | 'cross', BackgroundVariant> = {
    lines: BackgroundVariant.Lines,
    dots: BackgroundVariant.Dots,
    cross: BackgroundVariant.Cross,
  };

  useEffect(() => {
    if (cropToolOpen) return;
    if (!deleteKeyPressed || !canDeleteSelected) return;
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
          platform_group: PlatformGroupNode,
          time_0: TimeLayout_0,
          time_1: TimeLayout_1,
          time_2: TimeLayout_2,
          time_3: TimeLayout_3,
          time_4: TimeLayout_4,
          time_5: TimeLayout_5,
          time_6: TimeLayout_6,
          pureimage_0: pureimageLayout_0,
          quotation_0: quotationLayout_0,
          calendar_0: calendarLayout_0,
          calendar_1: calendarLayout_1,
          calendar_2: calendarLayout_2,
          countdown_0: countdownLayout_0,
          launcher_0: launcherLayout_0,
          launcher_1: launcherLayout_1,
          launcher_5: launcherLayout_5,
          launcher_6: launcherLayout_6,
          launcher_7: launcherLayout_7,
          launcher_8: launcherLayout_8,
          launcher_9: launcherLayout_9,
          dynamic_0: dynamicLayout_0,
        }}
        nodesDraggable={false}
        elementsSelectable={!cropToolOpen}
        nodesConnectable={false}
        nodesFocusable={false}
        selectionOnDrag={false}
        onNodeClick={(event, node) => {
          if (cropToolOpen) return;
          seletNode(node, Boolean(event.shiftKey));
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