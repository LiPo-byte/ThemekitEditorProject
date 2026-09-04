import { Fragment } from 'react';
import { LOCK_ASSET_SCALE, LOCK_CARD_RADIUS } from './base-config';
import { getLockTextStyle } from './util';
import './style.css';

/**
 * 锁屏倒数日组件（type 1007 / layoutType 1 / 可自定义）。
 * 结构参照 rule_ymal/resource-validation/lock_screen_countdown_layout_1_diy.yml 和设计稿：
 * 上面一行事件名，下面三个翻页卡块、块之间各一个冒号。
 *
 * 配置字段和 layoutType 0 完全一样（title + remainDays + 那张可选图），
 * 只是排版不同：0 是左图右文案，1 是上文案下三块。三个块共用同一份 remainDays 字体配置，
 * 也共用那一张 image_count_down_rectangular_customised——yml 里只有一个图片位。
 */

/**
 * 尺寸按设计稿的 465x186 图量出来再 ÷ LOCK_ASSET_SCALE，量出来很规整：
 * 块 75x75、块间距 60，三块加两个间距 = 465-120 正好左右各留 60。
 * 冒号不靠 flex gap 摆，而是给它一个和间距等宽的槽位居中放，
 * 这样整行宽度就是 25*3 + 20*2 = 115，和实测的 115 对得上，不受冒号字宽影响。
 */
const BLOCK_SIZE = 75 / LOCK_ASSET_SCALE;
const COLON_SLOT_WIDTH = 60 / LOCK_ASSET_SCALE;
/**
 * 标题行和三块之间的间距。取 8 是反推出来的：卡片 62 高、标题行 15、块 25，
 * 垂直居中后三块正好落在 30~55，与实测一致，上下各余 7。
 */
const TITLE_BLOCKS_GAP = 8;
/** 事件名过长时留点边距再截断，不要贴到卡片边 */
const CARD_PADDING = '0 8px';

/** 画布上的示例倒数，仅用于预览，不进配置 */
const PREVIEW_GROUPS = ['00', '00', '00'];

export default function LockCountDownRectDIY_1(props: any) {
  const data = props.data;
  const scale = props.scale || 1;

  if (!data) return null;

  const focusColor = data.focusColor ?? '#000000';
  const backgroundColor = data.backgroundColor ?? '#00000066';
  const flipCardImage = data.image_count_down_rectangular_customised?.source;
  const digitStyle = getLockTextStyle(data.remainDays);

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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: TITLE_BLOCKS_GAP,
        padding: CARD_PADDING,
        color: focusColor,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          ...getLockTextStyle(data.title),
          // getLockTextStyle 已经是 nowrap，这里只补超宽截断
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {data.title?.content ?? ''}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {PREVIEW_GROUPS.map((group, index) => (
          // 三个块是同一个排版位、没有各自的配置字段，用下标当 key
          <Fragment key={index}>
            {index > 0 && (
              <div
                style={{
                  ...digitStyle,
                  width: COLON_SLOT_WIDTH,
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                :
              </div>
            )}
            <div
              style={{
                position: 'relative',
                width: BLOCK_SIZE,
                height: BLOCK_SIZE,
                // 尺寸写死，被 flex 压缩翻页卡就会变形
                flexShrink: 0,
              }}
            >
              {flipCardImage && (
                <img
                  src={flipCardImage}
                  alt=""
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              )}
              <div
                style={{
                  ...digitStyle,
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {group}
              </div>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
