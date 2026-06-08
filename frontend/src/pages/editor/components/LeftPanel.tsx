import { createStyles } from 'antd-style';
import React from 'react';
import { useEditorCore, useEditorCoreLoading, useEditorLeftPanlOpen, useEditorLeftPanlOpenSetter } from '../context';
import { useEnterAnimation } from '../hooks/useEnterAnimation';
import { Button, Col, Menu, Row, Typography, type MenuProps, Flex } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import widgetitems from '../widget_config.json';

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

const mockdata ={
  ios: {
    "version":0,
    "isLockScreen":false,
    "type":1,
    "textAlignment":1,
    "sizes":[
          {
              "size":1,
          "name":"Pink_Love_Heart_Small",
              "padding":16,
              "time":{
                  "font":"HFBestWishes",
                  "textSize":28,
                  "textHeight":24,
                  "textColor":"#FBA3C9",
                  "alpha":1.0
              },
              "day" :{
                  "font":"AvenirNext-Bold",
                  "textSize":20,
                  "textHeight":18,
                  "textColor":"#FBA3C9",
                  "alpha":1.0,
                    "topSpacing":10,
                  "bottomSpacing":10
              },
              "date":{
                  "font":"AvenirNext-Bold",
                  "textSize":16,
                  "textHeight":15,
                  "textColor":"#FBA3C9",
                  "alpha":1.0
              }
          },
          {
              "size":2,
          "name":"Pink_Love_Heart_Medium",
              "padding":16,
              "time":{
                  "font":"AvenirNext-Bold",
                  "textSize":32,
                  "textHeight":29,
                  "textColor":"#FBA3C9",
                  "alpha":1.0
              },
              "day" :{
                  "font":"AvenirNext-Bold",
                  "textSize":28,
                  "textHeight":25,
                  "textColor":"#FBA3C9",
                  "alpha":1.0,
                    "topSpacing":14,
                  "bottomSpacing":10
              },
              "date":{
                  "font":"AvenirNext-Bold",
                  "textSize":18,
                  "textHeight":16,
                  "textColor":"#FBA3C9",
                  "alpha":1.0
              }
          },
          {
              "size":3,
          "name":"Pink_Love_Heart_Large",
              "padding":16,
              "time":{
                  "font":"AvenirNext-Bold",
                  "textSize":54,
                  "textHeight":47,
                  "textColor":"#FBA3C9",
                  "alpha":1.0
              },
              "day" :{
                  "font":"AvenirNext-Bold",
                  "textSize":38,
                  "textHeight":33,
                  "textColor":"#FBA3C9",
                  "alpha":1.0,
                    "topSpacing":20,
                  "bottomSpacing":20
              },
              "date":{
                  "font":"AvenirNext-Bold",
                  "textSize":30,
                  "textHeight":26,
                  "textColor":"#FBA3C9",
                  "alpha":1.0
              }
          }
    ]
  },
  android: {
    "version":0,
    "isLockScreen":false,
    "type":1,
    "textAlignment":1,
    "sizes":[
          {
              "size":1,
          "name":"Pink_Love_Heart_Small",
              "padding":16,
              "time":{
                  "font":"HFBestWishes",
                  "textSize":28,
                  "textHeight":24,
                  "textColor":"#FBA3C9",
                  "alpha":1.0
              },
              "day" :{
                  "font":"AvenirNext-Bold",
                  "textSize":20,
                  "textHeight":18,
                  "textColor":"#FBA3C9",
                  "alpha":1.0,
                    "topSpacing":10,
                  "bottomSpacing":10
              },
              "date":{
                  "font":"AvenirNext-Bold",
                  "textSize":16,
                  "textHeight":15,
                  "textColor":"#FBA3C9",
                  "alpha":1.0
              }
          },
          {
              "size":2,
          "name":"Pink_Love_Heart_Medium",
              "padding":16,
              "time":{
                  "font":"AvenirNext-Bold",
                  "textSize":32,
                  "textHeight":29,
                  "textColor":"#FBA3C9",
                  "alpha":1.0
              },
              "day" :{
                  "font":"AvenirNext-Bold",
                  "textSize":28,
                  "textHeight":25,
                  "textColor":"#FBA3C9",
                  "alpha":1.0,
                    "topSpacing":14,
                  "bottomSpacing":10
              },
              "date":{
                  "font":"AvenirNext-Bold",
                  "textSize":18,
                  "textHeight":16,
                  "textColor":"#FBA3C9",
                  "alpha":1.0
              }
          },
          {
              "size":3,
          "name":"Pink_Love_Heart_Large",
              "padding":16,
              "time":{
                  "font":"AvenirNext-Bold",
                  "textSize":54,
                  "textHeight":47,
                  "textColor":"#FBA3C9",
                  "alpha":1.0
              },
              "day" :{
                  "font":"AvenirNext-Bold",
                  "textSize":38,
                  "textHeight":33,
                  "textColor":"#FBA3C9",
                  "alpha":1.0,
                    "topSpacing":20,
                  "bottomSpacing":20
              },
              "date":{
                  "font":"AvenirNext-Bold",
                  "textSize":30,
                  "textHeight":26,
                  "textColor":"#FBA3C9",
                  "alpha":1.0
              }
          }
    ]
  }
}

const LeftPanel: React.FC<any> = () => {
  const { styles } = useStyles();
  const core = useEditorCore();
  const coreLoading = useEditorCoreLoading();
  const open = useEditorLeftPanlOpen();
  const setOpen = useEditorLeftPanlOpenSetter();
  const playEnterAnimation = useEnterAnimation(coreLoading || open, { durationMs: 280 });
  const handleAddWidget = () => {
    if (!core) {
      console.warn('[LeftPanel] EditorCore 尚未初始化');
      return;
    }
    core.addWidget(mockdata);
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
            onClick={handleAddWidget}
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
