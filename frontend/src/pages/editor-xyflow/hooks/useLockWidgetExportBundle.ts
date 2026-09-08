import type { Node as FlowNode } from '@xyflow/react';
import JSZip from 'jszip';
import { useCallback, useState } from 'react';
import { useEditorNodes } from '../context';
import {
  LOCK_ASSET_SCALE,
  LOCK_IMAGE_FIELD_KEYS,
  LOCK_SIZE_LABEL_MAP,
  LOCK_TYPE_WIDGET_MAP,
} from '../lockwidget/base-config';
import {
  getLockExportRule,
  type LockExportFileRule,
  LOCK_SPEC_TOP_FIELDS,
} from '../lockwidget/export-rules';
import {
  generateElementPreview,
  isGifSource,
} from '../util/generateElementPreview';
import { setLockCaptureTheme } from '../util/lockCaptureTheme';
import {
  type ExportBundleOptions,
  type ExportProgressLevel,
  fetchSourceBlob,
  findRootGroupNode,
} from './exportBundleShared';

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
  ((node?.data as Record<string, any> | undefined) ?? {}) as Record<
    string,
    any
  >;

const getNodeSelectorById = (id: string) => {
  if (!id) return '';
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return `.xyflow-stage .react-flow__node[data-id="${CSS.escape(id)}"]`;
  }
  return `.xyflow-stage .react-flow__node[data-id="${id}"]`;
};

const queryNodeElement = (id: string) => {
  if (typeof document === 'undefined') return null;
  const selector = getNodeSelectorById(id);
  if (!selector) return null;
  return document.querySelector(selector) as HTMLElement | null;
};

export type LockWidgetSizeLabel = 'circle' | 'rect' | 'inline';

export type LockWidgetExportFile = {
  /** 稳定标识，外部改名时用这个识别（如 battery_rect） */
  key: string;
  /** 资源类型：素材 / 预览图 / 描述文件 */
  kind: 'asset' | 'preview' | 'spec';
  /** 默认文件名，外部打包时可换成任意路径/名字 */
  filename: string;
  blob: Blob;
};

/** 单个尺寸节点的收集上下文，由主流程准备好后传给 collector */
export type LockWidgetExportContext = {
  /** 顶层 config（platform_group.data）：version / isLockScreen / type / sizes */
  config: Record<string, any>;
  /** 业务 type，如 1001 */
  type: number;
  /** 业务 type 对应的名字，如 battery */
  typeName: string;
  /** 当前尺寸子节点 */
  sizeNode: FlowNode;
  /** sizes[] 中当前这一项 */
  sizeData: Record<string, any>;
  /** 形状，由 size 推出 */
  sizeLabel: LockWidgetSizeLabel;
  /** 画布上对应的 DOM，做截图 / 裁剪时传给 cropMediaByUrl */
  targetElement: HTMLElement | null;
  pushFile: (file: LockWidgetExportFile) => void;
  pushLine: (level: ExportProgressLevel, text: string) => void;
};

export type LockWidgetCollector = (
  context: LockWidgetExportContext,
) => Promise<void> | void;

/**
 * 预览图按 @3x 素材尺寸出图，画布 DOM 是 @1x 点，
 * 截图倍率取素材比例才刚好等于规则要求的像素数、不用再放大采样。
 */
const PREVIEW_CAPTURE_SCALE = LOCK_ASSET_SCALE;
const PREVIEW_JPEG_QUALITY = 1;

/** previewTransParent 要求「没有背景 + 元素纯白」，见 EXPORT_RULES.md「预览图命名」一节 */
const TRANSPARENT_PREVIEW_FOCUS_COLOR = '#ffffff';
const TRANSPARENT_PREVIEW_BACKGROUND_COLOR = 'transparent';

/**
 * 等 React 提交并绘制完，保证截到的是刚接管的配色。
 * 标签页不可见时 rAF 不触发，用超时兜底，否则导出会永久卡住。
 */
