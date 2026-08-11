import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import { resolveWidgetFontFamily, resolveHexColorWithAlpha } from './util';
import { PauseOutlined, CaretRightOutlined, StepForwardOutlined } from '@ant-design/icons';
import thriller from '../../../assets/thriller.png';
import './style.css';

const getTextStyle = (parentId?: string, textData?: any) => ({
  fontSize: textData?.textSize ?? 14,
  fontFamily: resolveWidgetFontFamily(parentId, textData?.font),
  opacity: textData?.alpha ?? 1,
  color: textData?.textColor ?? '#111827',
  lineHeight: 1,
  height: textData?.textHeight ? `${textData.textHeight}px` : 'auto',
  // whiteSpace: 'nowrap' as const,
});
const getCommonStyle = (parentId?: string, textData?: any) => ({
  fontSize: textData?.intCommonField ?? 14,
  fontFamily: resolveWidgetFontFamily(parentId, textData?.commonField),
  opacity: textData?.alpha ?? 1,
  color: textData?.textColor ?? '#111827',
  lineHeight: 1,
  height: textData?.textHeight ? `${textData.textHeight}px` : 'auto',
  // whiteSpace: 'nowrap' as const,
});
/** thriller.png 的原始尺寸，模糊背景按倍数放大，换素材时需同步 */
const PLAYER_BLUR_BG_NATURAL_SIZE = 270;
const PLAYER_BLUR_BG_SCALE = 3;
const PLAYER_BLUR_BG_BLUR_PX = 15;

// 单独一层裁剪容器，避免给播放器框加 overflow 影响到原有内容的溢出表现。
// inset 定位基于 padding box，所以 3px 边框仍然完整显示在模糊层之上。
const playerBlurBgLayerStyle = {
  position: 'absolute' as const,
  inset: 0,
  overflow: 'hidden' as const,
  // borderRadius: '5px',
  pointerEvents: 'none' as const,
  // 负层级让它落在播放器框自身背景之上、内容之下
  zIndex: -1,
};

const playerBlurBgImageStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  width: PLAYER_BLUR_BG_NATURAL_SIZE * PLAYER_BLUR_BG_SCALE,
  height: PLAYER_BLUR_BG_NATURAL_SIZE * PLAYER_BLUR_BG_SCALE,
  transform: 'translate(-50%, -50%)',
  filter: `blur(${PLAYER_BLUR_BG_BLUR_PX}px)`,
};

const renderPlayerBlurBackground = () => (
  <div style={playerBlurBgLayerStyle}>
    <img src={thriller} alt="" style={playerBlurBgImageStyle} />
  </div>
);

export default function MusicLayout_0(props: any) {
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;
  const size = data.size;
  const playerSource = data?.player?.source;

  return (
    <div
      className={`size_${data?.size ?? 1}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor: '#ffffff',
        overflow: isCropEditingNode ? 'visible' : 'hidden',
        borderRadius: `${data.radius ?? 0}px`,
        position: 'relative',
        padding: '16px',
      }}
    >
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      { size === 1 && (
        <div style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          border: `3px solid ${data.player.borderColor}`,
          borderRadius: '5px',
        }}>
          {renderPlayerBlurBackground()}
          <img src={thriller} alt="" />
          <StepForwardOutlined style={{ position: 'absolute', right: 7, bottom: 7, color: '#ef9f9f' }} />
        </div>
      ) }
      { size === 2 && (
        <div style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          display: 'flex',
        }}>
          <div style={{
            flex: '1 1 auto',
            border: `3px solid ${data.player.borderColor}`,
            borderRadius: '5px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            // position + zIndex 让模糊背景层的负层级被限制在这个框内
            position: 'relative',
            zIndex: 0,
          }}>
            {renderPlayerBlurBackground()}
            <div style={{
              margin: '0 4px 0 6px',
              display: 'flex',
              gap: 4,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img src={thriller} alt="" style={{ width:84, borderRadius: 5 }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 5,
              }}>
                <span style={{ ...getTextStyle(props.parentId, data.player), fontSize: 11 * scale }}>Billie Jean</span>
                <span style={{ ...getCommonStyle(props.parentId, data.player), fontSize: 8 * scale }}>Michael Jackson</span>
              </div>
            </div>
            <div style={{
              margin: '0 4px 0 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
            }}>
              <span style={{ ...getCommonStyle(props.parentId, data.player) }}>0:35</span>
              <div style={{
                width: '100px',
                flex: 'none',
                height: '6px',
                background: resolveHexColorWithAlpha(data.player.textColor, 0.5),
                borderRadius: '999px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: '50%',
                  height: '100%',
                  background: data.player.textColor,
                }}></div>
              </div>
              <span style={{ ...getCommonStyle(props.parentId, data.player) }}>2:10</span>
            </div>
          </div>
          <div style={{
            width: 152,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            { playerSource ? <img src={playerSource} alt="" style={{ height: '100%' }} /> : null}
          </div>
        </div>
      ) }
      { size === 3 && (
        <div style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            flex: '1 1 auto',
            border: `3px solid ${data.player.borderColor}`,
            borderRadius: '5px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            // position + zIndex 让模糊背景层的负层级被限制在这个框内
            position: 'relative',
            zIndex: 0,
          }}>
            {renderPlayerBlurBackground()}
            <div style={{
              margin: '0 9px 0 9px',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              // justifyContent: 'space-between',
            }}>
              <img src={thriller} alt="" style={{ width: 126, borderRadius: 5 }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 5,
              }}>
                {/* <span style={{ ...getTextStyle(props.parentId, data.player) }}>Billie Jean</span>
                <span style={{ ...getCommonStyle(props.parentId, data.player) }}>Michael Jackson</span> */}
                <span style={{ ...getTextStyle(props.parentId, data.player), fontSize: 18 * scale }}>Billie Jean</span>
                <span style={{ ...getCommonStyle(props.parentId, data.player), fontSize: 12 * scale }}>Michael Jackson</span>
              </div>
            </div>
            <div style={{
              margin: '0 4px 0 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
            }}>
              <span style={{ ...getCommonStyle(props.parentId, data.player) }}>0:35</span>
              <div style={{
                width: '200px',
                flex: 'none',
                height: '6px',
                background: resolveHexColorWithAlpha(data.player.textColor, 0.5),
                borderRadius: '999px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: '50%',
                  height: '100%',
                  background: data.player.textColor,
                }}></div>
              </div>
              <span style={{ ...getCommonStyle(props.parentId, data.player) }}>2:10</span>
            </div>
          </div>
          <div style={{
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            { playerSource ? <img src={playerSource} alt="" style={{ height: '90%' }} /> : null}
          </div>
        </div>
      ) }
    </div>
  );
}
