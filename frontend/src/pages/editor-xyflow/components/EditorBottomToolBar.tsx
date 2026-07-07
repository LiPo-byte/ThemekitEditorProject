import React from 'react';
import { createStyles } from 'antd-style';
import {
  useEditorBottomToolBarVisible,
  useEditorCore,
  // useEditorCoreLoading,
  useEditorExportModalOpenSetter,
  useEditorLeftPanlOpen,
  useEditorLeftPanlOpenSetter,
  useEditorExportModalOpen,
} from '../context';
import { useEnterAnimation } from '../hooks/useEnterAnimation';
import { SelectSvg, } from '@/icons'
import { Button, Flex } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { IconPackDefaultConfig } from '@/editor-core/defaultConfig'
import ExportModal from './ExportModal';

const useStyles = createStyles(({ token, css }) => ({
  toolbar: css`
    position: absolute;
    bottom: 12px;
    left: 50%;
    // right: 0;
    margin: auto;
    // transform: translateY(0px) translateX(-50%);
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
    transform: translateY(0px) translateX(-50%);
    box-shadow: ${token.boxShadowSecondary};
    background: ${token.colorBgElevated}f2;
    user-select: none;
    padding: 0 8px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  exportBtn: css`
    transition: background-color 220ms ease, border-color 220ms ease, color 220ms ease;
  `,
  exportBtnOpen: css`
    background-color: ${token.colorPrimary};
    border-color: ${token.colorPrimary};
    color: ${token.colorWhite};
  `,
  exportBtnIcon: css`
    display: inline-flex;
    transition: transform 220ms ease;
    transform: rotate(0deg);
  `,
  exportBtnIconOpen: css`
    transform: rotate(90deg);
  `
}));

const EditorBottomToolBar: React.FC = () => {
  const { styles } = useStyles();
  const visible = useEditorBottomToolBarVisible();
  const core = useEditorCore();
  // const coreLoading = useEditorCoreLoading();
  const setLeftPanlOpen = useEditorLeftPanlOpenSetter();
  const setExportModalOpen = useEditorExportModalOpenSetter();
  const exportModalOpen = useEditorExportModalOpen();
  const leftPanlOpen = useEditorLeftPanlOpen();
  const playEnterAnimation = useEnterAnimation(true, { durationMs: 260 });

  const onAddIconPack = () => {
    core?.addIconPack(IconPackDefaultConfig)
}
  if (!visible) return null;

  return (
    <div className={`${styles.toolbar} ${playEnterAnimation ? styles.barEnter : ''}`}>
        <div className={styles.toolbarbody}>
            <Flex gap="medium" align="center">
                <Button type='primary' icon={<SelectSvg color="#000000" size={14} />}></Button>
                <Button type='text' onClick={() => {setLeftPanlOpen(!leftPanlOpen)}} >Widget</Button>
                <Button type='text' onClick={onAddIconPack} >Icon Pack</Button>
                <Button type='text' onClick={() => {}} >Wallpaper</Button>
                <Button type='text' onClick={() => {setLeftPanlOpen(!leftPanlOpen)}} >Lock Screen</Button>
                <Button type='text' onClick={() => {setLeftPanlOpen(!leftPanlOpen)}} >Theme</Button>
                <Button
                  color={exportModalOpen ? 'primary' : 'default'}
                  variant='filled'
                  shape="circle"
                  className={`${styles.exportBtn} ${exportModalOpen ? styles.exportBtnOpen : ''}`}
                  icon={
                    <span className={`${styles.exportBtnIcon} ${exportModalOpen ? styles.exportBtnIconOpen : ''}`}>
                      {exportModalOpen ? <CloseOutlined /> : <PlusOutlined />}
                    </span>
                  }
                  onClick={() => setExportModalOpen(!exportModalOpen)}
                />
            </Flex>
        </div>
        <ExportModal open={exportModalOpen} onClose={() => { setExportModalOpen(false); }} />
    </div>
  );
};

export default EditorBottomToolBar;
