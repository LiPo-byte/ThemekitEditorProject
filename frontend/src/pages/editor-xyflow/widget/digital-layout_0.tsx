// import { useEffect, useMemo, useRef } from 'react';
import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
} from '../context';
import { resolveWidgetFontFamily } from './util';
import './style.css';

const getTextStyle = (parentId?: string, textData?: any) => ({
  fontSize: textData?.textSize ?? 14,
  fontFamily: resolveWidgetFontFamily(parentId, textData?.font),
  opacity: textData?.alpha ?? 1,
  color: textData?.textColor ?? '#111827',
  lineHeight: 1,
  // height: textData?.textHeight ? `${textData.textHeight}px` : 'auto',
  whiteSpace: 'nowrap' as const,
});
export default function DigitalLayout_0(props: any) {
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const data = props.data;
  const scale = props.scale || 1;
  if (!data) return null;
  const showAmAndPm = data.AmAndPm && data.AmAndPm.show;
  const showWeekday = data.weekday && data.weekday.show;
  const size = data.size;
  const paddSize:any = {1: '20px 10px', 2: '16px 20px 0 20px', 3: '30px 42px'};
  const getTextJustifyContent = (textAlignment: number):any => {
    if (textAlignment === 1) {
      return {
        justifyContent: 'flex-start',
      }
    }
    if (textAlignment === 3) {
      return {
        justifyContent: 'flex-end',
      }
    }
    return {
      justifyContent: 'center',
    }
  }

  const renderWeekday = () => {
    if (!showWeekday) {
      return null;
    }
    return  <div style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 5,
      ...getTextStyle(props.parentId, data?.weekday),
      color: data?.weekday?.unSelectedTextColor
    }}>
      <div>Mon</div>
      <div>Tue</div>
      <div>Wed</div>
      <div>Thu</div>
      <div style={{ padding: '2px 4px', background: data?.weekday?.selectedBgColor, color: data?.weekday?.selectedTextColor, borderRadius: '2px' }} >Fri</div>
      <div>Sat</div>
      <div>Sun</div>
    </div>
  }
  const renderTimeAndAPM = () => {
    return   <div style={{
      width: '100%',
      flex: '1 1 auto',
      display: 'flex',
      alignItems: 'center',
      ...getTextJustifyContent(data?.time?.textAlignment),
    }}>
      <div style={{
        display: 'flex',
        alignItems: showWeekday ? 'flex-end' : 'center',
      }}>
        { showAmAndPm && !showWeekday && <span style={{ ...getTextStyle(props.parentId, data?.AmAndPm), }}>AM</span> }
        <div style={{
          ...getTextStyle(props.parentId, data?.time),
        }} >10:09</div>
        { showAmAndPm && showWeekday && <span style={{ ...getTextStyle(props.parentId, data?.AmAndPm), }}>AM</span> }
      </div>
    </div>
  }

  return (
    <div className={`size_${data?.size}`} style={{
      transform: `scale(${scale}, ${scale})`,
      transformOrigin: '0 0',
      backgroundColor: '#ffffff',
      overflow: isCropEditingNode ? 'visible' : 'hidden',
      borderRadius: `${data.radius ?? 0}px`,
      boxSizing: 'border-box',
      position: 'relative',
      padding: paddSize[size],
    }}>
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      {size === 1 || size === 3 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100%',
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            ...getTextStyle(props.parentId, data?.date),
            ...getTextJustifyContent(data?.date?.textAlignment),
          }}>
            { showWeekday ? '2026-01-09' : '01-09 Fri' }
          </div>
          { renderTimeAndAPM() }
          { renderWeekday() }
        </div>
      ) : null}
      {size === 2 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100%',
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{
            display: 'flex',
            width: '100%',
          }}>
            <div style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              ...getTextStyle(props.parentId, data?.date),
              ...getTextJustifyContent(data?.date?.textAlignment),
            }}>
              2026-01-09
            </div>
            { showWeekday && (
              <div style={{
                  width: '70%',
                  display: 'flex',
                  alignItems: 'center',
              }}>
                { renderWeekday() }
              </div>
            )}
          </div>
          { renderTimeAndAPM() }
        </div>
      ) : null}
    </div>
  );
}