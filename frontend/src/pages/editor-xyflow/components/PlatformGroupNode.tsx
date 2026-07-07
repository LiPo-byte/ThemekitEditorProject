import type { NodeProps } from '@xyflow/react';
import type { CSSProperties } from 'react';

type PlatformGroupData = {
  label?: string;
};

const tagStyle: CSSProperties = {
  position: 'absolute',
  top: 10,
  left: 10,
  padding: '2px 8px',
  borderRadius: 999,
  background: '#4c6fff',
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '18px',
  pointerEvents: 'none',
};

export default function PlatformGroupNode(props: NodeProps) {
  const data = (props.data ?? {}) as PlatformGroupData;
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {data.label ? <span style={tagStyle}>{data.label}</span> : null}
    </div>
  );
}
