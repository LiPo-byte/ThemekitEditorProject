import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import CropTool from './components/CropTool';
import DesktopEditTool from './components/DesktopEditTool';
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
  useEditorCanEdit,
  useEditorGlobalLoading,
  useEditorThemeMode,
} from './context';
import { useEditorShortcuts } from './hooks/useEditorShortcuts';
import { useStyles } from './style';

const EditorPageContent: React.FC = () => {
  // root 上挂 --editor-panel-border，各面板的边框颜色统一由它继承
  const { styles } = useStyles(useEditorThemeMode() === 'realDark');
  const globalLoading = useEditorGlobalLoading();
  const canEdit = useEditorCanEdit();
  useEditorShortcuts();
  return (
    <div className={styles.root}>
      <div className={styles.body}>
        <EditorStage />
        <EditorToolbar />
        {/* 只读预览就是纯看：属性表单、添加元素的底部栏都不出现，
            左侧面板只能由底部栏打开，跟着一起收掉 */}
        {canEdit ? (
          <>
            <LeftPanel />
            <RightPanel />
            <EditorBottomToolBar />
          </>
        ) : null}
        <HeaderControls />
        <CropTool />
        <DesktopEditTool />
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

// ReactFlowProvider 提到 EditorCoreProvider 之外，context 内才能拿到画布实例做视角控制
const EditorPage: React.FC = () => {
  return (
    <ReactFlowProvider>
      <EditorCoreProvider>
        <EditorPageContent />
      </EditorCoreProvider>
    </ReactFlowProvider>
  );
};

export default EditorPage;
