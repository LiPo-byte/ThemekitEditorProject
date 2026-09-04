import { LOCK_ASSET_SCALE, LOCK_CARD_RADIUS } from './base-config';
import { APP_LINK_OPTIONS } from '@/pages/editor-xyflow/widget/base-config';
import { getLockMaskStyle, getLockTextStyle } from './util';
import './style.css';

/** 图片位尺寸 = yml 里 image_count_down_rectangular 的像素尺寸 ÷ LOCK_ASSET_SCALE */
const IMAGE_WIDTH = 102 / LOCK_ASSET_SCALE;
const IMAGE_HEIGHT = 102 / LOCK_ASSET_SCALE;
/**
 * 内边距和行间距是照设计稿的 465x186 图按 ÷3 估的，手调过，
 * 没有跟着 LOCK_ASSET_SCALE 换算：配置里的字号本身就是 @1x 点。
 */
const CARD_PADDING = '0 14px';
const IMAGE_TEXT_GAP = 7;


export default function LockLauncherRect_0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  const appImage = data.image_launcher_rectangle?.source;
  // appLinks[0] 存的是 APP_LINK_OPTIONS 的 value；UnSelect 时是空串，不能当成 0（App_Store）
  const appLinkValue = data.appLinks?.[0];
  const appName =
    appLinkValue === '' || appLinkValue === null || appLinkValue === undefined
      ? ''
      : (APP_LINK_OPTIONS.find((item) => item.value === Number(appLinkValue))
          // 选项文案用下划线连词（Find_My_iPhone），展示时还原成空格
          ?.label.replace(/_/g, ' ') ?? '');

  return (
    <div
      className={`lock_size_${data?.size ?? 1002}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor,
        overflow: 'hidden',
        borderRadius: LOCK_CARD_RADIUS,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: IMAGE_TEXT_GAP,
        padding: CARD_PADDING,
        color: focusColor,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          ...(appImage
            ? getLockMaskStyle(appImage, focusColor)
            : undefined),
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          // 尺寸写死，被 flex 压缩节日图就会变形
          flexShrink: 0,
        }}
      />
      <div style={{
        ...getLockTextStyle(data.title),
        flex: 1,
        textAlign: 'center',
      }}>{appName}</div>
    </div>
  );
}
