import { Button, Flex } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import {
  useEditorDesktopEditOpen,
  useEditorCloseDesktopEditor,
  useEditorConfirmDesktopEditor,
} from '../context';
import { useEnterAnimation } from '../hooks/useEnterAnimation';

const useStyles = createStyles(({ token, css }) => ({
  toolbar: css`
    position: absolute;
    bottom: 0;
    left: 0px;
    right: 0px;
    margin: auto;
    overflow: hidden;
    border: 1px solid var(--editor-panel-border, transparent);
    box-shadow: ${token.boxShadowSecondary};
    background: ${token.colorBgElevated}f2;
    user-select: none;
    padding: 8px 12px;
    min-height: 56px;
  `,
  barEnter: css`
    animation: toolbar-slide-up 260ms ease-out;
    @keyframes toolbar-slide-up {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
}));

const DesktopEditTool: React.FC = () => {
  const { styles } = useStyles();
  const open = useEditorDesktopEditOpen();
  const closeDesktopEditor = useEditorCloseDesktopEditor();
  const confirmDesktopEditor = useEditorConfirmDesktopEditor();
  const playEnterAnimation = useEnterAnimation(open, { durationMs: 260 });

  if (!open) return null;
  return (
    <div
      className={`${styles.toolbar} ${playEnterAnimation ? styles.barEnter : ''}`}
    >
      <Flex
        gap="medium"
        align="center"
        justify="end"
        style={{ width: '100%', height: '100%', flexWrap: 'wrap' }}
      >
        <Button
          onClick={() => {
            closeDesktopEditor();
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            confirmDesktopEditor();
          }}
          type="primary"
        >
          Confirm
        </Button>
      </Flex>
    </div>
  );
};

export default DesktopEditTool;
