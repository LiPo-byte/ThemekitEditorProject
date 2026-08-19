import type { CSSProperties } from 'react';
import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
  useEditorGetParentNodeData,
} from '../context';
import { resolveWidgetFontFamily, resolveHexColorWithAlpha } from './util';
import { StepForwardOutlined } from '@ant-design/icons';
import thrillerdefault from '../../../assets/thriller.png';
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
// 老数据里没有 music 字段，兜底成占位文案，避免画布上显示空白
const DEFAULT_SONG_NAME = 'Billie Jean';
const DEFAULT_SINGER = 'Michael Jackson';

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

const renderPlayerBlurBackground = (thrillerSource?: string) => (
  <div style={playerBlurBgLayerStyle}>
    <img src={thrillerSource || thrillerdefault} alt="" style={playerBlurBgImageStyle} />
  </div>
);

/** 小组件右下角的播放/暂停按钮：三角形 7*10、竖条 2*10、间距 1 */
const SMALL_PLAYER_ICON_COLOR = '#777777';

const smallPlayerIconStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

// 用 border 画三角：上下各 5px 透明撑出 10 的高，左边 7px 实色即三角本体
const smallPlayerTriangleStyle: CSSProperties = {
  width: 0,
  height: 0,
  borderTop: '5px solid transparent',
  borderBottom: '5px solid transparent',
  borderLeft: `7px solid ${SMALL_PLAYER_ICON_COLOR}`,
};

const smallPlayerBarStyle: CSSProperties = {
  width: 2,
  height: 10,
  backgroundColor: SMALL_PLAYER_ICON_COLOR,
};

const renderSmallPlayerIcon = () => (
  <div style={smallPlayerIconStyle}>
    <div style={smallPlayerTriangleStyle} />
    <div style={smallPlayerBarStyle} />
    <div style={smallPlayerBarStyle} />
  </div>
);

export default function MusicLayout_0(props: any) {
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;
  const getParentNodeData = useEditorGetParentNodeData();
  const parentData = getParentNodeData(props.id) ?? props.parentData ?? {};
  const { singer, songName, source } = parentData.music ?? {};
  const displaySongName = songName ?? DEFAULT_SONG_NAME;
  const displaySinger = singer ?? DEFAULT_SINGER;
  let thriller = source || thrillerdefault;
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
          width: '120px',
          height: '120px',
          border: `3px solid ${data.player.borderColor}`,
          borderRadius: '5px',
        }}>
          {renderPlayerBlurBackground(thriller)}
          <img src={thriller} alt="" style={{ width: '100%', height: '100%' }} />
          <div style={{
            position: 'absolute', right: 7, bottom: 7
          }}>
            {renderSmallPlayerIcon()}
          </div>
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
            width: '160px',
            height: '120px',
          }}>
            {renderPlayerBlurBackground(thriller)}
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
                flex: '1 1 auto',
                gap: 5,
              }}>
                <span style={{ ...getTextStyle(props.parentId, data.player), fontSize: 11 * scale }}>{displaySongName}</span>
                <span style={{ ...getCommonStyle(props.parentId, data.player), fontSize: 8 * scale }}>{displaySinger}</span>
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
            marginLeft: '21px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            { playerSource ? <img src={playerSource} alt="" style={{ width: '100%', 'objectFit': 'cover' }} /> : null}
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
            {renderPlayerBlurBackground(thriller)}
            <div style={{
              margin: '9px 9px 12px 9px',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              // justifyContent: 'space-between',
            }}>
              <img src={thriller} alt="" style={{ width: 126, height: 126, flex: 'none', borderRadius: 6 }} />
              <div style={{
                display: 'flex',
                // alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                flex: '1 1 auto',
                gap: 5,
              }}>
                <span style={{ ...getTextStyle(props.parentId, data.player), fontSize: 18 * scale }}>{displaySongName}</span>
                <span style={{ ...getCommonStyle(props.parentId, data.player), fontSize: 12 * scale }}>{displaySinger}</span>
              </div>
            </div>
            <div style={{
              margin: '0 4px 9px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              // gap: 6,
            }}>
              <span style={{ ...getCommonStyle(props.parentId, data.player) }}>0:35</span>
              <div style={{
                width: '230px',
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
            height: 140,
            display: 'flex',
            // alignItems: 'center',
            justifyContent: 'center',
            marginTop: 13,
          }}>
            { playerSource ? <img src={playerSource} alt="" style={{ height: '90%', 'objectFit': 'cover' }} /> : null}
          </div>
        </div>
      ) }
    </div>
  );
}
