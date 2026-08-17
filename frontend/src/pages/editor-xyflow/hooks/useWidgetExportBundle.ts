import { useCallback, useState } from 'react';
import JSZip from 'jszip';
import type { Node as FlowNode } from '@xyflow/react';
import { useEditorNodes } from '../context';
import { useNodeChildElements } from './useNodeChildElements';
import { cropMediaByUrl } from '../util/cropMediaByUrl';
import {
  generateElementPreview,
  isGifSource,
} from '../util/generateElementPreview';
import { setWidgetCaptureFrameIndex } from '../util/widgetCaptureFrame';
import { resolveAlternateAnimationCycleMs } from '../widget/util';
import {
  CONFIG_SIZE_MAP,
  SOURCENAME_TYPE_WIDGET_MAP,
  TYPE_WIDGET_MAP,
  WIDGET_EXPORT_FILE_RULES,
  type WidgetExportMode,
  type WidgetPlatform,
  type WidgetSizeLabel,
} from '../widget/base-config';

import type {
  ExportBundleOptions,
  ExportProgressLevel,
  ExportProgressLine,
} from './exportBundleShared';

export type {
  ExportBundleOptions,
  ExportProgressLevel,
  ExportProgressLine,
} from './exportBundleShared';

export type WidgetExportFile = {
  filename: string;
  blob: Blob;
};

type SizeLabel = WidgetSizeLabel;

const EXPORT_JPEG_QUALITY = 1;
const EXPORT_PREVIEW_SCALE = 3;

const SIZE_LABEL_MAP: Record<number, SizeLabel> = {
  1: 'small',
  2: 'medium',
  3: 'large',
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

const sanitizeWidgetsSpec = (value: unknown): unknown => {
  const delKey = [
    'source',
    'crop_props',
    'radius',
    'label',
    'appLinksSource',
    'battery_20',
    'battery_40',
    'battery_60',
    'battery_80',
    'battery_100',
    'imageCloud',
    'imageRain',
    'imageSnow',
    'imageSun',
    'imageThunder',
    'imageWind',
    'minuteClock',
    'hourClock',
    'dotClock',
    'dialLargeClock',
    'dialSmallClock',
    'themekitSizewithTypes',
    'music',
    'show',
  ];
  const showKey = ['weekday']
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeWidgetsSpec(item));
  }
  if (value && typeof value === 'object') {
    const source = value as Record<string, any>;
    const next: Record<string, unknown> = {};
    Object.keys(source).forEach((key) => {
      if (delKey.includes(key)) return;
      if (showKey.includes(key) && typeof source[key] === 'object' && !source[key].show) {
        return;
      };
      next[key] = sanitizeWidgetsSpec(source[key]);
    });
    return next;
  }
  return value;
};

const toPositiveNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const getSizeConfig = (size: number) => {
  const raw =
    (CONFIG_SIZE_MAP as Record<number, { width?: number; height?: number }>)[
      size
    ] ?? {};
  return {
    width: toPositiveNumber(raw.width) ?? undefined,
    height: toPositiveNumber(raw.height) ?? undefined,
  };
};

const formatSizeText = (width?: number, height?: number) =>
  `${width ?? '-'} * ${height ?? '-'}`;

const loadImageByBlobUrl = (blobUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image.'));
    img.src = blobUrl;
  });

