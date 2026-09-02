import React from 'react';
import { createStyles } from 'antd-style';
import {
  useEditorBottomToolBarVisible,
  useEditorCore,
  // useEditorCoreLoading,
  useEditorImportModalOpenSetter,
  useEditorLeftPanlOpen,
  useEditorLeftPanlOpenSetter,
  useEditorLeftPanlContent,
  useEditorLeftPanlContentSetter,
  useEditorImportModalOpen,
  useEditorAddIconPack,
  type LeftPanlContent,
} from '../context';
import { useEnterAnimation } from '../hooks/useEnterAnimation';
import { SelectSvg, } from '@/icons'
import { Button, Flex } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { IconPackDefaultConfig } from '@/editor-core/defaultConfig'
import ImportModal from './ImportModal';
import AddThemeModal from './AddThemeModal';

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
    border: 1px solid var(--editor-panel-border, transparent);
    box-shadow: ${token.boxShadowSecondary};
    background: ${token.colorBgElevated}f2;
    user-select: none;
    padding: 0 8px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  importBtn: css`
    transition: background-color 220ms ease, border-color 220ms ease, color 220ms ease;
  `,
  importBtnOpen: css`
    background-color: ${token.colorPrimary};
    border-color: ${token.colorPrimary};
    color: ${token.colorWhite};
  `,
  importBtnIcon: css`
    display: inline-flex;
    transition: transform 220ms ease;
    transform: rotate(0deg);
  `,
  importBtnIconOpen: css`
    transform: rotate(90deg);
  `
}));

const EditorBottomToolBar: React.FC = () => {
  const { styles, theme } = useStyles();
  const addIconPack = useEditorAddIconPack();
  const visible = useEditorBottomToolBarVisible();
  // const coreLoading = useEditorCoreLoading();
  const setLeftPanlOpen = useEditorLeftPanlOpenSetter();
  const setLeftPanlContent = useEditorLeftPanlContentSetter();
  const setImportModalOpen = useEditorImportModalOpenSetter();
  const importModalOpen = useEditorImportModalOpen();
  const leftPanlOpen = useEditorLeftPanlOpen();
  const leftPanlContent = useEditorLeftPanlContent();
  const playEnterAnimation = useEnterAnimation(true, { durationMs: 260 });
  const [addThemeModalOpen, setAddThemeModalOpen] = React.useState(false);

  const onAddIconPack = () => {
    addIconPack(IconPackDefaultConfig)
  }
  const onToggleLeftPanl = (content: LeftPanlContent) => {
    if (leftPanlOpen && leftPanlContent === content) {
      setLeftPanlOpen(false);
      return;
    }
    setLeftPanlContent(content);
    setLeftPanlOpen(true);
  }
  const onToggleAddThemeModal = () => {
    setAddThemeModalOpen((open) => !open);
  }
  if (!visible) return null;

  return (
    <div className={`${styles.toolbar} ${playEnterAnimation ? styles.barEnter : ''}`}>
        <div className={styles.toolbarbody}>
            <Flex gap="medium" align="center">
                <Button type='primary' icon={<SelectSvg color={theme.colorWhite} size={14} />}></Button>
                <Button type='text' onClick={() => { onToggleLeftPanl('widget'); }} >Widget</Button>
                <Button type='text' onClick={() => { onToggleLeftPanl('lockScreen'); }} >Lock Widget</Button>
                <Button type='text' onClick={onAddIconPack} >Icon Pack</Button>
                <Button type='text' onClick={() => { onToggleLeftPanl('wallpaper'); }} >Wallpaper</Button>
                <Button type={addThemeModalOpen ? 'primary' : 'text'} onClick={onToggleAddThemeModal} >Theme</Button>
                <Button
                  color={importModalOpen ? 'primary' : 'default'}
                  variant='filled'
                  shape="circle"
                  className={`${styles.importBtn} ${importModalOpen ? styles.importBtnOpen : ''}`}
                  icon={
                    <span className={`${styles.importBtnIcon} ${importModalOpen ? styles.importBtnIconOpen : ''}`}>
                      {importModalOpen ? <CloseOutlined /> : <PlusOutlined />}
                    </span>
                  }
                  onClick={() => setImportModalOpen(!importModalOpen)}
                />
            </Flex>
        </div>
        <ImportModal open={importModalOpen} onClose={() => { setImportModalOpen(false); }} />
        <AddThemeModal open={addThemeModalOpen} onClose={() => { setAddThemeModalOpen(false); }} />
    </div>
  );
};

export default EditorBottomToolBar;
