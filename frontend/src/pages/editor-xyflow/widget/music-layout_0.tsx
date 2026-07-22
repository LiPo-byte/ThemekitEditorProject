import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import { resolveWidgetFontFamily } from './util';
import { PauseOutlined, CaretRightOutlined } from '@ant-design/icons';
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
          <img src={thriller} alt="" />
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
          }}>
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
                <span style={{ ...getTextStyle(props.parentId, data.player) }}>Billie Jean</span>
                <span style={{ ...getCommonStyle(props.parentId, data.player) }}>Michael Jackson</span>
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
                background: '#d1d5db',
                borderRadius: '999px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: '50%',
                  height: '100%',
                  background: '#ffffff',
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
          }}>
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
                <span style={{ ...getTextStyle(props.parentId, data.player) }}>Billie Jean</span>
                <span style={{ ...getCommonStyle(props.parentId, data.player) }}>Michael Jackson</span>
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
                background: '#d1d5db',
                borderRadius: '999px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: '50%',
                  height: '100%',
                  background: '#ffffff',
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
