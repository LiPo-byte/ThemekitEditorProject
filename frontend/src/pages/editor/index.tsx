import React from 'react';
import CropTool from './components/CropTool';
import EditorBottomToolBar from './components/EditorBottomToolBar';
import EditorCanvas from './components/EditorCanvas';
import EditorToolbar from './components/EditorToolbar';
import HeaderControls from './components/HeaderControls';
import LeftPanel from './components/LeftPanel';
import PreviewDevices from './components/PreviewDevices';
import RightPanel from './components/RightPanel';
import ZoomToolBar from './components/ZoomToolBar';
import { EditorCoreProvider } from './context';
import { useStyles } from './style';

const EditorPageContent: React.FC = () => {
  const { styles } = useStyles();
  return (
    <div className={styles.root}>
      {/* <EditorTopMenu /> */}
      <div className={styles.body}>
        <EditorToolbar />
        <LeftPanel />
        <EditorCanvas />
        <RightPanel />
        <EditorBottomToolBar />
        <ZoomToolBar />
        <HeaderControls />
        <PreviewDevices />
        <CropTool />
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
