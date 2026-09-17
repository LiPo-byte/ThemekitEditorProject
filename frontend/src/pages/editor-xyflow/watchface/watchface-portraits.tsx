export default function WacthFacePortraits(props: any) {
    const data = props.data;
    const scale = typeof props.scale === 'number' ? props.scale : 1;
  
    if (!data) return null;
  
    const width = Number(data.width) > 0 ? Number(data.width) : 396;
    const height = Number(data.height) > 0 ? Number(data.height) : 484;
    const hasDate = data.hasDate;
    const alignment = data.alignment;

    const contentSource = data.contentSource?.source || '';
    const backgroundSource = data.backgroundSource?.source || '';
    const maskSource = data.maskSource?.source || '';

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
        {backgroundSource ? <img src={backgroundSource} style={{
            position: 'absolute',
            inset: 0,
            objectFit: 'cover',
            zIndex: 1,
        }} alt="" /> : null }
        {maskSource ? <img src={maskSource} style={{
            position: 'absolute',
            inset: 0,
            objectFit: 'cover',
            zIndex: 3,
        }} alt="" /> : null }
        {contentSource ? <img src={contentSource} style={{
            position: 'absolute',
            inset: 0,
            objectFit: 'cover',
            zIndex: 4,
        }} alt="" /> : null }
        <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          top: 30,
          bottom: 30,
          justifyContent: alignment === 'top' ? 'flex-start' : "flex-end",
          right: 20,
          left: 20,
          textAlign: 'center',
          fontSize: 30,
          lineHeight: 1,
          zIndex: 2,
        }}>
          {hasDate ? (<div>
            FRI 23
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
  