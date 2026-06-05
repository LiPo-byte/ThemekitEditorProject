import React, { useEffect, useState } from 'react';
import { createStyles } from 'antd-style';
import { useEditorCore, useEditorHideUISetter, useEditorCropToolOpenSetter } from '../context';
import { Button } from 'antd';
import { BlockOutlined, ExportOutlined } from '@ant-design/icons';

const useStyles = createStyles(({ css, token }) => ({
  popover: css`
    position: absolute;
    z-index: 10;
    /* 中心对齐到选中节点正上方，再上抬 GAP px */
    transform: translate(-50%, calc(-100% - 8px));
    padding: 4px 8px;
    background: ${token.colorBgElevated};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
    box-shadow: ${token.boxShadowSecondary};
    pointer-events: auto;
    user-select: none;
    white-space: nowrap;
    font-size: 12px;
    color: ${token.colorTextSecondary};
    /* 出现动画：从下方滑入 + 淡入；结束后无缝衔接到上面的静态 transform */
    animation: action-popover-in 1s cubic-bezier(0.16, 1, 0.3, 1);

    @keyframes action-popover-in {
      from {
        opacity: 0;
        transform: translate(-50%, calc(-100% - 2px));
      }
      to {
        opacity: 1;
        transform: translate(-50%, calc(-100% - 8px));
      }
    }
  `,
}));

type Rect = { x: number; y: number; width: number; height: number };
const RECT_EPSILON = 0.5;


interface ActionPopoverProps {
  /** 自定义按钮区；不传时显示占位文案 */
  children?: React.ReactNode;
}

/**
 * 选中节点上方的浮动操作栏（Action Popover）。
 * 通过订阅 EditorCore 的选中/布局事件实时更新位置；
 * 未选中时不渲染。
 */
const ActionPopover: React.FC<ActionPopoverProps> = ({ children }) => {
  const core = useEditorCore();
  const setHideUI = useEditorHideUISetter();
  const setCropOpen = useEditorCropToolOpenSetter();
  const { styles } = useStyles();
  const [rect, setRect] = useState<Rect | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);

  const replayEnterAnimation = () => {
    const el = popoverRef.current;
    if (!el) return;
    el.getAnimations().forEach((animation) => {
      animation.cancel();
    });
    el.animate(
      [
        { opacity: 0, transform: 'translate(-50%, calc(-100% - 2px))' },
        { opacity: 1, transform: 'translate(-50%, calc(-100% - 8px))' },
      ],
      {
        duration: 180,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'both',
      },
    );
  };

  useEffect(() => {
    if (!core) {
      setRect(null);
      return;
    }
    const sync = () => {
      const nextRect = core.getSelectionScreenRect();
      setRect((prevRect) => {
        if (prevRect === nextRect) return prevRect;
        if (!prevRect || !nextRect) return nextRect;
        const changed =
          Math.abs(prevRect.x - nextRect.x) > RECT_EPSILON ||
          Math.abs(prevRect.y - nextRect.y) > RECT_EPSILON ||
          Math.abs(prevRect.width - nextRect.width) > RECT_EPSILON ||
          Math.abs(prevRect.height - nextRect.height) > RECT_EPSILON;
        return changed ? nextRect : prevRect;
      });
    };
    const offSel = core.onSelectionChange((node) => {
      sync();
      if (!node) return;
      requestAnimationFrame(replayEnterAnimation);
    });
    const offLayout = core.onLayoutChange(sync);
    sync();
    return () => {
      offSel();
      offLayout();
    };
  }, [core]);

  if (!rect) return null;

  const left = rect.x + rect.width / 2;
  const top = rect.y;

  return (
    <div ref={popoverRef} className={styles.popover} style={{ left, top }}>
      {/* {children ?? <span>Action Popover</span>} */}
      {
        <Button
            type='text'
            onClick={() => {
              core?.crop();
              setHideUI(true);
              setCropOpen(true);
            }}
            icon={<BlockOutlined />}
        />
      }
      <Button type='text' icon={<ExportOutlined />} />
    </div>
  );
};

export default ActionPopover;
