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
  // 组宽由内容撑开，圆形锁屏只有 62pt，装不下完整的类型名。
  // 这里跟着组宽收窄，超出的部分交给下面的省略号处理，避免标签横着溢出到组外。
  maxWidth: 'calc(100% - 20px)',
};

const secondaryTagStyle: CSSProperties = {
  padding: '2px 8px',
  borderRadius: 999,
  background: 'rgb(90 189 176)',
  color: '#4b5cc4',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '18px',
  // 类型名是这里唯一可能很长的内容，装不下就截断。
  // flex 子项要 minWidth: 0 才允许收缩到内容宽度以下，否则 ellipsis 不生效。
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  // 容器整体禁用了指针事件，这里单独放开，好让截断后能靠原生 title 看全名
  pointerEvents: 'auto',
};

export default function PlatformGroupNode(props: NodeProps) {
  const data = (props.data ?? {}) as PlatformGroupData;
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div style={tagContainerStyle}>
        {data.label ? (<span style={{ ...tagStyle, flexShrink: 0 }}>{data.label}</span>) : null}
        {data.themekitType ? (<span style={secondaryTagStyle} title={data.themekitType}>{data.themekitType}</span>) : null}
        </div>
    </div>
  );
}
