

import { ReactFlow, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './editor-stage.css';
import TimeLayout_1 from './widget/time-layout_1';
// import { useMemo, useState } from 'react';
import { useEditorNodes, useEditorSelectNode, useEditorDeselectedNode } from './context';

export default function EditorStage() {
  const nodes = useEditorNodes();
  const seletNode = useEditorSelectNode();
  const deselectedNode = useEditorDeselectedNode();

  return (
    <div className="xyflow-stage" style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        nodeTypes={{
          time_1: TimeLayout_1,
        }}
        nodesDraggable={false}
        elementsSelectable
        nodesConnectable={false}
        nodesFocusable={false}
        selectionOnDrag={false}
        onNodeClick={(event, node) => {
          seletNode(node, Boolean(event.shiftKey));
        }}
        onPaneClick={(_) => {
          deselectedNode()
        }}
        panOnDrag
        fitView
        maxZoom={1.5}
        minZoom={0.1}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}