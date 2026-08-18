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

const MIME_EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

/**
 * 透传导出时按实际内容定扩展名。
 * 优先 MIME；服务端返回 octet-stream 时回退 URL 后缀（上传后存为 assets/{uuid}.{ext}）。
 */
export const resolveSourceExt = (
  source: string,
  blob: Blob,
  fallback = 'jpg',
): string => {
  const mimeExt = MIME_EXT_MAP[String(blob.type || '').trim().toLowerCase()];
  if (mimeExt) return mimeExt;
  const path = String(source || '').split('?')[0].split('#')[0];
  const ext = (path.split('.').pop() || '').toLowerCase();
  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : fallback;
};

/** 读上传资源原始 blob：预览图直接透传，不经 DOM 截图 */
export const fetchSourceBlob = async (source: string): Promise<Blob | null> => {
  const url = String(source || '').trim();
  if (!url) return null;
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    return await response.blob();
  } catch {
    return null;
  }
};

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
