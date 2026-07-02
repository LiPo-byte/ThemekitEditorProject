
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function EditorStage() {
    
    return (
      <div style={{ height: '100%', width: '100%' }}>
        <ReactFlow>
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    );
  }