import type { NodeProps } from '@xyflow/react';
import type { CSSProperties } from 'react';

type PlatformGroupData = {
  label?: string;
  themekitType?: string;
};

const tagStyle: CSSProperties = {
  // position: 'absolute',
  // top: 10,
  // left: 10,
  padding: '2px 8px',
  borderRadius: 999,
  background: '#4c6fff',
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '18px',
  pointerEvents: 'none',
};

const tagContainerStyle: CSSProperties = {
  position: 'absolute',
  top: 10,
  left: 10,
  display: 'flex',
  gap: 6,
  alignItems: 'center',
  pointerEvents: 'none',
};

const secondaryTagStyle: CSSProperties = {
  padding: '2px 8px',
  borderRadius: 999,
  background: 'rgb(90 189 176)',
  color: '#4b5cc4',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '18px',
};

export default function PlatformGroupNode(props: NodeProps) {
  const data = (props.data ?? {}) as PlatformGroupData;
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div style={tagContainerStyle}>
        {data.label ? (<span style={tagStyle}>{data.label}</span>) : null}
        {data.themekitType ? (<span style={secondaryTagStyle}>{data.themekitType}</span>) : null}
        </div>
    </div>
  );
}
