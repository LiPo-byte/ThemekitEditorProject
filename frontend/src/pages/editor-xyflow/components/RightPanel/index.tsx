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
    border: 1px solid var(--editor-panel-border, transparent);
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

  const getValueByPath = (target: Record<string, any>, path: string) => {
    const parts = path.split('.');
    let cursor: any = target;
    for (let i = 0; i < parts.length; i += 1) {
      if (!cursor || typeof cursor !== 'object') return undefined;
      cursor = cursor[parts[i]];
    }
    return cursor;
  };

  const setValueByPath = (target: Record<string, any>, path: string, value: any) => {
    const parts = path.split('.');
    let cursor: any = target;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const key = parts[i];
      if (!cursor[key] || typeof cursor[key] !== 'object') {
        cursor[key] = {};
      }
      cursor = cursor[key];
    }
    cursor[parts[parts.length - 1]] = value;
  };

  const walkNodeData = (
    value: any,
    ctx: { nodeId: string; nodeName: string; pathPrefix: string },
    output: Record<string, any>,
  ) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    Object.keys(value).forEach((key) => {
      const nextPath = ctx.pathPrefix ? `${ctx.pathPrefix}.${key}` : key;
      const current = value[key];
      if (key === 'source') {
        const prevList = (getValueByPath(output, nextPath) ?? []) as any[];
        prevList.push({
          name: ctx.pathPrefix || ctx.nodeName,
          id: ctx.nodeId,
          path: nextPath,
          value: current ?? '',
        });
        setValueByPath(output, nextPath, prevList);
        return;
      }
      if (key === 'themekitSizewithTypes') {
        const prevList = (getValueByPath(output, nextPath) ?? []) as string[];
        const values = Array.isArray(current) ? current : [current];
        values.forEach((item) => {
          if (item == null || item === '' || prevList.includes(item)) return;
          prevList.push(item);
        });
        setValueByPath(output, nextPath, prevList);
        return;
      }
      if (current && typeof current === 'object' && !Array.isArray(current)) {
        walkNodeData(current, { ...ctx, pathPrefix: nextPath }, output);
        return;
      }
      const prevValue = getValueByPath(output, nextPath);
      if (typeof prevValue === 'undefined') {
        setValueByPath(output, nextPath, current);
        return;
      }
      if (prevValue !== current) {
        setValueByPath(output, nextPath, MIXED_VALUE);
      }
    });
  };

  const handleEditProps = (nodeList: any[]) => {
    const output: Record<string, any> = {};
    nodeList.forEach((item: any) => {
      const node = item as FlowNode;
      const data = (item?.data ?? item) as Record<string, any> | undefined;
      if (!data) return;
      const nodeId = node?.id ?? data.id ?? '';
      const nodeName = data.name ?? nodeId;
      walkNodeData(data, { nodeId, nodeName, pathPrefix: '' }, output);
    });
    return output;
  };

  useEffect(() => {
    setEditProps(handleEditProps(selectedBranchNodes));
  }, [selectedBranchNodes])


  const handleSourceChange = async (payload: any) => {
    if (!projectId) return;
    const { id, value, deletePath, path } = payload;
    let v = value;
    if (id && value) {
      const { url } = await uploadProjectImage(projectId, value);
      v = url;
    }
    if (deletePath && !value) {
      // await deleteProjectImage(projectId, new URL(deletePath).pathname.replace(/^\/+/, ''));
    }
    const selectedNodeIds = new Set(selectedBranchNodes.map((node) => node.id));
    const setNestedValue = (targetData: Record<string, any>, nestedPath: string, nextValue: any) => {
      const nextData = { ...targetData };
      const pathParts = nestedPath.split('.');
      if (!pathParts.length) return nextData;
      if (pathParts.length === 1) {
        if (!Object.hasOwn(nextData, nestedPath)) return nextData;
        nextData[nestedPath] = nextValue;
        return nextData;
      }
      let cursor: any = nextData;
      for (let i = 0; i < pathParts.length - 1; i += 1) {
        const key = pathParts[i];
        const currentValue = cursor[key];
        if (!currentValue || typeof currentValue !== 'object' || Array.isArray(currentValue)) {
          return nextData;
        }
        cursor[key] = { ...currentValue };
        cursor = cursor[key];
      }
      const leafKey = pathParts[pathParts.length - 1];
      if (!Object.hasOwn(cursor, leafKey)) return nextData;
      cursor[leafKey] = nextValue;
      return nextData;
    };
    changeNodeProp((prevNodes) =>
      prevNodes.map((node) => {
        if (!selectedNodeIds.has(node.id) || node.id !== id) return node;
        const sourcePath = typeof path === 'string' && path ? path : 'source';
        const nextData = setNestedValue((node.data as Record<string, any>) ?? {}, sourcePath, v);
        return { ...node, data: nextData };
      }),
    );
  }
  const handleSelectedNodePropChange = async (key: string, val: any, keyClass?: string) => {
    if (!projectId) return;
    let v = val;
    // 资源需要单独处理
    if (key === 'source') {
      handleSourceChange(v);
      return;
    }
    // appLinksSource 需要单独处理
    if (key === "appLinksSource" && Array.isArray(val)) {
      for (let index = 0; index < v.length; index++) {
        const linkSource = v[index];
        if (!linkSource || typeof linkSource !== 'object') {
          continue;
        }
        if (linkSource.source === null)  {
          linkSource.source = '';
        }
        if (typeof linkSource.source !== 'string') {
          const { url } = await uploadProjectImage(projectId, linkSource.source);
          linkSource.source = url;
        }
      }
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
