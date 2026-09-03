import { createStyles } from 'antd-style';
import React from 'react';
import {
  useEditorLeftPanlOpen,
  useEditorLeftPanlOpenSetter,
  useEditorLeftPanlContent,
  useEditorAddWidget,
  useEditorAddLockWidget,
  useEditorAddWallpaper,
  type LeftPanlContent,
} from '../context';
import { useEnterAnimation } from '../hooks/useEnterAnimation';
import { Button, Col, Menu, Row, Typography, type MenuProps, Flex } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import widgetitems from '../widget_config.json';
import lockwidgetItems from '../lock_widget_config.json';
import wallpaperitems from '../wallpaper_config.json';

import { WidgetDefaultConfig, LockWidgetDefaultConfig, WallpaperDefaultConfig } from '@/editor-core/defaultConfig'

const LEFT_PANL_TITLE_MAP: Record<LeftPanlContent, string> = {
  widget: 'Widget',
  lockScreen: 'Lock Widget',
  theme: 'Theme',
  wallpaper: 'Wallpaper',
};
const LEFT_PANL_MENU_MAP: Record<LeftPanlContent, any> = {
  widget: widgetitems,
  lockScreen: lockwidgetItems,
  theme: [],
  wallpaper: wallpaperitems,
}

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
    border: 1px solid var(--editor-panel-border, transparent);
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
  const addWidget = useEditorAddWidget();
  const addLockWidget = useEditorAddLockWidget();
  const addWallpaper = useEditorAddWallpaper();
  const open = useEditorLeftPanlOpen();
  const setOpen = useEditorLeftPanlOpenSetter();
  const leftPanlContent = useEditorLeftPanlContent();
  const playEnterAnimation = useEnterAnimation(true || open, { durationMs: 280 });
  const handleAddWidget = (param: { key: keyof typeof WidgetDefaultConfig }) => {
    const { key } = param;
    if (WidgetDefaultConfig[key]) {
      addWidget(structuredClone(WidgetDefaultConfig[key]));
    }
  };
  const handleAddLockWidget = (param: { key: keyof typeof LockWidgetDefaultConfig }) => {
    const { key } = param;
    if (LockWidgetDefaultConfig[key]) {
      addLockWidget(structuredClone(LockWidgetDefaultConfig[key]));
    }
  };
  const handleAddWallpaper = (param: { key: keyof typeof WallpaperDefaultConfig }) => {
    const { key } = param;
    if (WallpaperDefaultConfig[key]) {
      addWallpaper(structuredClone(WallpaperDefaultConfig[key]));
    }
  };
  const LEFT_PANL_ADD_HANDLER_MAP: Partial<Record<LeftPanlContent, (param: any) => void>> = {
    widget: handleAddWidget,
    wallpaper: handleAddWallpaper,
    lockScreen: handleAddLockWidget,
  };
  const handleMenuClick = (param: any) => {
    LEFT_PANL_ADD_HANDLER_MAP[leftPanlContent]?.(param);
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
                    {LEFT_PANL_TITLE_MAP[leftPanlContent]}
                </Typography.Title>
                <Button type="text" onClick={() => {setOpen(false)}} icon={<CloseOutlined />} />
              </Flex>
            </Col>
          </Row>
        </div>
        <div className={styles.menuScroll}>
          <Menu
            onClick={handleMenuClick}
            style={{
              border: 'none',
            }}
            mode="inline"
            selectable={false}
            items={LEFT_PANL_MENU_MAP[leftPanlContent]}
          />
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
