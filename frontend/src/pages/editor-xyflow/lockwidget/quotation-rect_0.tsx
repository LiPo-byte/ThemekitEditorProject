import { LOCK_CARD_RADIUS } from './base-config';
import { getLockTextStyle } from './util';
import './style.css';

/**
 * 锁屏格言组件（type 1008 / 矩形）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_quotation.yml：
 * 整张卡只有 title 一段文案、没有图片位，文案在卡内居中。
 *
 * 与其他锁屏组件不同的是这段文案要折行：yml 的 numberOfLines 规定了最多显示几行，
 * 所以不能直接用 getLockTextStyle（它默认 nowrap），要把 whiteSpace 覆盖掉再做行数截断。
 */

/** 照设计稿的 465x186 图按 ÷3 估的，与 weather 系列取值一致 */
const CARD_PADDING = '6px 9px';
/** numberOfLines 缺失或非法时按设计稿的两行兜底 */
const DEFAULT_NUMBER_OF_LINES = 2;

export default function LockQuotationRect_0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  const numberOfLines = Number(data.numberOfLines) || DEFAULT_NUMBER_OF_LINES;
  /** 与首页 Quotation 一致：\n 当强制换行，其余在卡片宽度内自动折行 */
  const quoteText = String(data.title?.content ?? '').replace(/\\n/g, '\n');

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
        justifyContent: 'center',
        padding: CARD_PADDING,
        color: focusColor,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          ...getLockTextStyle(data.title),
          width: '100%',
          // 覆盖 getLockTextStyle 的 nowrap，并把超出 numberOfLines 的部分截掉
          whiteSpace: 'pre-wrap',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: numberOfLines,
          overflow: 'hidden',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
          textAlign: 'center',
        }}
      >
        {quoteText}
      </div>
    </div>
  );
}
