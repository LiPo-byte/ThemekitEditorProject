import './style.css';

export default function LockStaticRect_0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const backgroundColor = data.backgroundColor ?? '#00000066';
  const backgroundimage = data.image_static_rectangle?.source;

  return (
    <div
      className={`lock_size_${data?.size ?? 1002}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor,
        overflow: 'hidden',
        borderRadius: '8px',
        // borderRadius: '50%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
        { backgroundimage ? <img src={backgroundimage} alt="" style={{ 
            width: '100%',
            height: '100%',
        }} /> : null }
    </div>
  );
}
