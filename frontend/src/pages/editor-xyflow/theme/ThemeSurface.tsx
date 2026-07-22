export default function ThemeSurface(props: any) {
  const data = props.data;
  if (!data) return null;

  const width = Number(data.width) > 0 ? Number(data.width) : 887;
  const height = Number(data.height) > 0 ? Number(data.height) : 1920;
  const scale = typeof props.scale === 'number' ? props.scale : 1;

  return (
    <div
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        width,
        height,
        backgroundColor: '#ffffff',
      }}
    />
  );
}
