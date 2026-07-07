import { useMemo } from 'react';
import type { Node as FlowNode } from '@xyflow/react';
import { useEditorNodes } from '../context';

const getNodeSelectorById = (nodeId: string) => {
  if (!nodeId) return '';
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return `.xyflow-stage .react-flow__node[data-id="${CSS.escape(nodeId)}"]`;
  }
  return `.xyflow-stage .react-flow__node[data-id="${nodeId}"]`;
};

export const useNodeChildElements = (nodeId?: string) => {
  const nodes = useEditorNodes();

  const childNodes = useMemo<FlowNode[]>(() => {
    if (!nodeId) return [];
    return nodes.filter((node) => node.parentId === nodeId);
  }, [nodeId, nodes]);

  const elements = useMemo(() => {
    if (typeof document === 'undefined') return [] as HTMLElement[];
    if (!childNodes.length) return [] as HTMLElement[];
    return childNodes
      .map((node) => {
        const selector = getNodeSelectorById(String(node.id));
        if (!selector) return null;
        return document.querySelector(selector) as HTMLElement | null;
      })
      .filter((element): element is HTMLElement => Boolean(element));
  }, [childNodes]);

  return {
    childNodes,
    elements,
  };
};
