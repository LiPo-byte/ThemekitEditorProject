import { CloseOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Row, Typography } from 'antd';
import { createStyles } from 'antd-style';
import type { Node as FlowNode } from '@xyflow/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  // useEditorCore,
  useEditorChangeNodeProp,
  useEditorRightPanlOpen,
  useEditorRightPanlOpenSetter,
  useEditorProjectId,
  useEditorSelectedBranchNodes,
  // useEditorSelectedBranchNodeIdsKey,
} from '../../context';
import { deleteProjectImage, uploadProjectImage } from '../../service';
import { useEnterAnimation } from '../../hooks/useEnterAnimation';
import { CanvasSettingsForm, SelectedNodePropForm } from './PropForm';
const MIXED_VALUE = '__MIXED__';

const useStyles = createStyles(({ token, css }) => ({
  shell: css`
    width: 280px;
    position: absolute;
    top: 80px;
    right: 12px;
    bottom: 62px;
    z-index: 20;
    border-radius: 12px;
    overflow: auto;
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
  // const [selectNodes, setSelectNodes] = useState<any[]>([]);
  // const [selectNodesTitle, setSelectNodesTitle] = useState<any[]>([]);
  const [editProps, setEditProps] = useState<Record<string, any>>({});
  // const selectNodesRef = useRef<any[]>([]);
  const projectId = useEditorProjectId();
  const open = useEditorRightPanlOpen();
  const setOpen = useEditorRightPanlOpenSetter();
  const changeNodeProp = useEditorChangeNodeProp();
  const selectedBranchNodes = useEditorSelectedBranchNodes();
  const playEnterAnimation = useEnterAnimation(open, { durationMs: 280 });

  const handleEditProps = (nodeList: any[]) => {
    const editPropsMap:any = new Map();
    nodeList.forEach((item: any) => {
      const node = item as FlowNode;
      const data = (item?.data ?? item) as Record<string, any> | undefined;
      if (!data) return;
      Object.keys(data).forEach((key: string) => {
        const value = data[key];
        const prevValue = editPropsMap.get(key);
        if (key === 'source') {
          const sourceList = prevValue ?? [];
          sourceList.push({
            name: data.name ?? node?.id ?? '',
            id: node?.id ?? data.id ?? '',
            value: value ?? '',
          });
          editPropsMap.set(key, sourceList);
          return;
        }
        if (typeof value === 'object') {
          editPropsMap.set(key, [...(prevValue ?? []), value]);
          return;
        }
        if (editPropsMap.has(key) && prevValue !== value) {
          editPropsMap.set(key, MIXED_VALUE);
          return;
        }
        editPropsMap.set(key, value);
      });
    });
    const obj:any = {};
    editPropsMap.forEach((value: any, key: any) => {
      if (key === 'source') {
        obj[key] = value;
        return;
      }
      obj[key] = Array.isArray(value) ? handleEditProps(value) : value;
    });
    return obj;
  }

  useEffect(() => {
    setEditProps(handleEditProps(selectedBranchNodes));
  }, [selectedBranchNodes])


  const handleSourceChange = async (payload: any) => {
    if (!projectId) return;
    const { id, value, deletePath } = payload;
    let v = value;
    if (id && value) {
      const { url } = await uploadProjectImage(projectId, value);
      v = url;
    }
    if (deletePath && !value) {
      // await deleteProjectImage(projectId, new URL(deletePath).pathname.replace(/^\/+/, ''));
    }
    const selectedNodeIds = new Set(selectedBranchNodes.map((node) => node.id));
    changeNodeProp((prevNodes) =>
      prevNodes.map((node) => {
        if (!selectedNodeIds.has(node.id) || node.id !== id) return node;
        const nextData = {...node.data, source: v };
        return { ...node, data: nextData };
      }),
    );
  }
  const handleSelectedNodePropChange = (key: string, val: any, keyClass?: string) => {
    if (!projectId) return;
    let v = val;
    // 资源需要单独处理
    if (key === 'source') {
      handleSourceChange(v);
      return;
    }
    const changesNode: Record<string, any> = {};
    if (keyClass) {
      changesNode[keyClass] = { [key]: v };
    } else {
      changesNode[key] = v;
    }

    const selectedNodeIds = new Set(selectedBranchNodes.map((node) => node.id));
    const mergeChanges = (targetData: Record<string, any>) => {
      const nextData: Record<string, any> = { ...targetData };
      Object.keys(changesNode).forEach((changeKey) => {
        const changeValue = changesNode[changeKey];
        if (
          changeValue &&
          typeof changeValue === 'object' &&
          !Array.isArray(changeValue)
        ) {
          const prevValue = nextData[changeKey];
          if (!prevValue || typeof prevValue !== 'object' || Array.isArray(prevValue)) {
            return;
          }
          const nextNested = { ...prevValue };
          Object.keys(changeValue).forEach((nestedKey) => {
            if (Object.hasOwn(nextNested, nestedKey)) {
              nextNested[nestedKey] = changeValue[nestedKey];
            }
          });
          nextData[changeKey] = nextNested;
          return;
        }
        if (!Object.hasOwn(nextData, changeKey)) return;
        nextData[changeKey] = changeValue;
      });
      return nextData;
    };

    changeNodeProp((prevNodes) =>
      prevNodes.map((node) => {
        if (!selectedNodeIds.has(node.id)) return node;
        const nextData = mergeChanges((node.data as Record<string, any>) ?? {});
        return { ...node, data: nextData };
      }),
    );
  };

  return (
    <div
      className={`${styles.shell} ${!open ? styles.shellClosed : ''} ${playEnterAnimation && open ? styles.shellEnter : ''}`}
    >
      <div className={styles.wrap}>
        <Row>
          <Col span={20}>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Props
            </Typography.Title>
          </Col>
          <Col span={4}>
            <Button
              type="text"
              onClick={() => {
                setOpen(false);
              }}
              icon={<CloseOutlined />}
            />
          </Col>
        </Row>
        {selectedBranchNodes.length ? (
          <SelectedNodePropForm
            editProps={editProps}
            onChange={handleSelectedNodePropChange}
          />
        ) : (
          <CanvasSettingsForm />
        )}
      </div>
    </div>
  );
};

export default RightPanel;