const waitForPaint = () =>
  new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, 100);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.clearTimeout(timer);
        resolve();
      });
    });
  });

/**
 * 截图期间把节点的可见性钉成 visible。
 *
 * React Flow 在节点重新测量完成前会给节点 DOM 挂 visibility: hidden
 * （`nodeHasDimensions` 看的是 measured/width/initialWidth，而锁屏尺寸节点的宽高来自 CSS class，
 * 这三个字段都是 undefined）。导出自身的 pushLine / pushFile 会改 React state，
 * 让 editor-stage 重新 map 出新的 node 对象触发重测量，这个窗口正好落在截图进行中。
 * html-to-image 是逐条复制计算样式的，会把 hidden 一起复制进克隆节点，
 * 于是整棵子树不绘制，只剩 toCanvas 填的那层背景色（一张纯色图）。
 *
 * 钉在 captureElement（卡片）上而不是节点 div 上：卡片的 style 由我们自己的组件渲染、
 * 不含 visibility，React 重渲染不会覆盖它；而 visibility 是继承的，钉住卡片就够了。
 * 元素本来就是可见的，所以视觉上没有任何变化。
 */
const withForcedVisibility = async <T>(
  elements: (HTMLElement | null)[],
  run: () => Promise<T>,
): Promise<T> => {
  const restores = elements
    .filter((element): element is HTMLElement => Boolean(element))
    .map((element) => {
      const previous = element.style.visibility;
      element.style.setProperty('visibility', 'visible', 'important');
      return () => {
        element.style.visibility = previous;
      };
    });
  try {
    return await run();
  } finally {
    restores.forEach((restore) => {
      restore();
    });
  }
};

/**
 * 按规则截一张预览图，带背景和透明底两张都走这里。
 *
 * 透明底那张靠 setLockCaptureTheme 把组件的 focusColor 换成白色、backgroundColor 换成透明，
 * 再让 toCanvas 不铺底色。改数据而不是改 DOM 样式：白色元素里既有 mask 图标也有
 * conic-gradient 进度弧和 SVG 描边，逐个改样式要按组件写死，改配色字段所有类型通吃。
 *
 * 规则要 gif 时（1005 Dynamic 的带背景预览）转交 isGif 分支：那边会解掉 DOM 里 img 的
 * gif 源，逐帧换 src 再截图，不靠等真实动画自行推进，所以采样不会漂移。
 */
const captureLockPreview = async (
  targetElement: HTMLElement,
  nodeId: string,
  previewRule: LockExportFileRule,
) => {
  const transparent = Boolean(previewRule.transparent);
  if (transparent) {
    setLockCaptureTheme({
      nodeId,
      focusColor: TRANSPARENT_PREVIEW_FOCUS_COLOR,
      backgroundColor: TRANSPARENT_PREVIEW_BACKGROUND_COLOR,
    });
    await waitForPaint();
  }
  try {
    return await withForcedVisibility(
      [targetElement, targetElement.firstElementChild as HTMLElement | null],
      () =>
        generateElementPreview(targetElement, {
          isGif: previewRule.format === 'gif',
          scale: PREVIEW_CAPTURE_SCALE,
          jpegQuality: PREVIEW_JPEG_QUALITY,
          imageFormat: previewRule.format === 'png' ? 'png' : 'jpeg',
          transparentBackground: transparent,
          outputWidth: previewRule.expectedWidth,
          outputHeight: previewRule.expectedHeight,
        }),
    );
  } finally {
    if (transparent) setLockCaptureTheme(null);
  }
};

/**
 * 规则里的文件名。1005 Dynamic 的 gif 名字来自 sizes[].fileName，
 * 要和 spec 里的值逐字一致才过得了 yml 的 file_references 校验，所以不做归一化。
 * 名字算不出来（没填 fileName）时返回空串，由调用方跳过这一个文件。
 */
