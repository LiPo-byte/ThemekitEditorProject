// import { PlayCircleOutlined, SaveOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, type MenuProps } from 'antd';
import { createStyles } from 'antd-style';
import Settings from '@root/config/defaultSettings';
import React from 'react';
import { AvatarDropdown } from '@/components';
import { useModel } from '@umijs/max';


const useStyles = createStyles(({ token, css }) => ({
  bar: css`
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    height: 40px;
    padding: 0 16px;
    background: ${token.colorBgContainer};
    border-bottom: 1px solid ${token.colorBorderSecondary};
    user-select: none;
  `,
  left: css`
    display: flex;
    align-items: center;
    gap: 16px;
  `,
  center: css`
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: ${token.colorTextSecondary};
  `,
  right: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  `,
  brand: css`
    font-weight: 600;
    color: ${token.colorText};
  `,
  menuList: css`
    display: flex;
    gap: 4px;
  `,
  menuItem: css`
    padding: 4px 12px;
    cursor: pointer;
    border-radius: 6px;
    font-size: 13px;
    color: ${token.colorTextSecondary};
    transition: all 0.15s;
    &:hover {
      background: ${token.colorBgTextHover};
      color: ${token.colorText};
    }
  `,
  fileName: css`
    padding: 4px 12px;
    border-radius: 6px;
    cursor: pointer;
    &:hover {
      background: ${token.colorBgTextHover};
    }
  `,
}));

const fileMenu: MenuProps['items'] = [
  { key: 'new', label: '新建' },
  { key: 'open', label: '打开...' },
  { type: 'divider' },
  { key: 'save', label: '保存' },
  { key: 'save-as', label: '另存为...' },
  { type: 'divider' },
  { key: 'export', label: '导出' },
];

const editMenu: MenuProps['items'] = [
  { key: 'undo', label: '撤销' },
  { key: 'redo', label: '重做' },
  { type: 'divider' },
  { key: 'copy', label: '复制' },
  { key: 'paste', label: '粘贴' },
  { key: 'delete', label: '删除' },
];

const viewMenu: MenuProps['items'] = [
  { key: 'toggle-left', label: '切换左侧面板' },
  { key: 'toggle-right', label: '切换右侧面板' },
  { type: 'divider' },
  { key: 'zoom-in', label: '放大' },
  { key: 'zoom-out', label: '缩小' },
  { key: 'zoom-reset', label: '重置缩放' },
];

const EditorTopMenu: React.FC = () => {
  const { styles } = useStyles();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const handleClick = (group: string) => (info: { key: string }) => {
    console.log(`[${group}] ${info.key}`);
  };

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src="/logo.webp" style={{ width: 20 }} alt="" />
          <span className={styles.brand}>{Settings.title}</span>
        </div>
        <div className={styles.menuList}>
          <Dropdown
            menu={{ items: fileMenu, onClick: handleClick('file') }}
            trigger={['click']}
          >
            <span className={styles.menuItem}>文件</span>
          </Dropdown>
          <Dropdown
            menu={{ items: editMenu, onClick: handleClick('edit') }}
            trigger={['click']}
          >
            <span className={styles.menuItem}>编辑</span>
          </Dropdown>
          <Dropdown
            menu={{ items: viewMenu, onClick: handleClick('view') }}
            trigger={['click']}
          >
            <span className={styles.menuItem}>视图</span>
          </Dropdown>
        </div>
      </div>

      <div className={styles.center}>
        <span className={styles.fileName}>未命名组件</span>
      </div>
      {currentUser ? (
        <div className={styles.right}>
          <AvatarDropdown>
            <Button type="text">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <Avatar src={`/avater/${currentUser.avatar}`} size="small" />
                <span style={{ marginLeft: 8 }}>李白</span>
              </span>
            </Button>
          </AvatarDropdown>
        </div>
      ) : null}

    </div>
  );
};

export default EditorTopMenu;
