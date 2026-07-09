import './style.css';

export default function LauncherLayout_1(props: any) {
  const data = props.data;
  if (!data) return null;

  return (
    <div
      className={`size_${data?.size}`}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: `${data.radius ?? 0}px`,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    />
  );
}
