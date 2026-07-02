import React, { useEffect, useRef, useState } from 'react';
import { createStyles } from 'antd-style';
import {
  useEditorCore,
  useEditorCoreLoading,
  useEditorToolbarVisible,
  useEditorSaveAllNow,
  useEditorProjectNameSetter,
  useEditorProjectName,
  useEditorProjectId,
} from '../context';
import { patchProjectName } from '../service';
import { useEnterAnimation } from '../hooks/useEnterAnimation';
import { Dropdown, type MenuProps, Button, Tooltip, Input } from 'antd';
import type { InputRef } from 'antd';
import { DownOutlined, UnorderedListOutlined, SaveOutlined, UndoOutlined, RedoOutlined } from '@ant-design/icons';


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
    gap: 6px;
    padding: 6px;
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
    key: 'back2files',
    label: 'Back to files',
  },
  {
    type: 'divider',
  },
  {
    key: 'file-group',
    label: 'File',
    children: [
      { key: 'file-new', label: 'New' },
      { key: 'file-open', label: 'Open...' },
      { key: 'file-save', label: 'Save' },
      { key: 'file-save-as', label: 'Save As...' },
      { type: 'divider' },
      { key: 'file-export', label: 'Export...' },
      { key: 'file-close', label: 'Close' },
    ],
  },
  {
    key: 'edit',
    label: 'Edit',
    children: [
      { key: 'edit-undo', label: 'Undo  Cmd/Ctrl+Z' },
      { key: 'edit-redo', label: 'Redo  Cmd/Ctrl+Shift+Z' },
      { type: 'divider' },
      { key: 'edit-cut', label: 'Cut  Cmd/Ctrl+X' },
      { key: 'edit-copy', label: 'Copy  Cmd/Ctrl+C' },
      { key: 'edit-paste', label: 'Paste  Cmd/Ctrl+V' },
      { key: 'edit-delete', label: 'Delete  Delete' },
      { type: 'divider' },
      { key: 'edit-select-all', label: 'Select All  Cmd/Ctrl+A' },
    ],
  },
  {
    key: 'view',
    label: 'View',
    children: [
      { key: 'view-zoom-in', label: 'Zoom In' },
      { key: 'view-zoom-out', label: 'Zoom Out' },
      { key: 'view-fit', label: 'Fit to Canvas' },
      { type: 'divider' },
      { key: 'view-toggle-left-panel', label: 'Toggle Left Panel' },
      { key: 'view-toggle-right-panel', label: 'Toggle Right Panel' },
      { key: 'view-toggle-grid', label: 'Toggle Grid' },
    ],
  },
  {
    type: 'divider',
  },
  {
    key: 'help',
    label: 'Help',
    children: [
      { key: 'help-shortcuts', label: 'Keyboard Shortcuts' },
      { key: 'help-docs', label: 'Documentation' },
      { key: 'help-about', label: 'About' },
    ],
  },
];

type EditableFileNameButtonProps = {
  value: string;
  onChange: (nextName: string) => void;
};

const EditableFileNameButton: React.FC<EditableFileNameButtonProps> = ({ value, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
      return;
    }
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing, value]);

  const commit = () => {
    const nextName = draft.trim();
    if (nextName) {
      onChange(nextName);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        size="small"
        style={{ width: 160 }}
        onChange={(e) => setDraft(e.target.value)}
        onPressEnter={commit}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
      />
    );
  }

  return (
    <Tooltip title="Double click to rename">
      <Button type="text" onDoubleClick={() => setEditing(true)}>
        {value}
      </Button>
    </Tooltip>
  );
};

const EditorToolbar: React.FC = () => {
  const { styles } = useStyles();
  const core = useEditorCore();
  const projectName = useEditorProjectName();
  const setProjectName = useEditorProjectNameSetter();
  const projectId = useEditorProjectId();
  const saveAllNow = useEditorSaveAllNow();
  const visible = useEditorToolbarVisible();
  const coreLoading = useEditorCoreLoading();
  const playEnterAnimation = useEnterAnimation(coreLoading, { durationMs: 260 });
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const [dropdownOpen, setDropdownOpen] = useState(false);

  
  useEffect(() => {
    if (!core) {
      setHistoryState({ canUndo: false, canRedo: false });
      return;
    }
    return core.onHistoryChange((state) => {
      setHistoryState(state);
    });
  }, [core]);

  let timer:any = null;
  const onSave = async () => {
    if (!core) return;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      saveAllNow();
      clearTimeout(timer);
      timer = null;
    }, 200)
  }

  if (!visible) return null;

  return (
    <div className={`${styles.toolbar} ${playEnterAnimation ? styles.barEnter : ''}`}>
          <Dropdown
              styles={{
                root: { width: '200px' },
                item: { width: '200px' }
              }}
              onOpenChange={setDropdownOpen}
              trigger={['click']}
              menu={{ items }}
          >
              <Tooltip placement="rightTop" title="Menu">
                <Button
                    variant={dropdownOpen ? "filled" : "text"}
                    color='default'
                >
                  <UnorderedListOutlined />
                  <DownOutlined style={{fontSize: 8}} />
                </Button>
              </Tooltip>
          </Dropdown>
          <Tooltip title="Save">
              <Button type='text' onClick={onSave} icon={<SaveOutlined />} />
          </Tooltip>
          <Tooltip title="Undo">
              <Button
                type='text'
                icon={<UndoOutlined />}
                disabled={!historyState.canUndo}
                onClick={() => core?.undo()}
              />
          </Tooltip>
          <Tooltip title="Redo">
              <Button
                type='text'
                icon={<RedoOutlined />}
                disabled={!historyState.canRedo}
                onClick={() => core?.redo()}
              />
          </Tooltip>
          <EditableFileNameButton value={projectName} onChange={(name: string) => {
            if (projectId) {
              patchProjectName(projectId, { name: name }).then(() => {
                setProjectName(name);
              })
            }
          }} />
    </div>
  );
};

export default EditorToolbar;
