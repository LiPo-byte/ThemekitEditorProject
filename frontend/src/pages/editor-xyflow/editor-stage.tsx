
import { useEffect } from 'react';
import { ReactFlow, Background, useKeyPress, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './editor-stage.css';
import TimeLayout_0 from './widget/time-layout_0';
import TimeLayout_1 from './widget/time-layout_1';
import TimeLayout_2 from './widget/time-layout_2';
import TimeLayout_3 from './widget/time-layout_3';
import TimeLayout_4 from './widget/time-layout_4';
import TimeLayout_5 from './widget/time-layout_5';
import TimeLayout_6 from './widget/time-layout_6';
import ActionPopover from './components/ActionPopover';
// import { useMemo, useState } from 'react';
import {
  useEditorNodes,
  useEditorSelectNode,
  useEditorDeselectedNode,
  useEditorDeleteSelectedNodes,
  useEditorCanDeleteSelected,
  useEditorActionPropNode,
  useEditorCropToolOpen,
} from './context';

export default function EditorStage() {
  const actionNode = useEditorActionPropNode();
  const nodes = useEditorNodes();
  const seletNode = useEditorSelectNode();
  const deselectedNode = useEditorDeselectedNode();
  const deleteSelectedNodes = useEditorDeleteSelectedNodes();
  const canDeleteSelected = useEditorCanDeleteSelected();
  const cropToolOpen = useEditorCropToolOpen();
  const deleteKeyPressed = useKeyPress(['Delete', 'Backspace']);

  useEffect(() => {
    if (cropToolOpen) return;
    if (!deleteKeyPressed || !canDeleteSelected) return;
    const activeTagName = document.activeElement?.tagName?.toLowerCase();
    if (activeTagName === 'input' || activeTagName === 'textarea') return;
    deleteSelectedNodes();
  }, [cropToolOpen, deleteKeyPressed, canDeleteSelected, deleteSelectedNodes]);

  return (
    <div className="xyflow-stage" style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={[actionNode, ...nodes]}
        nodeTypes={{
          'node-with-toolbar': ActionPopover,
          time_0: TimeLayout_0,
          time_1: TimeLayout_1,
          time_2: TimeLayout_2,
          time_3: TimeLayout_3,
          time_4: TimeLayout_4,
          time_5: TimeLayout_5,
          time_6: TimeLayout_6,
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
        fitView
        maxZoom={1.5}
        minZoom={0.1}
      >
        <Background />
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