import type { Node as FlowNode } from '@xyflow/react';
import JSZip from 'jszip';
import { useCallback, useState } from 'react';
import { ControlCenterDefaultConfig } from '@/editor-core/defaultConfig';
import { useEditorNodes } from '../context';
import {
  CONTROL_CENTER_FILES,
  CONTROL_CENTER_SPEC_FILE,
  listControlCenterSpecIssues,
  listMissingControlCenterFiles,
  toControlCenterAssetKey,
} from '../control_center/asset-rules';
import { buildControlCenterConfigJson } from '../control_center/util';
import {
  type ExportBundleOptions,
  type ExportProgressLevel,
  fetchSourceBlob,
  findRootGroupNode,
} from './exportBundleShared';

/**
 * 文件清单、尺寸、spec 字段全部来自
 * widget/rule_ymal/resource-validation/control_center.yaml，
 * 机读版在 control_center/asset-rules.ts，这里不再抄一份。
 *
 * 包内是 74 个平铺文件（73 素材 + control_spec.json），没有目录层级。
 */

/** 73 个文件串行下载太慢，并发太高又容易被网关限流，6 路是个折中 */
const DOWNLOAD_CONCURRENCY = 6;

type ControlCenterExportFile = {
  filename: string;
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

/** 缺图的包全列出来会刷屏，日志里只点前几个 */
const summarize = (names: string[], limit = 8) =>
  names.length > limit
    ? `${names.slice(0, limit).join('、')} 等 ${names.length} 个`
    : names.join('、');

/**
 * 收集 Control Center 可导出资源（不打包、不下载）。
 * nodeId 为 control_center 根 group 下任意节点均可。
 */
export const collectControlCenterExportFiles = async (
  nodes: FlowNode[],
  nodeId?: string,
  options?: ExportBundleOptions,
): Promise<ControlCenterExportFile[] | null> => {
  const pushLine = (level: ExportProgressLevel, text: string) => {
    options?.onProgressLine?.({ level, text });
  };

  const rootNode = findRootGroupNode(nodes, nodeId);
  const rootData = (rootNode?.data ?? {}) as Record<string, any>;
  if (!rootNode || rootData.category !== 'control_center') {
    pushLine('warning', '当前选中节点不属于 Control Center');
    options?.onWarning?.('当前选中节点不属于 Control Center');
    return null;
  }

  pushLine('info', '开始收集 Control Center 资源...');

  // 画布节点 → config 的那套逻辑已经在 util 里，导出直接拿它的产物，避免两份口径
  const config = buildControlCenterConfigJson(rootNode, nodes);
  const assets = (config.assets ?? {}) as Record<
    string,
    { source?: string; pagsource?: string } | undefined
  >;

  // pag 的 url 在 pagsource 上，其余在 source 上；空的留给下面的缺失检查统一报
  const targets = CONTROL_CENTER_FILES.flatMap((rule) => {
    const asset = assets[toControlCenterAssetKey(rule.name)];
    const source = rule.format === 'pag' ? asset?.pagsource : asset?.source;
    return source ? [{ filename: rule.name, source: String(source) }] : [];
  });

  // 并发拿回来的顺序是乱的，按下标落位，包内顺序就还是 yaml 的 required_files 顺序
  const blobs: Array<Blob | null> = new Array(targets.length).fill(null);
  let cursor = 0;

  const worker = async () => {
    while (cursor < targets.length) {
      const index = cursor;
      cursor += 1;
      blobs[index] = await fetchSourceBlob(targets[index].source);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, targets.length) }, () =>
      worker(),
    ),
  );

  const files: ControlCenterExportFile[] = targets.flatMap((target, index) => {
    const blob = blobs[index];
    return blob ? [{ filename: target.filename, blob }] : [];
  });
  const failed = targets
    .filter((_, index) => !blobs[index])
    .map((target) => target.filename);
  if (failed.length) {
    pushLine(
      'warning',
      `${failed.length} 个文件下载失败：${summarize(failed)}`,
    );
  }
  pushLine('success', `取回 ${files.length} 个素材`);

  // yaml 要求 21 个字段全存在，画布上没填过的用模板值兜底，不留空 key
  const spec: Record<string, unknown> = { ...ControlCenterDefaultConfig.spec };
  Object.entries((config.spec ?? {}) as Record<string, unknown>).forEach(
    ([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        spec[key] = value;
      }
    },
  );
  const specIssues = listControlCenterSpecIssues(spec);
  if (specIssues.length) {
    pushLine(
      'warning',
      `${CONTROL_CENTER_SPEC_FILE} 有 ${specIssues.length} 个字段不合规：${summarize(
        specIssues.map((issue) => issue.key),
      )}`,
    );
  }
  files.push({
    filename: CONTROL_CENTER_SPEC_FILE,
    blob: new Blob([JSON.stringify(spec, null, 2)], {
      type: 'application/json',
    }),
  });
  pushLine('success', `生成 ${CONTROL_CENTER_SPEC_FILE}`);

  // yaml 要求 74 个文件一个不缺，但缺图时仍然让用户拿到包去补，只给出警告
  const missing = listMissingControlCenterFiles(
    files.map((file) => file.filename),
  );
  if (missing.length) {
    const text = `缺少规则要求的 ${missing.length} 个文件：${summarize(missing)}`;
    pushLine('warning', text);
    options?.onWarning?.(text);
  }

  pushLine('success', `Control Center 资源收集完成，共 ${files.length} 个文件`);
  return files;
};

export const useControlCenterExportBundle = (nodeId?: string) => {
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
        const files = await collectControlCenterExportFiles(
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
        downloadBlob(zipBlob, `control-center-export-${Date.now()}.zip`);
        pushLine('success', '导出完成');
        options?.onSuccess?.('Control Center 压缩包已下载');
      } catch (error) {
        console.warn('[useControlCenterExportBundle] export failed:', error);
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
