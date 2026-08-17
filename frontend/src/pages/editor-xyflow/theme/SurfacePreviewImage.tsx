export type SurfacePreviewImageProps = {
  /** 画布节点宽度，取 config 固定值 */
  width: number;
  /** 画布节点高度，取 config 固定值 */
  height: number;
  /** 右侧面板上传的预览图 */
  source?: string;
};

/** 预览面：直接展示上传的成品图，不再按 showElements 拼装 */
export default function SurfacePreviewImage({
  width,
  height,
  source,
}: SurfacePreviewImageProps) {
  const imageSource = String(source || '').trim();

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {imageSource ? (
        <img
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          src={imageSource}
          alt=""
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#bfbfbf',
            fontSize: 48,
            letterSpacing: '0.08em',
            userSelect: 'none',
          }}
        >
          未上传预览图
        </div>
      )}
    </div>
  );
}
