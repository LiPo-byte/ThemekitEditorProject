import React from 'react';
import { createStyles } from 'antd-style';
import { useEditorCoreLoading, useEditorLeftPanlOpen, useEditorLeftPanlOpenSetter } from '../context';
import { useEnterAnimation } from '../hooks/useEnterAnimation';
import { SelectSvg, } from '@/icons'
import { Button, Flex, Divider } from 'antd';
import { ProductOutlined, PlusOutlined } from '@ant-design/icons';

const useStyles = createStyles(({ token, css }) => ({
  toolbar: css`
    position: absolute;
    bottom: 12px;
    left: 50%;
    // right: 0;
    margin: auto;
    transform: translateY(0px) translateX(-50%);
    // width: 500px;
    // height: 50px;
  `,
  barEnter: css`
    animation: toolbar-slide-up 260ms ease-out;
    @keyframes toolbar-slide-up {
      from {
        // transform: translateY(50px);
        transform: translateY(50px) translateX(-50%);
        opacity: 0;
      }
      to {
        transform: translateY(0) translateX(-50%);
        opacity: 1;
      }
    }
  `,
  toolbarbody: css`
    overflow: hidden;
    border-radius: 12px;
    box-shadow: ${token.boxShadowSecondary};
    background: ${token.colorBgElevated}f2;
    user-select: none;
    padding: 0 8px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  `
}));

const EditorBottomToolBar: React.FC = () => {
  const { styles } = useStyles();
  const coreLoading = useEditorCoreLoading();
  const setLeftPanlOpen = useEditorLeftPanlOpenSetter();
  const leftPanlOpen = useEditorLeftPanlOpen();
  const playEnterAnimation = useEnterAnimation(coreLoading, { durationMs: 260 });

//   const onWidgetClick = () => {
//     setLeftPanlOpen(!leftPanlOpen);
//   }
  return (
    <div className={`${styles.toolbar} ${playEnterAnimation ? styles.barEnter : ''}`}>
        <div className={styles.toolbarbody}>
            <Flex gap="medium" align="center">
                <Button type='primary' icon={<SelectSvg color="#000000" size={14} />}></Button>
                <Button type='text' onClick={() => {setLeftPanlOpen(!leftPanlOpen)}} >Widget</Button>
                <Button type='text' onClick={() => {setLeftPanlOpen(!leftPanlOpen)}} >Icon Pack</Button>
                <Button type='text' onClick={() => {setLeftPanlOpen(!leftPanlOpen)}} >Wallpaper</Button>
                <Button type='text' onClick={() => {setLeftPanlOpen(!leftPanlOpen)}} >Lock Screen</Button>
                <Button type='text' onClick={() => {setLeftPanlOpen(!leftPanlOpen)}} >Theme</Button>
                <Button color="default" variant='filled' shape="circle" icon={<PlusOutlined />}></Button>
            </Flex>
        </div>
    </div>
  );
};

export default EditorBottomToolBar;
