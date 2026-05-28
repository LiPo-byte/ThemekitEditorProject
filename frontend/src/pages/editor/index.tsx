import React from 'react';
import EditorCanvas from './components/EditorCanvas';
import EditorToolbar from './components/EditorToolbar';
import EditorTopMenu from './components/EditorTopMenu';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import { EditorCoreProvider } from './context';
import { useStyles } from './style';

const EditorPage: React.FC = () => {
  const { styles } = useStyles();

  return (
    <EditorCoreProvider>
      <div className={styles.root}>
        <EditorTopMenu />
        <EditorToolbar />
        <div className={styles.body}>
          <aside className={styles.leftPanel}>
            <LeftPanel />
          </aside>
          <main className={styles.canvas}>
            <EditorCanvas />
          </main>
          <aside className={styles.rightPanel}>
            <RightPanel />
          </aside>
        </div>
      </div>
    </EditorCoreProvider>
  );
};

export default EditorPage;