const toPngBlobFromUrl = async (
  sourceUrl: string,
  options?: { width?: number; height?: number; mimeType?: string; quality?: number },
) => {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch animation source: ${response.status}`);
  }
  const blob = await response.blob();
  const targetWidth = toPositiveNumber(options?.width);
  const targetHeight = toPositiveNumber(options?.height);
  const mimeType = options?.mimeType ?? 'image/png';
  const quality = options?.quality;

  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth ?? bitmap.width;
      canvas.height = targetHeight ?? bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot create canvas context.');
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((nextBlob) => {
          if (!nextBlob) {
            reject(new Error('Failed to encode png.'));
            return;
          }
          resolve(nextBlob);
        }, mimeType, quality);
      });
      return pngBlob;
    } catch {
      // createImageBitmap 对部分 gif/格式兼容性差，回退到 <img> 解码
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await loadImageByBlobUrl(objectUrl);
    const canvas = document.createElement('canvas');
    const sourceWidth = image.naturalWidth || image.width || 1;
    const sourceHeight = image.naturalHeight || image.height || 1;
    canvas.width = targetWidth ?? sourceWidth;
    canvas.height = targetHeight ?? sourceHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot create canvas context.');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((nextBlob) => {
        if (!nextBlob) {
          reject(new Error('Failed to encode png.'));
          return;
        }
        resolve(nextBlob);
      }, mimeType, quality);
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const normalizeCropProps = (cropProps: any) => ({
  translateX: Number(cropProps?.translateX ?? 0),
  translateY: Number(cropProps?.translateY ?? 0),
  rotation: Number(cropProps?.rotation ?? 0),
  scaleX: Number(cropProps?.scaleX ?? 1),
  scaleY: Number(cropProps?.scaleY ?? 1),
});

const resolvePlatform = (parentId: unknown): any | null => {
  const value = String(parentId ?? '');
  if (value.endsWith('_ios')) return 'ios';
  if (value.endsWith('_android')) return 'android';
  if (value.endsWith('_common')) return 'common';
  return null;
};

const getExportRule = (params: {
  sizeLabel: SizeLabel;
  platform: WidgetPlatform | null;
  type: number;
  mode: WidgetExportMode;
}) => {
  const { sizeLabel, platform, type, mode } = params;

  if (platform) {
    const platformRules = WIDGET_EXPORT_FILE_RULES[platform];
    const byLayout = platformRules?.[type]?.[sizeLabel]?.[mode];
    if (byLayout) return byLayout;
  }
  return WIDGET_EXPORT_FILE_RULES.default[sizeLabel][mode];
};

const getNodeSelectorById = (nodeId: string) => {
  if (!nodeId) return '';
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return `.xyflow-stage .react-flow__node[data-id="${CSS.escape(nodeId)}"]`;
  }
  return `.xyflow-stage .react-flow__node[data-id="${nodeId}"]`;
};

const resolveWidgetChildContext = (nodes: FlowNode[], nodeId?: string) => {
  if (!nodeId) {
    return { childNodes: [] as FlowNode[], elementById: new Map<string, HTMLElement>() };
  }
  const childNodes = nodes.filter((node) => node.parentId === nodeId);
  const elementById = new Map<string, HTMLElement>();
  if (typeof document !== 'undefined') {
    childNodes.forEach((node) => {
      const selector = getNodeSelectorById(String(node.id));
      if (!selector) return;
      const element = document.querySelector(selector) as HTMLElement | null;
      if (element) elementById.set(String(node.id), element);
    });
  }
  return { childNodes, elementById };
};

/**
 * 收集 Widget 可导出资源（不打包、不下载）。
 * nodeId 应为 platform_group（与单品导出一致）。
 */
export const collectWidgetExportFiles = async (
  nodes: FlowNode[],
  nodeId?: string,
  options?: ExportBundleOptions,
): Promise<WidgetExportFile[] | null> => {
  const pushLine = (level: ExportProgressLevel, text: string) => {
    options?.onProgressLine?.({ level, text });
  };

  const { childNodes, elementById } = resolveWidgetChildContext(nodes, nodeId);
  if (!childNodes.length || !elementById.size) {
    pushLine('warning', '未获取到可导出的子节点');
    options?.onWarning?.('未获取到可导出的子节点');
    return null;
  }

  pushLine('info', '开始收集 Widget 资源...');
  const files: WidgetExportFile[] = [];
  const pushFile = (filename: string, blob: Blob) => {
    files.push({ filename, blob });
    pushLine('success', `生成 ${filename}`);
  };

  const selectedNode = nodes.find(
    (node) => String(node.id) === String(nodeId),
  );
  const selectedNodeData = ((selectedNode?.data as Record<
    string,
    unknown
  > | null) ?? {}) as Record<string, unknown>;
  const childConfigs = childNodes
    .map((node: any) => ({ ...(node?.data ?? {}) }))
    .filter((config) => Object.keys(config).length > 0)
    .sort((a: any, b: any) => Number(a?.size ?? 0) - Number(b?.size ?? 0));
  const widgetsSpec = sanitizeWidgetsSpec({
    ...selectedNodeData,
    sizes: childConfigs,
  });
  const type: any = selectedNodeData ? selectedNodeData.type : 1;
  pushFile(
    'widgets_spec.json',
    new Blob([JSON.stringify(widgetsSpec, null, 2)], {
      type: 'application/json',
    }),
  );

  const weatherImageEntries = [
    { key: 'cloud', source: (selectedNodeData as any)?.imageCloud?.source },
    { key: 'rain', source: (selectedNodeData as any)?.imageRain?.source },
    { key: 'snow', source: (selectedNodeData as any)?.imageSnow?.source },
    { key: 'sun', source: (selectedNodeData as any)?.imageSun?.source },
    { key: 'thunder', source: (selectedNodeData as any)?.imageThunder?.source },
    { key: 'wind', source: (selectedNodeData as any)?.imageWind?.source },
  ];
  for (let imageIndex = 0; imageIndex < weatherImageEntries.length; imageIndex += 1) {
    const { key, source: imageSource } = weatherImageEntries[imageIndex];
    if (!imageSource || typeof imageSource !== 'string') continue;
    const filename = `image_${key}.png`;
    try {
      const imageBlob = await toPngBlobFromUrl(imageSource);
      pushFile(filename, imageBlob);
    } catch {
      pushLine('warning', `跳过 ${filename}（资源下载失败）`);
    }
  }

  const clockImageEntries = [
    { key: 'minute_clock', source: (selectedNodeData as any)?.minuteClock?.source },
    { key: 'hour_clock', source: (selectedNodeData as any)?.hourClock?.source },
    { key: 'dot_clock', source: (selectedNodeData as any)?.dotClock?.source },
    { key: 'dial_large_clock', source: (selectedNodeData as any)?.dialLargeClock?.source },
    { key: 'dial_small_clock', source: (selectedNodeData as any)?.dialSmallClock?.source },
  ];
  for (let imageIndex = 0; imageIndex < clockImageEntries.length; imageIndex += 1) {
    const { key, source: imageSource } = clockImageEntries[imageIndex];
    if (!imageSource || typeof imageSource !== 'string') continue;
    const filename = `widgets_${key}.png`;
    try {
      const imageBlob = await toPngBlobFromUrl(imageSource);
      pushFile(filename, imageBlob);
    } catch {
      pushLine('warning', `跳过 ${filename}（资源下载失败）`);
    }
  }

  for (let index = 0; index < childNodes.length; index += 1) {
    const childNode = childNodes[index] as any;
    const childNodeId = String(childNode?.id ?? '');
    const targetElement = elementById.get(childNodeId) ?? null;
    if (!targetElement) continue;

    const data = (childNode?.data ?? {}) as any;
    const source = data?.source;
    const batteryEntries = [
      { key: 'battery_20', source: data?.battery_20?.source },
      { key: 'battery_40', source: data?.battery_40?.source },
      { key: 'battery_60', source: data?.battery_60?.source },
      { key: 'battery_80', source: data?.battery_80?.source },
      { key: 'battery_100', source: data?.battery_100?.source },
    ].filter((item) => typeof item.source === 'string' && item.source);
    const batterySources = batteryEntries.map((item) => item.source as string);
    const isDynamic =
      Boolean(data?.firstImageAnimation) ||
      Boolean(data?.secondImageAnimation) ||
      isGifSource(source);
    // 存在交替动画时，preview 必须完整覆盖一轮交替，否则采样窗口由截图快慢决定、可能只拍到一层。
    // 但背景或任一动画层是 GIF 时会走「按源 GIF 时间轴采样」的分支，那条分支的节奏由源 GIF 决定，不能覆盖。
    const alternateCycleMs = resolveAlternateAnimationCycleMs(data);
    const hasGifLayer = [
      source,
      data?.firstImageAnimation?.source,
      data?.secondImageAnimation?.source,
      data?.thirdImageAnimation?.source,
      data?.fourthImageAnimation?.source,
    ].some((item) => isGifSource(String(item ?? '')));
    const shouldPaceToAlternateCycle = alternateCycleMs > 0 && !hasGifLayer;

    const sizeNumber = Number(data?.size ?? 0);
    const sizeLabel =
      SIZE_LABEL_MAP[sizeNumber] ?? `size_${sizeNumber || index + 1}`;
    const platform = resolvePlatform(childNode?.parentId);
    const type = Number(selectedNodeData?.type ?? 0);
    const fixedRule = SIZE_LABEL_MAP[sizeNumber]
      ? getExportRule({
          sizeLabel: SIZE_LABEL_MAP[sizeNumber],
          platform,
          type,
          mode: (selectedNodeData?.isGif || data?.isGif) ? 'dynamic' : 'static',
        })
      : null;
    const sizeConfig = getSizeConfig(sizeNumber);
    const timejpgWidth = fixedRule?.timejpg.width ?? sizeConfig.width;
    const timejpgHeight = fixedRule?.timejpg.height ?? sizeConfig.height;
    const timegifWidth = fixedRule?.timegif.width ?? sizeConfig.width;
    const timegifHeight = fixedRule?.timegif.height ?? sizeConfig.height;
    const previewWidth = fixedRule?.preview.width ?? sizeConfig.width;
    const previewHeight = fixedRule?.preview.height ?? sizeConfig.height;
    const normalizedCropProps = normalizeCropProps(data?.crop_props ?? {});
    pushLine('info', `开始处理 widgets_${sizeLabel}...`);

    const { jpegBlob, gifBlob } = await cropMediaByUrl(source, {
      transform: normalizedCropProps,
      targetElement,
      gifOutputWidth: timegifWidth,
      gifOutputHeight: timegifHeight,
      jpegOutputWidth: timejpgWidth,
      jpegOutputHeight: timejpgHeight,
      jpegQuality: EXPORT_JPEG_QUALITY,
      outputScale: 1,
      renderScale: 2,
      resizeMode: 'stretch',
    });
    if (!jpegBlob) {
      pushLine('warning', `跳过 ${sizeLabel} 主图（未找到 source）`);
    } else {
      const expectedFilename = `widgets_${sizeLabel}_${SOURCENAME_TYPE_WIDGET_MAP[type] || TYPE_WIDGET_MAP[type]}`;
      pushFile(`${expectedFilename}.jpg`, jpegBlob);
      pushLine(
        'info',
        `${expectedFilename}.jpg ${formatSizeText(timejpgWidth, timejpgHeight)}`,
      );
      if (gifBlob) {
        pushFile(`${expectedFilename}.gif`, gifBlob);
        pushLine(
          'info',
          `${expectedFilename}.gif ${formatSizeText(timegifWidth, timegifHeight)}`,
        );
      }
    }

    if (source) {
      const previewBlob = await generateElementPreview(targetElement, {
        isGif: isDynamic,
        sourceUrl: source,
        scale: EXPORT_PREVIEW_SCALE,
        jpegQuality: EXPORT_JPEG_QUALITY,
        outputWidth: previewWidth,
        outputHeight: previewHeight,
        ...(shouldPaceToAlternateCycle
          ? { durationMs: alternateCycleMs, paceSampling: true }
          : {}),
      });
      if (previewBlob) {
        const previewName = `widgets_${sizeLabel}_preview.${isDynamic ? 'gif' : 'jpg'}`;
        pushFile(previewName, previewBlob);
        pushLine(
          'info',
          `${previewName} ${formatSizeText(previewWidth, previewHeight)}`,
        );
      }
    }

    if (batterySources.length) {
      // 逐帧指定电量档位再截图，避免依赖组件自身定时器导致漏帧、重复帧
      let previewBlob: Blob | null = null;
      try {
        previewBlob = await generateElementPreview(targetElement, {
          isGif: true,
          fps: 1,
          durationMs: batterySources.length * 1000,
          frameCount: batterySources.length,
          onFrame: (frameIndex) => setWidgetCaptureFrameIndex(frameIndex),
          scale: EXPORT_PREVIEW_SCALE,
          outputWidth: previewWidth,
          outputHeight: previewHeight,
        });
      } finally {
        setWidgetCaptureFrameIndex(null);
      }
      if (previewBlob) {
        pushFile(`widgets_${sizeLabel}_preview.gif`, previewBlob);
        pushLine(
          'info',
          `widgets_${sizeLabel}_preview.gif ${formatSizeText(previewWidth, previewHeight)}`,
        );
      }
      const promislist = batteryEntries.map((bs: any) => {
        return toPngBlobFromUrl(bs.source, {
          width: timejpgWidth,
          height: timejpgHeight,
          mimeType: 'image/jpeg',
        }).then((jpegBlob) => {
          if (!jpegBlob) return;
          const expectedFilename = `widgets_${sizeLabel}_${bs.key}`;
          pushFile(`${expectedFilename}.jpg`, jpegBlob);
          pushLine(
            'info',
            `${expectedFilename}.jpg ${formatSizeText(timejpgWidth, timejpgHeight)}`,
          );
        });
      });
      await Promise.all(promislist);
    }

    const firstAnimationSource = data?.firstImageAnimation?.source;
    if (firstAnimationSource) {
      const firstAnimationBlob = await toPngBlobFromUrl(firstAnimationSource);
      pushFile(`widgets_${sizeLabel}_animation_first.png`, firstAnimationBlob);
    }

    const secondAnimationSource = data?.secondImageAnimation?.source;
    if (secondAnimationSource) {
      const secondAnimationBlob = await toPngBlobFromUrl(secondAnimationSource);
      pushFile(`widgets_${sizeLabel}_animation_second.png`, secondAnimationBlob);
    }

    const thirdImageAnimationSource = data?.thirdImageAnimation?.source;
    if (thirdImageAnimationSource) {
      const thirdAnimationBlob = await toPngBlobFromUrl(thirdImageAnimationSource);
      pushFile(`widgets_${sizeLabel}_animation_third.png`, thirdAnimationBlob);
    }

    const fourthImageAnimationSource = data?.fourthImageAnimation?.source;
    if (fourthImageAnimationSource) {
      const fourthAnimationBlob = await toPngBlobFromUrl(fourthImageAnimationSource);
      pushFile(`widgets_${sizeLabel}_animation_fourth.png`, fourthAnimationBlob);
    }

    const musicPlayerSource = data?.player?.source;
    if (musicPlayerSource) {
      const musicPlayerBlob = await toPngBlobFromUrl(musicPlayerSource);
      pushFile(`widgets_${sizeLabel}_music_player.png`, musicPlayerBlob);
    }
    if (Array.isArray(data?.appLinks) && data?.appLinksSource) {
      const appLinksSource = Array.isArray(data?.appLinksSource)
        ? data.appLinksSource
        : [];
      for (let appLinkIndex = 0; appLinkIndex < data.appLinks.length; appLinkIndex += 1) {
        const linkSource = appLinksSource[appLinkIndex]?.source;
        const filename = `link${sizeLabel}_${appLinkIndex + 1}.png`;
        if (!linkSource || typeof linkSource !== 'string') {
          pushLine('warning', `跳过 ${filename}（未找到 appLinksSource）`);
          continue;
        }
        try {
          const linkBlob = await toPngBlobFromUrl(linkSource);
          pushFile(filename, linkBlob);
        } catch {
          pushLine('warning', `跳过 ${filename}（资源下载失败）`);
        }
      }
    }
  }

  if (!files.length || (files.length === 1 && files[0].filename === 'widgets_spec.json')) {
    pushLine('warning', '没有可导出的文件');
    options?.onWarning?.('没有可导出的文件');
    return [];
  }

  pushLine('success', `Widget 资源收集完成，共 ${files.length} 个文件`);
  return files;
};

export const useWidgetExportBundle = (nodeId?: string) => {
  const nodes = useEditorNodes();
  const { elements, childNodes } = useNodeChildElements(nodeId);
  const [exporting, setExporting] = useState(false);

  const exportBundle = useCallback(async (options?: ExportBundleOptions) => {
    const pushLine = (level: ExportProgressLevel, text: string) => {
      options?.onProgressLine?.({ level, text });
    };

    if (!childNodes.length || !elements.length) {
      pushLine('warning', '未获取到可导出的子节点');
      options?.onWarning?.('未获取到可导出的子节点');
      return;
    }
    if (exporting) return;

    setExporting(true);
    try {
      const files = await collectWidgetExportFiles(nodes, nodeId, options);
      if (!files?.length) return;

      pushLine('info', '正在打包 zip...');
      const zip = new JSZip();
      for (const file of files) {
        zip.file(file.filename, file.blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `widgets-export-${Date.now()}.zip`);
      pushLine('success', '导出完成');
      options?.onSuccess?.('压缩包已下载');
    } catch (error) {
      console.warn('[useWidgetExportBundle] export failed:', error);
      pushLine('error', '导出失败');
      options?.onError?.('导出失败');
    } finally {
      setExporting(false);
    }
  }, [childNodes, elements, exporting, nodeId, nodes]);

  return {
    exporting,
    exportBundle,
  };
};
