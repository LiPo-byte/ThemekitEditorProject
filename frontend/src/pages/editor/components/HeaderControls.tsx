import React from 'react';
import { useModel } from '@umijs/max';
import { createStyles } from 'antd-style';
import {
  useEditorCoreLoading,
  useEditorHeaderControlsVisible,
  useEditorPreviewDevicesOpenSetter,
} from '../context';
import { useEnterAnimation } from '../hooks/useEnterAnimation';
import { AvatarDropdown } from '@/components';
import { Button, Tooltip, Avatar, Segmented } from 'antd';
import { PlayCircleOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';


const useStyles = createStyles(({ token, css }) => ({
    headerControls: css`
        position: absolute;
        height: 50px;
        top: 12px;
        right: 12px;
        z-index: 20;
        overflow: hidden;
        border-radius: 12px;
        box-shadow: ${token.boxShadowSecondary};
        background: ${token.colorBgElevated}f2;
        display: flex;
        align-items: center;
        justify-content: center;
        // gap: 6px;
        padding: ${token.padding};
        user-select: none;
    `,
    barEnter: css`
        animation: toolbar-slide-down 260ms ease-out;
        @keyframes toolbar-slide-down {
        from {
            transform: translateY(-14px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
        }
    `,
}));

const HeaderControls: React.FC = () => {
  const { styles } = useStyles();
  const visible = useEditorHeaderControlsVisible();
  const { initialState, setInitialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const coreLoading = useEditorCoreLoading();
  const playEnterAnimation = useEnterAnimation(coreLoading, { durationMs: 260 });
  const setPreviewDevicesOpen = useEditorPreviewDevicesOpenSetter();

  if (!visible) return null;

  return (
    <div className={`${styles.headerControls} ${playEnterAnimation ? styles.barEnter : ''}`}>
        <Tooltip placement="rightTop" title="Preview Devices">
            <Button type="text" onClick={() => {setPreviewDevicesOpen(true)}}>
                <PlayCircleOutlined style={{fontSize: '20px'}} />
            </Button>
        </Tooltip>
        <Segmented
            value={initialState?.settings?.navTheme || 'light'}
            onChange={(v: any) => {
                setInitialState((s) => ({
                    ...s,
                    settings: {
                        ...initialState?.settings,
                        navTheme: v,
                    }
                }));
            }}
            options={[
                { value: 'light', icon: <SunOutlined /> },
                { value: 'dark', icon: <MoonOutlined /> },
            ]}
        />
        <AvatarDropdown>
            <Button type="text">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                { currentUser && <Avatar src={`/avater/${currentUser.avatar}`} size="small" /> }
                <span style={{ marginLeft: 8 }}>李白</span>
              </span>
            </Button>
        </AvatarDropdown>
    </div>
  );
};

export default HeaderControls;
