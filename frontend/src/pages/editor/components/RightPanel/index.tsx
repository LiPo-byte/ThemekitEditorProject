import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import {
  useEditorCore,
  useEditorRightPanlOpen,
  useEditorRightPanlOpenSetter,
} from '../../context';
import { useEnterAnimation } from '../../hooks/useEnterAnimation';
import { Col, Row, Button, Typography, Divider } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { CanvasSettingsForm, SelectedNodePropForm } from './PropForm';

const useStyles = createStyles(({ token, css }) => ({
  shell: css`
    width: 280px;
    position: absolute;
    top: 80px;
    right: 12px;
    bottom: 62px;
    z-index: 20;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: ${token.boxShadowSecondary};
    background: ${token.colorBgElevated}f2;
    backdrop-filter: blur(14px);
    transition: transform 260ms ease, opacity 220ms ease;
  `,
  shellClosed: css`
    transform: translateX(24px);
    opacity: 0;
    pointer-events: none;
  `,
  shellEnter: css`
    animation: right-panel-slide-in 360ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
    @keyframes right-panel-slide-in {
      from {
        transform: translateX(16px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `,

  wrap: css`
    padding: 12px 16px;
  `,
  title: css`
    font-size: 12px;
    font-weight: 600;
    color: ${token.colorTextTertiary};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
  `,
  placeholder: css`
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${token.colorTextQuaternary};
    font-size: 12px;
    border: 1px dashed ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
}));

const RightPanel: React.FC = () => {
  const { styles } = useStyles();
  const [selectNodes, setSelectNodes] = useState([]);
  const open = useEditorRightPanlOpen();
  const setOpen = useEditorRightPanlOpenSetter();
  const playEnterAnimation = useEnterAnimation(open, { durationMs: 280 });
  const core = useEditorCore();

  useEffect(() => {
    if (!core) return;
    core.onSelectionChange((sn: any) => {
      setSelectNodes(sn);
      setOpen(true);
    })
  }, [core])
  return (
    <div className={`${styles.shell} ${!open ? styles.shellClosed : ''} ${playEnterAnimation && open ? styles.shellEnter : ''}`}>
      <div className={styles.wrap}>
        <Row>
          <Col span={20} >
            <Typography.Title level={3} style={{ margin: 0 }}>
                Props
            </Typography.Title>
          </Col>
          <Col span={4}>
              <Button type="text" onClick={() => {setOpen(false)}} icon={<CloseOutlined />} />
          </Col>
        </Row>
        <Divider size="small" />
        <Typography.Title level={5} style={{ margin: 0 }}>
            Google Icon
        </Typography.Title>
        <Divider size="small" />
        {selectNodes.length ? <SelectedNodePropForm /> : <CanvasSettingsForm />}
      </div>
    </div>
  );
};

export default RightPanel;
