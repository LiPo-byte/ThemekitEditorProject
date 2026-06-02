import React from 'react';
import EditorCanvas from './components/EditorCanvas';
import EditorToolbar from './components/EditorToolbar';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import EditorBottomToolBar from './components/EditorBottomToolBar';
import ZoomToolBar from './components/ZoomToolBar';
import HeaderControls from './components/HeaderControls';
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
