import React, { useState } from 'react';
import { createStyles } from 'antd-style';
import { useEditorCoreLoading, useEditorToolbarVisible } from '../context';
import { useEnterAnimation } from '../hooks/useEnterAnimation';
import { Dropdown, MenuProps, Button, Tooltip } from 'antd';
import { DownOutlined, UnorderedListOutlined, LayoutOutlined } from '@ant-design/icons';


const useStyles = createStyles(({ token, css }) => ({
  toolbar: css`
    position: absolute;
    // width: 500px;
    height: 50px;
    top: 12px;
    left: 12px;
    z-index: 20;
    overflow: hidden;
    border-radius: 12px;
    box-shadow: ${token.boxShadowSecondary};
    background: ${token.colorBgElevated}f2;
    display: flex;
    align-items: center;
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

const items: MenuProps['items'] = [
  {
    key: '1',
    type: 'group',
    label: 'Group title',
    children: [
      {
        key: '1-1',
        label: '1st menu item',
      },
      {
        key: '1-2',
        label: '2nd menu item',
      },
    ],
  },
  {
    key: '2',
    label: 'sub menu',
    children: [
      {
        key: '2-1',
        label: '3rd menu item',
      },
      {
        key: '2-2',
        label: '4th menu item',
      },
    ],
  },
  {
    key: '3',
    label: 'disabled sub menu',
    disabled: true,
    children: [
      {
        key: '3-1',
        label: '5d menu item',
      },
      {
        key: '3-2',
        label: '6th menu item',
      },
    ],
  },
];

const EditorToolbar: React.FC = () => {
  const { styles } = useStyles();
  const visible = useEditorToolbarVisible();
  const coreLoading = useEditorCoreLoading();
  const playEnterAnimation = useEnterAnimation(coreLoading, { durationMs: 260 });

  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!visible) return null;

  return (
    <div className={`${styles.toolbar} ${playEnterAnimation ? styles.barEnter : ''}`}>
          <Dropdown onOpenChange={setDropdownOpen} trigger={['click']} menu={{ items }}>
              <Tooltip placement="rightTop" title="菜单">
                <Button
                    variant={dropdownOpen ? "filled" : "text"}
                    color='default'
                >
                  <UnorderedListOutlined />
                  <DownOutlined style={{fontSize: 8}} />
                </Button>
              </Tooltip>
          </Dropdown>
          <Tooltip placement="rightTop" title="展开布局">
            <Button type="text">
              Base React Antd
            <LayoutOutlined />
            </Button>
          </Tooltip>
    </div>
  );
};

export default EditorToolbar;
