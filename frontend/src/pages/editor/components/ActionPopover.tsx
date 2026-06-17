import React, { useEffect, useMemo, useState } from 'react';
import { createStyles } from 'antd-style';
import { useEditorCore, useEditorHideUISetter, useEditorCropToolOpenSetter } from '../context';
import { Button } from 'antd';
import { ExportOutlined, DeleteTwoTone } from '@ant-design/icons';
import { CropSvg } from '@/icons';

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




/**
 * 选中节点上方的浮动操作栏（Action Popover）。
 * 通过订阅 EditorCore 的选中/布局事件实时更新位置；
 * 未选中时不渲染。
 */
const ActionPopover: React.FC = () => {
  const core = useEditorCore();
  const setHideUI = useEditorHideUISetter();
  const setCropOpen = useEditorCropToolOpenSetter();
  const { styles } = useStyles();
  const [rect, setRect] = useState<Rect | null>(null);
  const [caps, setCaps] = useState({ canDelete: false, canExport: false, canCrop: false });
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const rectRef = React.useRef<Rect | null>(null);


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

  const isRectChanged = (prevRect: Rect | null, nextRect: Rect | null) => {
    if (prevRect === nextRect) return false;
    if (!prevRect || !nextRect) return prevRect !== nextRect;
    return (
      Math.abs(prevRect.x - nextRect.x) > RECT_EPSILON ||
      Math.abs(prevRect.y - nextRect.y) > RECT_EPSILON ||
      Math.abs(prevRect.width - nextRect.width) > RECT_EPSILON ||
      Math.abs(prevRect.height - nextRect.height) > RECT_EPSILON
    );
  };

  useEffect(() => {
    if (!core) {
      rectRef.current = null;
      setRect(null);
      setCaps({ canDelete: false, canExport: false, canCrop: false });
      return;
    }
    const sync = () => {
      const nextRect = core.getSelectionScreenRect();
      const prevRect = rectRef.current;
      const changed = isRectChanged(prevRect, nextRect);
      if (!changed) return false;
      rectRef.current = nextRect;
      setRect(nextRect);
      return true;
    };
    const offSel = core.onSelectionChange((node: any[] | null) => {
      setCaps(core.getSelectionCapabilities());
      const rectChanged = sync();
      if (!node?.length) return;
      if (!rectChanged) return;
      requestAnimationFrame(replayEnterAnimation);
    });
    const offLayout = core.onLayoutChange(sync);
    setCaps(core.getSelectionCapabilities());
    sync();
    return () => {
      offSel();
      offLayout();
    };
  }, [core]);

  const onCorp = () => {
    if (!core) return;
    core.crop();
    setHideUI(true);
    setCropOpen(true);
  }

  const onDeleteNode = () => {
      if (!core) return;
      core.deleteSelectedNodes();
  }

  const actionList = useMemo(() => {
    return (
      <>
        {caps.canCrop ? <Button type='text' onClick={onCorp} icon={<CropSvg />} /> : null}
        {caps.canExport ? <Button type='text' icon={<ExportOutlined />} /> : null}
        {caps.canDelete ? (
          <Button
            type='text'
            onClick={onDeleteNode}
            icon={<DeleteTwoTone twoToneColor="#eb2f96" />}
          />
        ) : null}
      </>
    )
  }, [caps, onCorp, onDeleteNode])

  const hasAction = caps.canDelete || caps.canExport || caps.canCrop;

  if (!rect || !core || !hasAction) return null;

  const left = rect.x + rect.width / 2;
  const top = rect.y;

  return (
    <div ref={popoverRef} className={styles.popover} style={{ left, top }}>
      {/* {children ?? <span>Action Popover</span>} */}
      {/* <Button type='text' onClick={onCorp} icon={<CropSvg />} />
      <Button type='text' icon={<ExportOutlined />} />
      <Button
          type='text'
          icon={<DeleteTwoTone twoToneColor="#eb2f96" />}
      /> */}
      {actionList}
    </div>
  );
};

export default ActionPopover;