const resolveLockFileName = (
  rule: LockExportFileRule,
  sizeData: Record<string, any>,
) => (typeof rule.name === 'function' ? rule.name(sizeData) : rule.name);

/** 取 sizes[] 当前项里某个上传字段的原图 */
const fetchLockSourceBlob = (
  sizeData: Record<string, any>,
  sourceField: string,
) => fetchSourceBlob(String(sizeData[sourceField]?.source ?? ''));

/** 导出文件的稳定 key，外部改文件名后靠它识别 */
const makeLockFileKey = (
  typeName: string,
  sizeLabel: string,
  suffix: string,
) => `lock_${typeName}_${sizeLabel}_${suffix}`;

/**
 * image_* 素材。两种来源：
 * - 规则填了 copyOf：这张素材和某张预览是同一张图（1009 Health 的 image_static_* 就是那张
 *   透明底预览，1005 Dynamic 的 {fileName}.gif 就是那张透明底 gif），
 *   直接复用预览那份 blob，不再重复下载 / 截图；
 * - 否则走用户上传的原图，按 yml 的 required_files 改个名透传，不重编码也不缩放。
 *
 * 某一张拿不到只跳过这一张，不影响同一份 zip 里的其他文件。
 */
const pushLockRuleAssets = async (
  assetRules: LockExportFileRule[],
  previewBlobByFilename: Map<string, Blob>,
  ctx: LockWidgetExportContext,
) => {
  const { sizeData, typeName, sizeLabel, pushFile, pushLine } = ctx;
  for (const assetRule of assetRules) {
    const sourceField = String(assetRule.sourceField ?? '');
    const filename = resolveLockFileName(assetRule, sizeData);
    if (!filename) {
      pushLine('warning', `跳过 ${sourceField} 素材（spec 里没填 fileName）`);
      continue;
    }
    const copiedBlob = assetRule.copyOf
      ? previewBlobByFilename.get(assetRule.copyOf)
      : undefined;
    // 被复用的那张预览没产出时回落到上传的原图
    const blob =
      copiedBlob ?? (await fetchLockSourceBlob(sizeData, sourceField));
    if (!blob) {
      pushLine('warning', `跳过 ${filename}（未上传或下载失败）`);
      continue;
    }
    pushFile({
      key: makeLockFileKey(typeName, sizeLabel, sourceField),
      kind: 'asset',
      filename,
      blob,
    });
    pushLine(
      'success', `生成 ${filename}`,
    );
  }
};

/**
 * 动图预览必须有真实的 gif 源才截得出动画。
 *
 * 判据要和 generateElementPreview 的 isGif 分支完全一致（同一个 isGifSource）：
 * 那边扫不到 gif <img> 会穿到兜底采样分支，按标称帧数做十来次全量截图，
 * 最后编出一张画面全同的动图 —— 很慢而且没有意义，不如直接跳过这个文件。
 * 上传源缺失、以及 URL 认不出是 gif（那边同样认不出）都会落到这里。
 */
const hasGifImageSource = (element: HTMLElement) =>
  Array.from(element.querySelectorAll('img')).some((img) =>
    isGifSource(img.currentSrc || img.src || ''),
  );

/** 拿不到内容时带上原因，让进度日志能指出到底缺什么 */
type LockPreviewSource = { blob: Blob } | { blob: null; reason: string };

/**
 * 一张 preview 的内容来源：
 * - 规则填了 sourceField：这张预览就是用户上传的原图，原样透传。1005 Dynamic 的透明底 gif
 *   走这条 —— 上传的 gif 本身就是透明底，透传既省掉一次截图，也避开 gif.js 只支持
 *   1 bit 索引透明、重编码会把透明区压成黑底的问题；
 * - 否则截画布上的 DOM。
 */
