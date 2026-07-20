import type { Node as FlowNode } from '@xyflow/react';

export type ExportProgressLevel = 'info' | 'success' | 'warning' | 'error';
export type ExportProgressLine = {
  level: ExportProgressLevel;
  text: string;
};

export type ExportBundleOptions = {
  onProgressLine?: (line: ExportProgressLine) => void;
  onWarning?: (text: string) => void;
  onSuccess?: (text: string) => void;
  onError?: (text: string) => void;
};

export type ExportBundleApi = {
  exporting: boolean;
  exportBundle: (options?: ExportBundleOptions) => Promise<void>;
};

const getNodeData = (node?: FlowNode | null) =>
  ((node?.data as Record<string, any> | undefined) ?? {}) as Record<string, any>;

/** 从任意节点向上找到根 group */
export const findRootGroupNode = (
  nodes: FlowNode[],
  nodeId?: string,
): FlowNode | null => {
  if (!nodeId) return null;
  const byId = new Map(nodes.map((node) => [String(node.id), node]));
  let current = byId.get(String(nodeId));
  if (!current) return null;

  while (current.parentId) {
    const parent = byId.get(String(current.parentId));
    if (!parent) break;
    current = parent;
  }

  if (current.type === 'group') return current;
  return null;
};

/**
 * 解析导出品类：读根节点 data.category。
 * 未声明时默认 widget（兼容旧数据）。
 */
export const resolveExportCategory = (
  nodes: FlowNode[],
  nodeId?: string,
): string => {
  const root = findRootGroupNode(nodes, nodeId);
  const category = getNodeData(root).category;
  if (typeof category === 'string' && category.trim()) {
    return category.trim();
  }
  return 'widget';
};
