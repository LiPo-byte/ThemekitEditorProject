import { useCallback, useState } from 'react';
import JSZip from 'jszip';
import { useEditorNodes } from '../context';
import { useNodeChildElements } from './useNodeChildElements';
import { cropMediaByUrl } from '../util/cropMediaByUrl';
import {
  generateElementPreview,
  isGifSource,
} from '../util/generateElementPreview';
import {
  CONFIG_SIZE_MAP,
  SOURCENAME_TYPE_WIDGET_MAP,
  TYPE_WIDGET_MAP,
  WIDGET_EXPORT_FILE_RULES,
  type WidgetExportMode,
  type WidgetPlatform,
  type WidgetSizeLabel,
} from '../widget/base-config';

type SizeLabel = WidgetSizeLabel;
export type ExportProgressLevel = 'info' | 'success' | 'warning' | 'error';
export type ExportProgressLine = {
  level: ExportProgressLevel;
  text: string;
};
type ExportBundleOptions = {
  onProgressLine?: (line: ExportProgressLine) => void;
  onWarning?: (text: string) => void;
  onSuccess?: (text: string) => void;
  onError?: (text: string) => void;
};

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
  ];
  const showKey = ['weekday', 'AmAndPm']
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

const resolvePlatform = (parentId: unknown): WidgetPlatform | null => {
  const value = String(parentId ?? '');
  if (value.endsWith('_ios')) return 'ios';
  if (value.endsWith('_android')) return 'android';
  return null;
};

const getExportRule = (params: {
  sizeLabel: SizeLabel;
  platform: WidgetPlatform | null;
  layoutType: number;
  mode: WidgetExportMode;
}) => {
  const { sizeLabel, platform, layoutType, mode } = params;

  if (platform) {
    const platformRules = WIDGET_EXPORT_FILE_RULES[platform];
    const byLayout = platformRules?.[layoutType]?.[sizeLabel]?.[mode];
    if (byLayout) return byLayout;
  }
  return WIDGET_EXPORT_FILE_RULES.default[sizeLabel][mode];
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
      pushLine('info', '开始导出资源...');
      const elementById = new Map<string, HTMLElement>();
      elements.forEach((element) => {
        const id = element.dataset.id;
        if (!id) return;
        elementById.set(id, element);
      });

      const zip = new JSZip();
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
      const type:any = selectedNodeData ? selectedNodeData.type : 1;
      zip.file('widgets_spec.json', JSON.stringify(widgetsSpec, null, 2));
      pushLine('success', '生成 widgets_spec.json');

      for (let index = 0; index < childNodes.length; index += 1) {
        const childNode = childNodes[index] as any;
        const childNodeId = String(childNode?.id ?? '');
        const targetElement = elementById.get(childNodeId) ?? null;
        if (!targetElement) continue;

        const data = (childNode?.data ?? {}) as any;
        const source = data?.source;
        // if (!source) continue;
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
          isGifSource(source)

        const sizeNumber = Number(data?.size ?? 0);
        const sizeLabel =
          SIZE_LABEL_MAP[sizeNumber] ?? `size_${sizeNumber || index + 1}`;
        const platform = resolvePlatform(childNode?.parentId);
        const layoutType = Number(data?.layoutType ?? 0);
        const fixedRule = SIZE_LABEL_MAP[sizeNumber]
          ? getExportRule({
              sizeLabel: SIZE_LABEL_MAP[sizeNumber],
              platform,
              layoutType,
              mode: data?.isGif ? 'dynamic' : 'static',
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
          //   const ext = isGif ? 'gif' : 'jpg';
          // const expectedFilename = `widgets_${sizeLabel}_${SOURCENAME_TYPE_WIDGET_MAP[type] || TYPE_WIDGET_MAP[type]}.${ext}`;
          const expectedFilename = `widgets_${sizeLabel}_${SOURCENAME_TYPE_WIDGET_MAP[type] || TYPE_WIDGET_MAP[type]}`;
          zip.file(`${expectedFilename}.jpg`, jpegBlob);
          pushLine(
            'success',
            `生成 ${expectedFilename}.jpg ${formatSizeText(timejpgWidth, timejpgHeight)}`,
          );
          if (gifBlob) {
            zip.file(`${expectedFilename}.gif`, gifBlob);
            pushLine(
              'success',
              `生成 ${expectedFilename}.gif ${formatSizeText(timegifWidth, timegifHeight)}`,
            );
          }
        }

        if (source) {
          // pushLine('warning', `跳过 widgets_${sizeLabel}_preview（未找到 source）`);
          const previewBlob = await generateElementPreview(targetElement, {
            isGif: isDynamic,
            sourceUrl: source,
            scale: EXPORT_PREVIEW_SCALE,
            jpegQuality: EXPORT_JPEG_QUALITY,
            outputWidth: previewWidth,
            outputHeight: previewHeight,
          });
          zip.file(`widgets_${sizeLabel}_preview.${isDynamic ? 'gif' : 'jpg'}`, previewBlob);
          pushLine(
            'success',
            `生成 widgets_${sizeLabel}_preview.gif ${formatSizeText(previewWidth, previewHeight)}`,
          );
        }

        if (batterySources.length) {
          const previewBlob = await generateElementPreview(targetElement, {
            isGif: true,
            fps: 1,
            durationMs: batterySources.length * 1000,
            scale: EXPORT_PREVIEW_SCALE,
            outputWidth: previewWidth,
            outputHeight: previewHeight,
          });
          zip.file(`widgets_${sizeLabel}_preview.gif`, previewBlob);
          pushLine(
            'success',
            `生成 widgets_${sizeLabel}_preview.gif ${formatSizeText(previewWidth, previewHeight)}`,
          );
          const promislist = batteryEntries.map((bs: any) => {
            return toPngBlobFromUrl(bs.source, { width: timejpgWidth, height: timejpgHeight, mimeType: 'image/jpeg' }).then(jpegBlob => {
              if (!jpegBlob) return;
              const expectedFilename = `widgets_${sizeLabel}_${bs.key}`;
              zip.file(`${expectedFilename}.jpg`, jpegBlob);
              pushLine(
                'success',
                `生成 ${expectedFilename}.jpg ${formatSizeText(timejpgWidth, timejpgHeight)}`,
              );
            })
          })
          await Promise.all(promislist);
        }


        const firstAnimationSource = data?.firstImageAnimation?.source;
        if (firstAnimationSource) {
          const firstAnimationBlob = await toPngBlobFromUrl(firstAnimationSource);
          zip.file(
            `widgets_${sizeLabel}_animation_first.png`,
            firstAnimationBlob,
          );
          pushLine('success', `生成 widgets_${sizeLabel}_animation_first.png`);
        }


        const secondAnimationSource = data?.secondImageAnimation?.source;
        if (secondAnimationSource) {
          const secondAnimationBlob = await toPngBlobFromUrl(secondAnimationSource);
          zip.file(
            `widgets_${sizeLabel}_animation_second.png`,
            secondAnimationBlob,
          );
          pushLine('success', `生成 widgets_${sizeLabel}_animation_second.png`);
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
              zip.file(filename, linkBlob);
              pushLine('success', `生成 ${filename}`);
            } catch {
              pushLine('warning', `跳过 ${filename}（资源下载失败）`);
            }
          }
        }
      }

      const fileCount = Object.keys(zip.files).length;
      if (!fileCount || (fileCount === 1 && zip.files['widgets_spec.json'])) {
        pushLine('warning', '没有可导出的文件');
        options?.onWarning?.('没有可导出的文件');
        return;
      }

      pushLine('info', '正在打包 zip...');
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
