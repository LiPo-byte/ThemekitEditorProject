import React, { useEffect, useRef, useState } from 'react';
import { Position, NodeToolbar } from '@xyflow/react';
import {
  useEditorDeleteSelectedNodes,
  useEditorOpenCropEditor,
  useEditorOpenDesktopEditor,
} from '../context';
import { App, Button, Modal, Typography } from 'antd';
import { ExportOutlined, DeleteTwoTone, TableOutlined } from '@ant-design/icons';
import { CropSvg, DragSvg } from '@/icons';
import { useExportBundle } from '../hooks/useExportBundle';
import type { ExportProgressLine } from '../hooks/exportBundleShared';

/**
 * 选中节点上方的浮动操作栏（Action Popover）。
 */
const ActionPopover: React.FC = (props: any) => {
  const {
    data: { isVisible, actionList, nodeId },
  } = props;
  const { message } = App.useApp();
  const openCropEditor = useEditorOpenCropEditor();
  const openDesktopEditor = useEditorOpenDesktopEditor();
  const deleteSelectedNodes = useEditorDeleteSelectedNodes();
  const { exporting, exportBundle } = useExportBundle(nodeId);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportLogs, setExportLogs] = useState<ExportProgressLine[]>([]);
  const [runningDots, setRunningDots] = useState('');
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [exportLogs]);
  useEffect(() => {
    if (!exporting) {
      setRunningDots('');
      return;
    }
    let index = 0;
    const dots = ['', '.', '..', '...'];
    const timer = window.setInterval(() => {
      index = (index + 1) % dots.length;
      setRunningDots(dots[index]);
    }, 400);
    return () => window.clearInterval(timer);
  }, [exporting]);

  const onCrop = () => {
    openCropEditor(nodeId);
  };
  const onDesktopEdit = () => {
    openDesktopEditor(nodeId);
  };
  const onDelete = () => {
    deleteSelectedNodes();
  };
  const onExport = async () => {
    if (exporting) return;
    setExportModalOpen(true);
    setExportLogs([{ level: 'info', text: '准备导出资源...' }]);

    await exportBundle({
      onProgressLine: (line) => {
        setExportLogs((prev) => [...prev, line]);
      },
      onSuccess: (text) => message.success(text),
    });
  };

  return (
    <>
      <NodeToolbar
        nodeId={nodeId}
        isVisible={isVisible}
        position={Position.Top}
        align="end"
      >
        {actionList.includes('cropable') && (
          <Button onClick={onCrop} icon={<CropSvg />} shape="circle" />
        )}
        {actionList.includes('packable') && !exporting && (
          <Button
            onClick={onExport}
            icon={<ExportOutlined />}
            shape="circle"
            loading={exporting}
          />
        )}
        {actionList.includes('deleteable') && (
          <Button onClick={onDelete} icon={<DeleteTwoTone />} shape="circle" />
        )}
        {actionList.includes('desktopeditable') && (
          <Button onClick={onDesktopEdit} icon={<DragSvg />} shape="circle" />
        )}
      </NodeToolbar>
      <Modal
        title="正在导出"
        open={exportModalOpen}
        width={680}
        footer={
          exporting
            ? null
            : [
                <Button key="close" onClick={() => setExportModalOpen(false)}>
                  关闭
                </Button>,
              ]
        }
        closable={false}
        mask={{
          enabled: true,
          blur: true,
          closable: false
        }}
      >
        <div
          ref={logContainerRef}
          style={{
            height: 320,
            overflowY: 'auto',
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: 6,
            padding: 12,
          }}
        >
          {exportLogs.map((line, index) => (
            <div key={`${line.level}-${line.text}-${index}`} style={{ marginBottom: 6 }}>
              <Typography.Text
                code
                type={
                  line.level === 'error'
                    ? 'danger'
                    : line.level === 'warning'
                      ? 'warning'
                      : line.level === 'success'
                        ? 'success'
                        : 'secondary'
                }
              >
                {`[${line.level.toUpperCase()}] ${line.text}`}
              </Typography.Text>
            </div>
          ))}
          {exporting && (
            <div style={{ marginTop: 8 }}>
              <Typography.Text type="secondary">{`[INFO] 进行中${runningDots}`}</Typography.Text>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default ActionPopover;
