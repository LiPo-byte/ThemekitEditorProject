import { useMemo } from 'react';
import type { Node as FlowNode } from '@xyflow/react';
import {
  useEditorSelectedBranchNodeIdsKey,
  useEditorSelectedBranchNodes,
  useEditorSelectedNodesMap,
} from '../context';

type PackableNode = FlowNode & { packable?: boolean };

const getNodeSelectorById = (nodeId: string) => {
  if (!nodeId) return '';
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return `.xyflow-stage .react-flow__node[data-id="${CSS.escape(nodeId)}"]`;
  }
  return `.xyflow-stage .react-flow__node[data-id="${nodeId}"]`;
};

export const useSelectedPackableElements = (
  options: {
    includeSelectedNodes?: boolean;
  } = {},
) => {
  const { includeSelectedNodes = false } = options;
  const selectedBranchNodes = useEditorSelectedBranchNodes();
  const selectedBranchNodeIdsKey = useEditorSelectedBranchNodeIdsKey();
  const selectedNodesMap = useEditorSelectedNodesMap();

  const packableNodes = useMemo(
    () =>
      selectedBranchNodes.filter((node): node is PackableNode => {
        const isPackable = (node as PackableNode).packable === true;
        if (!isPackable) return false;
        if (includeSelectedNodes) return true;
        return !selectedNodesMap.has(node.id);
      }),
    [includeSelectedNodes, selectedBranchNodes, selectedNodesMap],
  );

  const elements = useMemo(() => {
    if (typeof document === 'undefined') return [] as HTMLElement[];
    if (!packableNodes.length) return [] as HTMLElement[];
    return packableNodes
      .map((node) => {
        const selector = getNodeSelectorById(String(node.id));
        if (!selector) return null;
        return document.querySelector(selector) as HTMLElement | null;
      })
      .filter((element): element is HTMLElement => Boolean(element));
  }, [packableNodes, selectedBranchNodeIdsKey]);

  return {
    packableNodes,
    elements,
  };
};
