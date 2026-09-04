import { getLockTextStyle } from './util';
import './style.css';

/**
 * 锁屏自定义文案组件（type 1011 / layoutType 0 / inline）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_custom_size_3.yml：
 * 整条只有 title.content 一段文案，没有图片位。
 *
 * title 下只有 content 是 yml 的必填项，font / textSize 都不在模板里，
 * 字号字体由 getLockTextStyle 的默认值兜底，不在这里硬编码第二套默认值。
 *
 * numberOfLines 在 yml 里被钉死为 1，所以不按它折行，超宽直接省略号截断。
 */

export default function LockCustomInLine_0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';

  return (
    <div
      className={`lock_size_${data?.size ?? 1003}`}
      style={{
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
        backgroundColor,
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: focusColor,
        pointerEvents: 'none',
        borderRadius: '5px'
      }}
    >
      <div
        style={{
          ...getLockTextStyle(data.title),
          // 只有一行，装不下的部分按 iOS 的表现截断
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {data.title?.content ?? ''}
      </div>
    </div>
  );
}
