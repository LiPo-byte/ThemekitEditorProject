import React from 'react';
import { Position, NodeToolbar } from '@xyflow/react';
// import { createStyles } from 'antd-style';
import { useEditorHideUISetter, useEditorCropToolOpenSetter } from '../context';
import { Button } from 'antd';
import { ExportOutlined, DeleteTwoTone } from '@ant-design/icons';
import { CropSvg } from '@/icons';

// const useStyles = createStyles(({ css, token }) => ({
//   popover: css`
//     position: absolute;
//     z-index: 10;
//     /* 中心对齐到选中节点正上方，再上抬 GAP px */
//     transform: translate(-50%, calc(-100% - 8px));
//     padding: 4px 8px;
//     background: ${token.colorBgElevated};
//     border: 1px solid ${token.colorBorderSecondary};
//     border-radius: ${token.borderRadius}px;
//     box-shadow: ${token.boxShadowSecondary};
//     pointer-events: auto;
//     user-select: none;
//     white-space: nowrap;
//     font-size: 12px;
//     color: ${token.colorTextSecondary};
//     /* 出现动画：从下方滑入 + 淡入；结束后无缝衔接到上面的静态 transform */
//     animation: action-popover-in 1s cubic-bezier(0.16, 1, 0.3, 1);

//     @keyframes action-popover-in {
//       from {
//         opacity: 0;
//         transform: translate(-50%, calc(-100% - 2px));
//       }
//       to {
//         opacity: 1;
//         transform: translate(-50%, calc(-100% - 8px));
//       }
//     }
//   `,
// }));

/**
 * 选中节点上方的浮动操作栏（Action Popover）。
 * 通过订阅 EditorCore 的选中/布局事件实时更新位置；
 * 未选中时不渲染。
 */
const ActionPopover: React.FC = (props: any) => {
  const { data: { isVisible, actionList, nodeId } } = props;
  const setHideUI = useEditorHideUISetter();
  const setCropOpen = useEditorCropToolOpenSetter();
  const onCrop = () => {
    setHideUI(true);
    setCropOpen(true);
  };
  return (
    <>
      <NodeToolbar nodeId={nodeId} isVisible={isVisible} position={Position.Top} align='end'>
        { actionList.includes('cropable') && <Button onClick={onCrop} icon={<CropSvg/>}  shape="circle" /> }
        { actionList.includes('packable') && <Button onClick={() => {}} icon={<ExportOutlined/>}  shape="circle" /> }
        { actionList.includes('deleteable') && <Button onClick={onCrop} icon={<DeleteTwoTone/>}  shape="circle" /> }
      </NodeToolbar>
    </>
  )
}
export default ActionPopover;
