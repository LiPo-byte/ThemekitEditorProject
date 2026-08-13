import React, { useEffect, useRef, useState } from 'react';
import { createStyles } from 'antd-style';
import {
  useEditorToolbarVisible,
  // useEditorSaveAllNow,
  useEditorProjectNameSetter,
  useEditorProjectName,
  useEditorProjectId,
  useEditorCanUndo,
  useEditorCanRedo,
  useEditorUndo,
  useEditorRedo,
  useEditorGenerateProjectPayload,
} from '../context';
import { patchProjectName } from '../service';
import { useEnterAnimation } from '../hooks/useEnterAnimation';
import { useSaveProject } from '../hooks/useSaveProject';
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
  saveStatus: css`
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
    color: ${token.colorTextTertiary};
  `,
  saveStatusError: css`
    color: ${token.colorError};
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

const formatSavedAt = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

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
  // const generateProjectPayload = useEditorGenerateProjectPayload();
  const canUndo = useEditorCanUndo();
  const canRedo = useEditorCanRedo();
  const undo = useEditorUndo();
  const redo = useEditorRedo();

  const projectName = useEditorProjectName();
  const setProjectName = useEditorProjectNameSetter();
  const projectId = useEditorProjectId();
  const visible = useEditorToolbarVisible();
  const playEnterAnimation = useEnterAnimation(true, { durationMs: 260 });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { saving, status, lastSavedAt, willRetry, save: handleSave } = useSaveProject();

  // 自动保存不弹 toast（几秒一次太吵），只在这里给一行轻提示
  const saveStatusText = saving
    ? '保存中...'
    : status === 'error'
      ? willRetry
        ? '保存失败，重试中'
        : '保存失败，请手动保存'
      : status === 'dirty'
        ? '未保存'
        : status === 'saved' && lastSavedAt
          ? `已保存 ${formatSavedAt(lastSavedAt)}`
          : '';

  if (!visible) return null;

  return (
    <div className={`${styles.toolbar} ${playEnterAnimation ? styles.barEnter : ''}`}>
          {/* <Dropdown
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
                    disabled
                >
                  <UnorderedListOutlined />
                  <DownOutlined style={{fontSize: 8}} />
                </Button>
              </Tooltip>
          </Dropdown> */}
          <Tooltip title="Save Cmd/Ctrl+S">
              <Button type='text' loading={saving} onClick={handleSave} icon={<SaveOutlined />} />
          </Tooltip>
          <Tooltip title="Undo Cmd/Ctrl+Z">
              <Button
                type='text'
                icon={<UndoOutlined />}
                disabled={!canUndo}
                onClick={() => {
                  undo()
                }}
              />
          </Tooltip>
          <Tooltip title="Redo Cmd/Ctrl+Shift+Z">
              <Button
                type='text'
                icon={<RedoOutlined />}
                disabled={!canRedo}
                onClick={() => {
                  redo()
                }}
              />
          </Tooltip>
          <EditableFileNameButton value={projectName} onChange={(name: string) => {
            if (projectId) {
              patchProjectName(projectId, { name: name }).then(() => {
                setProjectName(name);
              })
            }
          }} />
          {saveStatusText ? (
            <span
              className={`${styles.saveStatus} ${status === 'error' ? styles.saveStatusError : ''}`}
            >
              {saveStatusText}
            </span>
          ) : null}
    </div>
  );
};

export default EditorToolbar;
