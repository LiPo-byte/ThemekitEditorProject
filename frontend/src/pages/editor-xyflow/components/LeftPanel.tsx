import { createStyles } from 'antd-style';
import React from 'react';
import { useEditorCore, useEditorCoreLoading, useEditorLeftPanlOpen, useEditorLeftPanlOpenSetter } from '../context';
import { useEnterAnimation } from '../hooks/useEnterAnimation';
import { Button, Col, Menu, Row, Typography, type MenuProps, Flex } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import widgetitems from '../widget_config.json';
import { WidgetDefaultConfig } from '@/editor-core/defaultConfig'

const useStyles = createStyles(({ token, css }) => ({
  shell: css`
    width: 280px;
    position: absolute;
    top: 80px;
    left: 12px;
    z-index: 20;
    height: 90%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 12px;
    box-shadow: ${token.boxShadowSecondary};
    background: ${token.colorBgElevated}f2;
    backdrop-filter: blur(14px);
    transition: transform 260ms ease, opacity 220ms ease;
  `,
  shellClosed: css`
    transform: translateX(-24px);
    opacity: 0;
    pointer-events: none;
  `,
  shellEnter: css`
    animation: left-panel-slide-in 280ms ease-out;
    @keyframes left-panel-slide-in {
      from {
        transform: translateX(-20px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `,
  wrap: css`
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 12px 16px;
  `,
  header: css`
    flex-shrink: 0;
    padding-bottom: 8px;
  `,
  menuScroll: css`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
  `,
}));

const LeftPanel: React.FC<any> = () => {
  const { styles } = useStyles();
  const core = useEditorCore();
  const coreLoading = useEditorCoreLoading();
  const open = useEditorLeftPanlOpen();
  const setOpen = useEditorLeftPanlOpenSetter();
  const playEnterAnimation = useEnterAnimation(coreLoading || open, { durationMs: 280 });
  const handleAddWidget = (param: { key: keyof typeof WidgetDefaultConfig }) => {
    const { key } = param;
    if (!core) {
      console.warn('[LeftPanel] EditorCore 尚未初始化');
      return;
    }
    if (WidgetDefaultConfig[key]) {
      core.addWidget(WidgetDefaultConfig[key]);
    }
  };

  return (
    <div
      className={`${styles.shell} ${!open ? styles.shellClosed : ''} ${playEnterAnimation && open ? styles.shellEnter : ''}`}
    >
      <div className={styles.wrap}>
        <div className={styles.header}>
          <Row>
            <Col span={24} >
              <Flex align='center' justify='space-between'>
                <Typography.Title level={5} style={{ margin: 0 }}>
                    Widget
                </Typography.Title>
                <Button type="text" onClick={() => {setOpen(false)}} icon={<CloseOutlined />} />
              </Flex>
            </Col>
          </Row>
        </div>
        <div className={styles.menuScroll}>
          <Menu
            onClick={(param: any) => {
              handleAddWidget(param)
            }}
            style={{
              border: 'none',
            }}
            mode="inline"
            selectable={false}
            items={widgetitems as MenuProps['items']}
          />
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