const loadLockPreviewBlob = async (
  previewRule: LockExportFileRule,
  ctx: LockWidgetExportContext,
): Promise<LockPreviewSource> => {
  const { sizeData, sizeNode, targetElement } = ctx;
  if (previewRule.sourceField) {
    const blob = await fetchLockSourceBlob(sizeData, previewRule.sourceField);
    return blob ? { blob } : { blob: null, reason: '未上传或下载失败' };
  }
  if (!targetElement) {
    return { blob: null, reason: '画布上未找到该节点' };
  }
  if (previewRule.format === 'gif' && !hasGifImageSource(targetElement)) {
    return { blob: null, reason: '组件里没有可用的 gif 源' };
  }
  return {
    blob: await captureLockPreview(
      targetElement,
      String(sizeNode.id),
      previewRule,
    ),
  };
};

/**
 * 两张 preview：带背景那张和透明底那张，差异全在规则表里（format + transparent + sourceField）。
 * 返回按文件名索引的 blob，供 copyOf 的素材复用。
 */
const pushLockRulePreviews = async (
  previewRules: LockExportFileRule[],
  ctx: LockWidgetExportContext,
) => {
  const { sizeData, typeName, sizeLabel, pushFile, pushLine } = ctx;
  const blobByFilename = new Map<string, Blob>();
  for (const previewRule of previewRules) {
    const filename = resolveLockFileName(previewRule, sizeData);
    const source = await loadLockPreviewBlob(previewRule, ctx);
    if (!source.blob) {
      pushLine('warning', `跳过 ${filename}（${source.reason}）`);
      continue;
    }
    const blob = source.blob;
    blobByFilename.set(filename, blob);
    pushFile({
      key: makeLockFileKey(
        typeName,
        sizeLabel,
        previewRule.transparent ? 'previewTransParent' : 'preview',
      ),
      kind: 'preview',
      filename,
      blob,
    });
    pushLine(
      'success',
      `生成 ${filename} ${previewRule.expectedWidth} * ${previewRule.expectedHeight}`,
    );
  }
  return blobByFilename;
};

/**
 * 通用收集器，所有锁屏类型默认都走它。
 *
 * 29 个类型的导出内容是同一个形状：若干张 image_* 素材 + 两张 preview（带背景 + 透明底），
 * 而文件名、尺寸、格式、透明与否已经全部登记在 LOCK_EXPORT_RULES 里，
 * 所以不用按类型各写一个 collector，照着规则表跑一遍就行。
 *
 * 先跑预览再跑素材：带 copyOf 的素材要复用预览的 blob（见 pushLockRuleAssets），
 * 反过来就拿不到了。zip 内文件无序，顺序只影响进度日志。
 */
const collectByExportRule: LockWidgetCollector = async (ctx) => {
  const { sizeNode, typeName, sizeLabel, pushLine } = ctx;
  const files = getLockExportRule(String(sizeNode.type ?? ''))?.files;
  if (!files?.length) {
    pushLine('warning', `lock_${typeName}_${sizeLabel} 未登记导出规则`);
    return;
  }
  const previewBlobByFilename = await pushLockRulePreviews(
    files.filter((file) => file.kind === 'preview'),
    ctx,
  );
  await pushLockRuleAssets(
    files.filter((file) => file.kind === 'asset'),
    previewBlobByFilename,
    ctx,
  );
};

/**
 * 需要在通用流程之外单独处理的类型写进本表，没登记的一律走 collectByExportRule。
 * 原来那个「按 type 注册 + 未注册就报未实现」的 fallbackCollector 已经删掉：
 * 通用流程覆盖了全部类型，真正的异常只剩「该 type 没登记规则」，由 collectByExportRule 报。
 */
const LOCK_WIDGET_COLLECTORS: Partial<Record<number, LockWidgetCollector>> = {};

/**
 * sizes[] 逐项剔除只有编辑器用的字段：
 * - image_*：存的是上传资源的 URL，客户端读的是同包里的图片文件，不该进 spec；
 * - focusColor / backgroundColor：只用于画布渲染和导出时的配色接管，客户端不读。
 *
 * 其余字段全部保留，yml 是 allow_extra_fields: true。
 */
