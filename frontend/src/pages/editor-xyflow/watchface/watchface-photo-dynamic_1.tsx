export default function WacthFacePhotoDynamic1(props: any) {
    const data = props.data;
    const scale = typeof props.scale === 'number' ? props.scale : 1;
  
    if (!data) return null;
  
    const width = Number(data.width) > 0 ? Number(data.width) : 396;
    const height = Number(data.height) > 0 ? Number(data.height) : 484;
    const source = data.source;
    const hasDate = data.hasDate;
    const alignment = data.alignment;

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
        {data.movsource ? <video src={data.movsource} autoPlay loop muted playsInline /> : null}
        <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          top: 70,
          bottom: 70,
          justifyContent: alignment === 'top' ? 'flex-start' : "flex-end",
          right: 20,
          textAlign: 'right',
          color: data.movsource ? '#ffffff' : '#000000',
          fontSize: 30,
          lineHeight: 1,
        }}>
          {hasDate ? (<div>
            THU 14
          </div>) : null}
          <div style={{
            fontSize: 100,
          }}>
            10:09
          </div>
        </div>
      </div>
    );
  }
  