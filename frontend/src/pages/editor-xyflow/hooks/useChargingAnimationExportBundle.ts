import type { Node as FlowNode } from '@xyflow/react';
import JSZip from 'jszip';
import { useCallback, useState } from 'react';
import { ChargingAnimationDefaultConfig } from '@/editor-core/defaultConfig';
import { useEditorNodes } from '../context';
import {
  fetchSourceBlob,
  findRootGroupNode,
  type ExportBundleOptions,
  type ExportProgressLevel,
} from './exportBundleShared';

/**
 * 文件名和 spec 字段来自：
 * widget/rule_ymal/resource-validation/resource_charging_animation.yaml
 */
const REQUIRED_FILES = [
  'preview.pag',
  'charging_wallpaper.mp4',
  'charging_animation_spec.json',
] as const;

const PREVIEW_PAG_MAX_BYTES = 1048576;
const FONT_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const FONT_SIZE_PATTERN = /^(0|[1-9]\d*)$/;

const DEFAULT_ORIGIN = ChargingAnimationDefaultConfig.origin;
const DEFAULT_STYLE = ChargingAnimationDefaultConfig.style;
const DEFAULT_CALENDAR = ChargingAnimationDefaultConfig.calendar;

type ChargingExportFile = {
  filename: (typeof REQUIRED_FILES)[number];
  blob: Blob;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
};

const getNodeData = (node?: FlowNode | null) =>
  ((node?.data as Record<string, any> | undefined) ?? {}) as Record<string, any>;

const toNonNegInt = (value: unknown, fallback: number) => {
  const next = Number(value);
  if (!Number.isFinite(next) || next < 0) return fallback;
  return Math.round(next);
};

/** 只输出规则 json_template 里的必填字段，编辑器内部字段不进包 */
export const buildChargingAnimationSpec = (rootData: Record<string, any>) => {
  const origin = rootData.origin ?? {};
  const style = rootData.style ?? {};
  const calendar = rootData.calendar ?? {};
  return {
    origin: {
      x: Number(origin.x ?? DEFAULT_ORIGIN.x),
      y: Number(origin.y ?? DEFAULT_ORIGIN.y),
    },
    style: {
      font: String(style.font ?? DEFAULT_STYLE.font),
      fontColor: String(style.fontColor ?? DEFAULT_STYLE.fontColor),
      fontSize: toNonNegInt(style.fontSize, DEFAULT_STYLE.fontSize),
      showTime: Boolean(style.showTime ?? DEFAULT_STYLE.showTime),
      gifCycle: Boolean(style.gifCycle ?? DEFAULT_STYLE.gifCycle),
    },
    calendar: {
      fontSize: toNonNegInt(calendar.fontSize, DEFAULT_CALENDAR.fontSize),
    },
  };
};

const resolveAsset = (data: Record<string, any>) => {
  const key = String(data.key ?? '');
  if (key === 'preview' && data.pagsource) {
    return { filename: 'preview.pag' as const, source: String(data.pagsource) };
  }
  if (key === 'charging_wallpaper' && data.mp4source) {
    return {
      filename: 'charging_wallpaper.mp4' as const,
      source: String(data.mp4source),
    };
  }
  return null;
};

export const collectChargingAnimationExportFiles = async (
  nodes: FlowNode[],
  nodeId?: string,
  options?: ExportBundleOptions,
): Promise<ChargingExportFile[] | null> => {
  const pushLine = (level: ExportProgressLevel, text: string) => {
    options?.onProgressLine?.({ level, text });
  };

  const rootNode = findRootGroupNode(nodes, nodeId);
  const rootData = getNodeData(rootNode);
  if (!rootNode || rootData.category !== 'charging_animation') {
    pushLine('warning', '当前选中节点不属于 Charging Animation');
    options?.onWarning?.('当前选中节点不属于 Charging Animation');
    return null;
  }

  pushLine('info', '开始收集 Charging Animation 资源...');

  const platformIds = new Set(
    nodes
      .filter(
        (node) =>
          node.type === 'platform_group' && node.parentId === rootNode.id,
      )
      .map((node) => node.id),
  );
  const mediaNodes = nodes.filter(
    (node) =>
      node.type === 'charging_animation' &&
      Boolean(node.parentId) &&
      platformIds.has(node.parentId as string),
  );

  const files: ChargingExportFile[] = [];

  for (const mediaNode of mediaNodes) {
    const data = getNodeData(mediaNode);
    const target = resolveAsset(data);
    if (!target) {
      pushLine('warning', `跳过 ${data.key ?? 'charging_animation'}（未上传文件）`);
      continue;
    }

    pushLine('info', `开始处理 ${target.filename}...`);
    const blob = await fetchSourceBlob(target.source);
    if (!blob) {
      pushLine('warning', `跳过 ${target.filename}（下载失败）`);
      continue;
    }
    if (target.filename === 'preview.pag' && blob.size > PREVIEW_PAG_MAX_BYTES) {
      pushLine(
        'warning',
        `${target.filename} 超过规则上限 1MB，当前 ${(blob.size / 1024 / 1024).toFixed(2)}MB`,
      );
    }
    files.push({ filename: target.filename, blob });
    pushLine('success', `生成 ${target.filename}`);
  }

  const spec = buildChargingAnimationSpec(rootData);
  if (!FONT_COLOR_PATTERN.test(spec.style.fontColor)) {
    pushLine(
      'warning',
      `style.fontColor 应为 #RRGGBB，当前是 ${spec.style.fontColor}`,
    );
  }
  if (!FONT_SIZE_PATTERN.test(String(spec.style.fontSize))) {
    pushLine('warning', `style.fontSize 应为非负整数，当前是 ${spec.style.fontSize}`);
  }
  files.push({
    filename: 'charging_animation_spec.json',
    blob: new Blob([JSON.stringify(spec, null, 2)], {
      type: 'application/json',
    }),
  });
  pushLine('success', '生成 charging_animation_spec.json');

  const missing = REQUIRED_FILES.filter(
    (filename) => !files.some((file) => file.filename === filename),
  );
  if (missing.length) {
    const text = `缺少规则要求的文件：${missing.join('、')}`;
    pushLine('warning', text);
    options?.onWarning?.(text);
    return null;
  }

  pushLine('success', `Charging Animation 资源收集完成，共 ${files.length} 个文件`);
  return files;
};

export const useChargingAnimationExportBundle = (nodeId?: string) => {
  const nodes = useEditorNodes();
  const [exporting, setExporting] = useState(false);

  const exportBundle = useCallback(
    async (options?: ExportBundleOptions) => {
      const pushLine = (level: ExportProgressLevel, text: string) => {
        options?.onProgressLine?.({ level, text });
      };

      if (exporting) return;

      setExporting(true);
      try {
        const files = await collectChargingAnimationExportFiles(
          nodes,
          nodeId,
          options,
        );
        if (!files?.length) return;

        pushLine('info', '正在打包 zip...');
        const zip = new JSZip();
        for (const file of files) {
          zip.file(file.filename, file.blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `charging-animation-export-${Date.now()}.zip`);
        pushLine('success', '导出完成');
        options?.onSuccess?.('Charging Animation 压缩包已下载');
      } catch (error) {
        console.warn('[useChargingAnimationExportBundle] export failed:', error);
        pushLine('error', '导出失败');
        options?.onError?.('导出失败');
      } finally {
        setExporting(false);
      }
    },
    [exporting, nodeId, nodes],
  );

  return {
    exporting,
    exportBundle,
  };
};
