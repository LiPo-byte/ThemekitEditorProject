import React, { useEffect } from 'react';
import { message } from 'antd';
import CropTool from './components/CropTool';
import EditorBottomToolBar from './components/EditorBottomToolBar';
// import EditorCanvas from './components/EditorCanvas';
import EditorStage from './editor-stage';
import EditorToolbar from './components/EditorToolbar';
import HeaderControls from './components/HeaderControls';
import LeftPanel from './components/LeftPanel';
import PreviewDevices from './components/PreviewDevices';
import RightPanel from './components/RightPanel';
import ZoomToolBar from './components/ZoomToolBar';
import { EditorCoreProvider, useEditorSaveStatus } from './context';
import { useStyles } from './style';

const EditorPageContent: React.FC = () => {
  const { styles } = useStyles();
  const [messageApi, contextHolder] = message.useMessage();
  const saveStatus = useEditorSaveStatus();
  useEffect(() => {
    if (saveStatus === 'saving') {
      messageApi.open({
        type: 'loading',
        content: '保存中',
        className: 'custom-class',
      });
    }
    if (saveStatus === 'saved') {
      messageApi.destroy()
    }
    if (saveStatus === 'error') {
      messageApi.error({
        type: 'error',
        content: '保存失败',
        className: 'custom-class',
      });
    }
  }, [saveStatus])
  return (
    <div className={styles.root}>
      {/* <EditorTopMenu /> */}
      <div className={styles.body}>
        <EditorToolbar />
        <LeftPanel />
        {/* <EditorCanvas /> */}
        <EditorStage />
        <RightPanel />
        <EditorBottomToolBar />
        {/* <ZoomToolBar /> */}
        <HeaderControls />
        <PreviewDevices />
        <CropTool />
        {/* 编辑器提示 */}
        {contextHolder}
      </div>
    </div>
  );
};

const EditorPage: React.FC = () => {
  return (
    <EditorCoreProvider>
      <EditorPageContent />
    </EditorCoreProvider>
  );
};

export default EditorPage;
