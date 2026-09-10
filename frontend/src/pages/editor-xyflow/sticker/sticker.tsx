const DEFAULT_SIZE = 450;

/** 画布上的贴纸：有 movsource 就播 mov（gif 贴纸的主体），否则展示图片 */
export default function Sticker(props: any) {
  const data = props.data;
  const scale = typeof props.scale === 'number' ? props.scale : 1;

  if (!data) return null;

  const width = Number(data.width) > 0 ? Number(data.width) : DEFAULT_SIZE;
  const height = Number(data.height) > 0 ? Number(data.height) : DEFAULT_SIZE;
  const mediaStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const,
    display: 'block',
  };

  const renderMedia = () => {
    if (data.movsource) {
      return (
        <video
          src={data.movsource}
          style={mediaStyle}
          autoPlay
          loop
          muted
          playsInline
        />
      );
    }
    if (data.source) {
      return <img src={data.source} alt="" style={mediaStyle} />;
    }
    return null;
  };

  return (
    <div
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        width,
        height,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {renderMedia()}
    </div>
  );
}
