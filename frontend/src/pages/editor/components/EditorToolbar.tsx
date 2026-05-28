import {
  RedoOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Segmented, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';

const useStyles = createStyles(({ token, css }) => ({
  bar: css`
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    height: 56px;
    padding: 0 12px;
    background: ${token.colorBgContainer};
    border-bottom: 1px solid ${token.colorBorderSecondary};
    user-select: none;
  `,
  left: css`
    display: flex;
    align-items: center;
    gap: 4px;
  `,
  center: css`
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  right: css``,
  item: css`
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 16px;
    color: ${token.colorTextSecondary};
    cursor: pointer;
    transition: all 0.15s;
    &:hover {
      background: ${token.colorBgTextHover};
      color: ${token.colorText};
    }
  `,
}));

const EditorToolbar: React.FC = () => {
  const { styles } = useStyles();
  const [mode, setMode] = useState<string | number>('主题');
  const [fontFamily, setFontFamily] = useState('AvenirNext-Bold');

  const handleClick = (key: string) => {
    console.log('[toolbar]', key);
  };

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <Tooltip title="保存 (⌘S)">
          <div className={styles.item} onClick={() => handleClick('save')}>
            <SaveOutlined />
          </div>
        </Tooltip>
        <Tooltip title="撤销 (⌘Z)">
          <div className={styles.item} onClick={() => handleClick('undo')}>
            <UndoOutlined />
          </div>
        </Tooltip>
        <Tooltip title="重做 (⌘⇧Z)">
          <div className={styles.item} onClick={() => handleClick('redo')}>
            <RedoOutlined />
          </div>
        </Tooltip>
      </div>

      <div className={styles.center}>
      </div>

      <div className={styles.right} />
    </div>
  );
};

export default EditorToolbar;