const sanitizeLockSizeSpec = (sizeData: Record<string, any>) => {
  const next: Record<string, any> = {};
  Object.keys(sizeData).forEach((key) => {
    if (LOCK_IMAGE_FIELD_KEYS.includes(key)) return;
    if (key === 'focusColor' || key === 'backgroundColor') return;
    next[key] = sizeData[key];
  });
  return next;
};

/**
 * 组装 widgets_spec.json。
 * 顶层按 LOCK_SPEC_TOP_FIELDS 白名单取：config 是 platform_group.data，
 * 里面还被 lockWidgetConfig2Nodes 塞了 label / themekitType 这类画布字段。
 *
 * 注意 yml 要求一份 spec 只装一个 size（min/max_length 都是 1），battery 只有 rect 一个尺寸
 * 所以目前成立；等有多尺寸类型时要改成按尺寸节点拆包，见 EXPORT_RULES.md 第 4.1 条。
 */
const buildLockWidgetsSpec = (
  config: Record<string, any>,
  sizes: Record<string, any>[],
): Record<string, any> | null => {
  if (!sizes.length) return null;
  const spec: Record<string, any> = {};
  LOCK_SPEC_TOP_FIELDS.forEach((key) => {
    if (key === 'sizes') return;
    spec[key] = config[key];
  });
  spec.sizes = sizes.map(sanitizeLockSizeSpec);
  return spec;
};

/**
 * 收集 Lock Widget 可导出资源（不打包、不下载）。
 * 供 theme 等外部品类自行改名后打进别的 zip。
 */
export const collectLockWidgetExportFiles = async (
  nodes: FlowNode[],
  nodeId?: string,
  options?: ExportBundleOptions,
): Promise<LockWidgetExportFile[] | null> => {
  const pushLine = (level: ExportProgressLevel, text: string) => {
    options?.onProgressLine?.({ level, text });
  };

  const rootNode = findRootGroupNode(nodes, nodeId);
  if (!rootNode || getNodeData(rootNode).category !== 'lockwidget') {
    pushLine('warning', '当前选中节点不属于 lockwidget');
    options?.onWarning?.('当前选中节点不属于 lockwidget');
    return null;
  }

  // 锁屏组件只有 iOS 一个平台，root 下固定一个 platform_group
  const platformNode = nodes.find(
    (node) => node.type === 'platform_group' && node.parentId === rootNode.id,
  );
  if (!platformNode) {
    pushLine('warning', '未找到锁屏组件的平台分组');
    options?.onWarning?.('未找到锁屏组件的平台分组');
    return null;
  }

  const config = getNodeData(platformNode);
  const type = Number(config.type ?? 0);
  const typeName = LOCK_TYPE_WIDGET_MAP[type] || 'unknown';

  // 尺寸子节点顺序与保存时一致（buildLockWidgetElementPayload 按 size 升序）
  const sizeNodes = nodes
    .filter((node: any) => node.parentId === platformNode.id && node.metaable)
    .sort(
      (a, b) =>
        Number(getNodeData(a).size ?? 0) - Number(getNodeData(b).size ?? 0),
    );
  if (!sizeNodes.length) {
    pushLine('warning', '该锁屏组件下没有尺寸节点');
    options?.onWarning?.('该锁屏组件下没有尺寸节点');
    return [];
  }

  pushLine('info', `开始收集 Lock ${typeName} 资源...`);
  const files: LockWidgetExportFile[] = [];
  const pushFile = (file: LockWidgetExportFile) => {
    files.push(file);
  };

  const spec = buildLockWidgetsSpec(
    config,
    sizeNodes.map((node) => getNodeData(node)),
  );
  if (spec) {
    pushFile({
      key: 'lock_widgets_spec',
      // 文件名按 yml 的 required_files 取 widgets_spec.json，key 仍留 lock_ 前缀供外部识别改名
      kind: 'spec',
      filename: 'widgets_spec.json',
      blob: new Blob([JSON.stringify(spec, null, 2)], {
        type: 'application/json',
      }),
    });
    pushLine('success', '生成 widgets_spec.json');
  }

  for (const sizeNode of sizeNodes) {
    const sizeData = getNodeData(sizeNode);
    const sizeLabel = LOCK_SIZE_LABEL_MAP[Number(sizeData.size ?? 0)] ?? 'rect';
    const collector = LOCK_WIDGET_COLLECTORS[type] ?? collectByExportRule;
    try {
      await collector({
        config,
        type,
        typeName,
        sizeNode,
        sizeData,
        sizeLabel,
        targetElement: queryNodeElement(String(sizeNode.id)),
        pushFile,
        pushLine,
      });
    } catch (error) {
      console.warn('[useLockWidgetExportBundle] collector failed:', error);
      pushLine('warning', `跳过 lock_${typeName}_${sizeLabel}（导出失败）`);
    }
  }

  if (!files.length) {
    pushLine('warning', '没有可导出的文件');
    options?.onWarning?.('没有可导出的文件');
    return [];
  }

  pushLine('success', `资源收集完成，共 ${files.length} 个文件`);
  return files;
};

