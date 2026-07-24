import React from 'react';
import CropTool from './components/CropTool';
import EditorBottomToolBar from './components/EditorBottomToolBar';
// import EditorCanvas from './components/EditorCanvas';
import EditorStage from './editor-stage';
import EditorToolbar from './components/EditorToolbar';
import HeaderControls from './components/HeaderControls';
import LeftPanel from './components/LeftPanel';
// import PreviewDevices from './components/PreviewDevices';
import RightPanel from './components/RightPanel';
// import ZoomToolBar from './components/ZoomToolBar';
import {
  EditorCoreProvider,
  useEditorGlobalLoading,
} from './context';
import { useStyles } from './style';

const EditorPageContent: React.FC = () => {
  const { styles } = useStyles();
  const globalLoading = useEditorGlobalLoading();
  return (
    <div className={styles.root}>
      <div className={styles.body}>
        <EditorStage />
        <EditorToolbar />
        <LeftPanel />
        <RightPanel />
        <EditorBottomToolBar />
        <HeaderControls />
        <CropTool />
        {globalLoading ? (
          <div className={styles.loadingMask}>
            <div className={styles.loadingCard}>
              <span className={styles.loadingDot} />
              导入中...
            </div>
          </div>
        ) : null}
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
