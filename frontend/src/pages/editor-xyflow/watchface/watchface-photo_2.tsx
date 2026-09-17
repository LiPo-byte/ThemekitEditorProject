
export default function WacthFacePhoto2(props: any) {
    const data = props.data;
    const scale = typeof props.scale === 'number' ? props.scale : 1;
  
    if (!data) return null;
  
    const width = Number(data.width) > 0 ? Number(data.width) : 396;
    const height = Number(data.height) > 0 ? Number(data.height) : 484;
    const source = data.source;

    return (
      <div
        style={{
          transform: `scale(${scale}, ${scale})`,
          transformOrigin: '0 0',
          width,
          height,
          overflow: 'hidden',
          position: 'relative',
          borderRadius: data.radius,
          background: '#ffffff',
        }}
      >
        { source ? <img src={data.source} style={{
          position: 'absolute',
          inset: 0,
          objectFit: 'cover'
        }}  alt="" /> : null}
        <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          top: 70,
          bottom: 70,
          justifyContent: "flex-end",
          right: 20,
          textAlign: 'right',
          color: source ? '#ffffff' : '#000000',
          fontSize: 30,
          lineHeight: 1,
        }}>
          <div style={{
            fontSize: 100,
          }}>
            10:09
          </div>
        </div>
      </div>
    );
  }
  