/** 将已收集的资源打成 zip 并触发下载 */
export const packAndDownloadLockWidgetFiles = async (
  files: LockWidgetExportFile[],
  options?: ExportBundleOptions & { filename?: string },
) => {
  const pushLine = (level: ExportProgressLevel, text: string) => {
    options?.onProgressLine?.({ level, text });
  };

  if (!files.length) {
    pushLine('warning', '没有可导出的文件');
    options?.onWarning?.('没有可导出的文件');
    return false;
  }

  pushLine('info', '正在打包 zip...');
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.filename, file.blob);
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = options?.filename || `lockwidget-export-${Date.now()}.zip`;
  downloadBlob(zipBlob, filename);
  pushLine('success', '导出完成');
  options?.onSuccess?.('Lock Widget 压缩包已下载');
  return true;
};

export const useLockWidgetExportBundle = (nodeId?: string) => {
  const nodes = useEditorNodes();
  const [exporting, setExporting] = useState(false);

  /** 获取可打包资源列表（不下载）；外部可改 filename 后打进别的 zip */
  const collectAssets = useCallback(
    async (
      options?: ExportBundleOptions,
    ): Promise<LockWidgetExportFile[] | null> => {
      if (exporting) return null;
      setExporting(true);
      try {
        return await collectLockWidgetExportFiles(nodes, nodeId, options);
      } catch (error) {
        console.warn(
          '[useLockWidgetExportBundle] collectAssets failed:',
          error,
        );
        options?.onProgressLine?.({ level: 'error', text: '收集资源失败' });
        options?.onError?.('收集资源失败');
        return null;
      } finally {
        setExporting(false);
      }
    },
    [exporting, nodeId, nodes],
  );

  /** 收集资源 + 打包下载 */
  const exportBundle = useCallback(
    async (options?: ExportBundleOptions) => {
      if (exporting) return;
      setExporting(true);
      try {
        const files = await collectLockWidgetExportFiles(
          nodes,
          nodeId,
          options,
        );
        if (!files?.length) return;
        await packAndDownloadLockWidgetFiles(files, options);
      } catch (error) {
        console.warn('[useLockWidgetExportBundle] export failed:', error);
        options?.onProgressLine?.({ level: 'error', text: '导出失败' });
        options?.onError?.('导出失败');
      } finally {
        setExporting(false);
      }
    },
    [exporting, nodeId, nodes],
  );

  return {
    exporting,
    /** 只拿资源，不打包不下载 */
    collectAssets,
    exportBundle,
  };
};
