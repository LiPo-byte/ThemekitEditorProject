import React from 'react';
import { createStyles } from 'antd-style';
import {
//   useEditorBottomToolBarVisible,
  useEditorCore,
  useEditorHideUISetter,
//   useEditorCoreLoading,
//   useEditorLeftPanlOpen,
//   useEditorLeftPanlOpenSetter,
  useEditorCropToolOpenSetter,
  useEditorCropToolOpen,
} from '../context';
import { useEnterAnimation } from '../hooks/useEnterAnimation';
import { SelectSvg, } from '@/icons'
import { Button, Flex, Divider } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';

const useStyles = createStyles(({ token, css }) => ({
  toolbar: css`
    position: absolute;
    bottom: 0;
    left: 0px;
    right: 0px;
    margin: auto;
    overflow: hidden;
    box-shadow: ${token.boxShadowSecondary};
    background: ${token.colorBgElevated}f2;
    user-select: none;
    padding: 0 8px;
    height: 40px;
    // display: flex;
    // align-items: center;
    // justify-content: center;
  `,
  barEnter: css`
    animation: toolbar-slide-up 260ms ease-out;
    @keyframes toolbar-slide-up {
      from {
        // transform: translateY(50px);
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
//   toolbarbody: css`
//   `
}));

const CropTool: React.FC = () => {
  const { styles } = useStyles();
//   const visible = useEditorBottomToolBarVisible();
  const setHideUI = useEditorHideUISetter();
  const open = useEditorCropToolOpen();
  const setOpen = useEditorCropToolOpenSetter();
  const core = useEditorCore();
  const playEnterAnimation = useEnterAnimation(open, { durationMs: 260 });

  if (!open) return null
  return (
    <div className={`${styles.toolbar} ${playEnterAnimation ? styles.barEnter : ''}`}>
        <Flex gap="medium" align="center" justify='end' style={{ width: '100%', height: '100%' }}>
            <Button onClick={() => {
                setOpen(false);
                setHideUI(false);
                core?.closeCrop();
            }}>Cancel</Button>
            <Button type='primary'>Confirm</Button>
        </Flex>
    </div>
  );
};

export default CropTool;
