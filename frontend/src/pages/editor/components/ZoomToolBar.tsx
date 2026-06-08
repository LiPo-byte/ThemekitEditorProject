import React from 'react';
import { Button, Space } from 'antd';
import { createStyles } from 'antd-style';
import { PlusOutlined, MinusOutlined, ExpandOutlined } from '@ant-design/icons';
import { useEditorCore, useEditorZoomToolBarVisible } from '../context';

const useStyles = createStyles(({ token, css }) => ({
  shell: css`
    position: absolute;
    right: 12px;
    bottom: 12px;
    z-index: 20;
    user-select: none;
  `,
  percentText: css`
    min-width: 44px;
    text-align: center;
    color: ${token.colorTextSecondary};
    font-size: 12px;
  `,
}));

const ZoomToolBar: React.FC = () => {
  const { styles } = useStyles();
  const visible = useEditorZoomToolBarVisible();
  const core = useEditorCore();

  if (!visible) return null;

  return (
    <div className={styles.shell}>
        <Space>
            <Button
                onClick={() => {
                    core?.zoomIn();
                }}
                icon={<PlusOutlined />}
                shape="circle"
            />
            <Button
                icon={<MinusOutlined />}
                shape="circle"
                onClick={() => {
                    core?.zoomOut();
                }}
            />
            <Button
                icon={<ExpandOutlined />}
                shape="circle"
                onClick={() => {
                    core?.fitView();
                }}
            />
        </Space>
    </div>
  );
};

export default ZoomToolBar;
