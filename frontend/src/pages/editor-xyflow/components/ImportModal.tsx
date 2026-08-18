import React from 'react';
import { InboxOutlined } from '@ant-design/icons';
import {
  useEditorAddIconPack,
  useEditorAddTheme,
  useEditorAddWidget,
  useEditorAddWallpaper,
  useEditorGlobalLoadingSetter,
  useEditorProjectId,
} from '../context';
import { Button, message, Segmented, Select, Upload, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { CONFIG_SIZE_MAP, DEFAULT_CROP_PROPS, DEFAULT_RADIUS, SIZE_LABEL_MAP, SOURCENAME_TYPE_WIDGET_MAP, TYPE_WIDGET_MAP } from '../widget/base-config';
import JSZip from 'jszip';
import { uploadProjectFile, uploadProjectImage } from '../service';
import {
  DEFAULT_THEME_CONFIG,
  IconPackDefaultConfig,
  WallpaperDefaultConfig,
} from '@/editor-core/defaultConfig';

const useStyles = createStyles(({ token, css }) => ({
  panel: css`
    position: absolute;
    right: 24%;
    bottom: 52px;
    transform: translateX(-50%);
    width: 300px;
    border-radius: 12px;
    box-shadow: ${token.boxShadowSecondary};
    background: ${token.colorBgElevated}f2;
    backdrop-filter: blur(14px);
    z-index: 31;
    transition: transform 260ms ease, opacity 220ms ease;
    padding: 8px;
    color: ${token.colorTextSecondary};
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  title: css`
    margin: 0;
    color: ${token.colorText};
  `,
  panelClosed: css`
    transform: translateX(-50%) translateY(30px);
    opacity: 0;
    pointer-events: none;
  `,
  themeMeta: css`
    font-size: 12px;
    line-height: 1.5;
    color: ${token.colorTextSecondary};
  `,
  widgetRow: css`
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    border-radius: 8px;
    background: ${token.colorFillQuaternary};
  `,
  widgetRowTitle: css`
    font-size: 12px;
    color: ${token.colorText};
  `,
}));

type Props = {
  open: boolean;
  onClose: () => void;
};
type ImportSystem = 'ios' | 'android' | 'common';
type ImportKind = 'widget' | 'iconPack' | 'wallpaper' | 'photo_shuffles' | 'theme' | 'wallpaper_depth' | 'live_wallpaper';
/** null = 无后缀（单套）；number = 导出时的 _1/_2 … */
type ExportIndex = number | null;

type ThemePendingImport = {
  zip: JSZip;
  fileName: string;
  hasIconPack: boolean;
  wallpaperIndices: ExportIndex[];
  widgetIndices: ExportIndex[];
  widgetSystems: ImportSystem[];
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 与导出 withExportIndex 对齐：有 index 时在扩展名前加 _N */
const applyIndexSuffix = (filename: string, index: ExportIndex): string => {
  if (index == null) return filename;
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return `${filename}_${index}`;
  return `${filename.slice(0, dot)}_${index}${filename.slice(dot)}`;
};

const listZipBasenames = (zip: JSZip): string[] =>
  Object.keys(zip.files)
    .filter((path) => !zip.files[path]?.dir)
    .map((path) => path.split('/').pop() || '')
    .filter(Boolean);

/** 发现 widgets_spec.json / widgets_spec_1.json … */
const discoverWidgetIndices = (zip: JSZip): ExportIndex[] => {
  const indices = new Set<number>();
  let hasPlain = false;
  for (const name of listZipBasenames(zip)) {
    const match = /^widgets_spec(?:_(\d+))?\.json$/i.exec(name);
    if (!match) continue;
    if (match[1]) indices.add(Number(match[1]));
    else hasPlain = true;
  }
  if (indices.size > 0) return [...indices].sort((a, b) => a - b);
  if (hasPlain) return [null];
  return [];
};

/** 发现 wallpaper / wallpaper_ipad 的 _N 分组 */
const discoverWallpaperIndices = (zip: JSZip): ExportIndex[] => {
  const indices = new Set<number>();
  let hasPlain = false;
  for (const name of listZipBasenames(zip)) {
    const match =
      /^(wallpaper(?:_ipad)?)(?:_(\d+))?\.(?:jpg|jpeg|png)$/i.exec(name);
    if (!match) continue;
    if (match[2]) indices.add(Number(match[2]));
    else hasPlain = true;
  }
  const sorted = [...indices].sort((a, b) => a - b);
  // 无后缀的自成一套：与 _N 同时存在时不能被顶掉，否则这套会被静默丢弃
  return hasPlain ? [null, ...sorted] : sorted;
};

/** Wallpaper Depth 压缩包必须包含的图片（不含扩展名） */
const WALLPAPER_DEPTH_REQUIRED = ['wallpaper', 'wallpaper_depth_preview'];

/** 与后端 upload-file 的 MIME 白名单对齐 */
const LIVE_WALLPAPER_MIME_MAP: Record<string, string> = {
  mov: 'video/quicktime',
  mp4: 'video/mp4',
};

const hasIconPackAssets = (zip: JSZip): boolean =>
  listZipBasenames(zip).some((name) => /^icon_.+\.(?:jpg|jpeg|png)$/i.test(name));

/** iconpack 预览面图：导出为 icons_{key}.{ext}，外部包扩展名不固定，按顺序试 */
const ICONPACK_SURFACE_IMAGES: Array<{ key: string; exts: string[] }> = [
  { key: 'list_view', exts: ['png', 'jpg', 'jpeg'] },
  { key: 'preview_long', exts: ['jpg', 'jpeg', 'png'] },
  { key: 'preview_short', exts: ['jpg', 'jpeg', 'png'] },
];

/** theme 预览面图：zip 内直接以 config key 命名，无 icons_ 前缀 */
const THEME_SURFACE_KEYS = [
  'preview_long',
  'preview_short',
  'list_view',
  'preview_long_ipad',
  'list_view_ipad',
];
// 导出按上传内容定扩展名，这里要覆盖同一组格式
const THEME_SURFACE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

const resolveAmazonApp = (apps: any): Record<string, any> | null => {
  if (Array.isArray(apps)) {
    return (
      apps.find((app) => String(app?.name ?? app?.key ?? '').toLowerCase() === 'amazon') ?? null
    );
  }
  if (!apps || typeof apps !== 'object') return null;
  if (apps.amazon && typeof apps.amazon === 'object') {
    return { key: 'amazon', name: 'amazon', ...apps.amazon };
  }
  const entry = Object.entries(apps).find(
    ([key, value]) =>
      String(key).toLowerCase() === 'amazon' ||
      String((value as any)?.name ?? '').toLowerCase() === 'amazon',
  );
  if (!entry) return null;
  const [key, value] = entry;
  if (value && typeof value === 'object') {
    return { key, name: String((value as any).name ?? key), ...(value as any) };
  }
  return { key, name: key, source: String(value ?? '') };
};

/** 与 AddThemeModal 一致：用已导入节点 config 拼 showElements */
const buildThemeShowElements = (params: {
  iconPackId: string;
  iconPackConfig: Record<string, any>;
  wallpaperItems: Array<{ id: string; config: Record<string, any> }>;
  widgetItems: Array<{ id: string; system: ImportSystem; config: Record<string, any> }>;
}) => {
  const showElements: Array<Record<string, any>> = [];
  const firstWallpaper = params.wallpaperItems[0];
  const wallpaperData = firstWallpaper?.config?.wallpaper;
  if (firstWallpaper && wallpaperData) {
    showElements.push({
      key: `${firstWallpaper.id}_wallpaper`,
      category: 'wallpaper',
      data: { ...wallpaperData },
    });
  }

  params.widgetItems.forEach((item) => {
    const selectionKey = `${item.id},${item.system}`;
    const platformConfig = item.config?.[item.system];
    if (!platformConfig) return;
    const sizeItem = (platformConfig.sizes || []).find(
      (entry: any) => Number(entry?.size) === 1,
    );
    if (!sizeItem) return;
    showElements.push({
      key: `${selectionKey}_size_1`,
      category: 'widget',
      data: {
        ...platformConfig,
        sizes: [{ ...sizeItem }],
      },
    });
  });

  const amazon = resolveAmazonApp(params.iconPackConfig?.apps);
  if (amazon) {
    showElements.push({
      key: `${params.iconPackId}_Amazon`,
      category: 'iconpack',
      data: { ...amazon },
    });
  }
  return showElements;
};

const getBlobImageSize = (blob: Blob) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      URL.revokeObjectURL(objectUrl);
      if (!width || !height) {
        reject(new Error('图片宽高无效'));
        return;
      }
      resolve({ width, height });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('图片解析失败'));
    };
    image.src = objectUrl;
  });

const ImportModal: React.FC<Props> = ({ open, onClose }) => {
  const { styles } = useStyles();
  const addWidget = useEditorAddWidget();
  const addIconPack = useEditorAddIconPack();
  const addWallpaper = useEditorAddWallpaper();
  const addTheme = useEditorAddTheme();
  const setGlobalLoading = useEditorGlobalLoadingSetter();
  const projectId = useEditorProjectId();
  const [importKind, setImportKind] = React.useState<ImportKind>('widget');
  const [importSystem, setImportSystem] = React.useState<ImportSystem>('common');
  const [themePending, setThemePending] = React.useState<ThemePendingImport | null>(
    null,
  );
  const [themeImporting, setThemeImporting] = React.useState(false);

  const withImportLoading = async <T,>(task: () => Promise<T>): Promise<T> => {
    setGlobalLoading(true);
    try {
      return await task();
    } finally {
      setGlobalLoading(false);
    }
  };

  const clearThemePending = React.useCallback(() => {
    setThemePending(null);
    setThemeImporting(false);
  }, []);

  React.useEffect(() => {
    if (!open) clearThemePending();
  }, [open, clearThemePending]);

  const handleImportKindChange = (value: ImportKind) => {
    setImportKind(value);
    if (value === 'live_wallpaper') {
      setImportSystem('ios');
    }
    clearThemePending();
  };

  const uploadMediaFromZip = async (
    filename: string,
    zip: JSZip,
    exportIndex: ExportIndex = null,
  ) => {
    if (!projectId) {
      throw new Error('项目未初始化，无法上传资源');
    }
    const resolvedFilename = applyIndexSuffix(filename, exportIndex);
    const mediaFile =
      zip.file(resolvedFilename) ??
      zip.file(new RegExp(`(^|\\/)${escapeRegExp(resolvedFilename)}$`, 'i'))?.[0];
    if (!mediaFile) return null;
    const mediaBlob = await mediaFile.async('blob');
    const fileExt = resolvedFilename.split('.').pop()?.toLowerCase();
    const mimeType = fileExt ? `image/${fileExt}` : 'application/octet-stream';
    const uploadFile = new File([mediaBlob], resolvedFilename, { type: mimeType });
    const { url } = await uploadProjectImage(projectId, uploadFile);
    return { url, mediaBlob };
  };

  /** 视频单独走 upload-file，upload-image 的白名单不接受 mov/mp4 */
  const uploadVideoFromZip = async (filename: string, zip: JSZip) => {
    if (!projectId) {
      throw new Error('项目未初始化，无法上传资源');
    }
    const videoFile =
      zip.file(filename) ??
      zip.file(new RegExp(`(^|\\/)${escapeRegExp(filename)}$`, 'i'))?.[0];
    if (!videoFile) return null;
    const videoBlob = await videoFile.async('blob');
    const fileExt = filename.split('.').pop()?.toLowerCase() || '';
    const mimeType =
      LIVE_WALLPAPER_MIME_MAP[fileExt] || 'application/octet-stream';
    const uploadFile = new File([videoBlob], filename, { type: mimeType });
    const { url } = await uploadProjectFile(projectId, uploadFile);
    return { url };
  };

  /** 从已加载 zip 解析一套 widget；成功返回节点 id + config */
  const importWidgetFromZip = async (
    zip: JSZip,
    options?: {
      exportIndex?: ExportIndex;
      system?: ImportSystem;
      silent?: boolean;
    },
  ): Promise<{ rootId: string; config: Record<string, any>; system: ImportSystem } | null> => {
    const exportIndex = options?.exportIndex ?? null;
    const system = options?.system ?? importSystem;
    const silent = Boolean(options?.silent);

    const specFilename = applyIndexSuffix('widgets_spec.json', exportIndex);
    const specFile =
      zip.file(specFilename) ??
      zip.file(new RegExp(`(^|\\/)${escapeRegExp(specFilename)}$`, 'i'))?.[0];
    if (!specFile) {
      if (!silent) message.error(`压缩包内未找到 ${specFilename}`);
      return null;
    }

    const specText = await specFile.async('string');
    const spec = JSON.parse(specText);
    const { sizes, isGif, type } = spec;
    if (!Array.isArray(sizes)) {
      if (!silent) message.error(`${specFilename} 缺少 sizes 数组`);
      return null;
    }

    if (type === 12) {
      const weatherImageEntries = [
        { key: 'cloud', field: 'imageCloud' },
        { key: 'rain', field: 'imageRain' },
        { key: 'snow', field: 'imageSnow' },
        { key: 'sun', field: 'imageSun' },
        { key: 'thunder', field: 'imageThunder' },
        { key: 'wind', field: 'imageWind' },
      ];
      for (let index = 0; index < weatherImageEntries.length; index += 1) {
        const { key, field } = weatherImageEntries[index];
        const filenameBase = `image_${key}`;
        const candidateFilenames = [
          `${filenameBase}.png`,
          `${filenameBase}.jpg`,
          `${filenameBase}.jpeg`,
        ];
        let uploadResult: Awaited<ReturnType<typeof uploadMediaFromZip>> = null;
        for (const filename of candidateFilenames) {
          uploadResult = await uploadMediaFromZip(filename, zip, exportIndex);
          if (uploadResult) break;
        }
        if (!uploadResult) {
          if (!silent) message.warning(`压缩包缺少 ${applyIndexSuffix(`${filenameBase}.png`, exportIndex)}`);
          spec[field] = {
            source: '',
            crop_props: {
              ...DEFAULT_CROP_PROPS,
            },
          };
          continue;
        }
        spec[field] = {
          source: uploadResult.url,
          crop_props: {
            ...DEFAULT_CROP_PROPS,
          },
        };
      }
    }
    // Clock layout 1 与 type 18 共用同一套指针字段，但没有大小刻度盘
    const isPointerClock = type === 3 && Number(sizes?.[0]?.layoutType) === 1;
    if (type === 18 || isPointerClock) {
      const clockImageEntries = [
        { key: 'minute_clock', field: 'minuteClock' },
        { key: 'hour_clock', field: 'hourClock' },
        { key: 'dot_clock', field: 'dotClock' },
        ...(isPointerClock
          ? []
          : [
              { key: 'dial_large_clock', field: 'dialLargeClock' },
              { key: 'dial_small_clock', field: 'dialSmallClock' },
            ]),
      ];
      for (let index = 0; index < clockImageEntries.length; index += 1) {
        const { key, field } = clockImageEntries[index];
        const filenameBase = `widgets_${key}`;
        const candidateFilenames = [
          `${filenameBase}.png`,
          `${filenameBase}.jpg`,
          `${filenameBase}.jpeg`,
        ];
        let uploadResult: Awaited<ReturnType<typeof uploadMediaFromZip>> = null;
        for (const filename of candidateFilenames) {
          uploadResult = await uploadMediaFromZip(filename, zip, exportIndex);
          if (uploadResult) break;
        }
        if (!uploadResult) {
          // 指针图缺失对 layout 1 是正常情况（组件会回退到内置素材），补空字段让右侧面板仍能上传
          if (isPointerClock) {
            spec[field] = {
              source: '',
              crop_props: {
                ...DEFAULT_CROP_PROPS,
              },
            };
            continue;
          }
          if (!silent) message.warning(`压缩包缺少 ${applyIndexSuffix(`${filenameBase}.png`, exportIndex)}`);
          continue;
        }
        spec[field] = {
          source: uploadResult.url,
          crop_props: {
            ...DEFAULT_CROP_PROPS,
          },
        };
      }
    }
    if (type === 17) {
      // music 挂在 platform 级，导出的 spec.json 里被整个剔除，且封面图不进包，
      // 这里补一份默认值：source 留空让组件回退到内置封面，右侧面板也能再上传
      spec.music = {
        source: '',
        singer: spec.music?.singer ?? 'Michael Jackson',
        songName: spec.music?.songName ?? 'Billie Jean',
        crop_props: {
          ...DEFAULT_CROP_PROPS,
          ...(spec.music?.crop_props ?? {}),
        },
      };

      // player 图挂在各尺寸配置下（只有 medium/large 有），现在导出统一是
      // widgets_{size}_music_player.png，旧包用的 widgets_{size}_player.png 继续兜底
      for (let index = 0; index < sizes.length; index += 1) {
        const item = sizes[index] as Record<string, any>;
        const sizeLabel = SIZE_LABEL_MAP[Number(item?.size)];
        if (!sizeLabel) continue;
        const hasPlayerSource = Object.hasOwn(item?.player ?? {}, 'source');
        const candidateFilenames = [
          `widgets_${sizeLabel}_music_player.png`,
          `widgets_${sizeLabel}_player.png`,
        ];
        let uploadResult: Awaited<ReturnType<typeof uploadMediaFromZip>> = null;
        for (const filename of candidateFilenames) {
          uploadResult = await uploadMediaFromZip(filename, zip, exportIndex);
          if (uploadResult) break;
        }
        if (!uploadResult) {
          // small 本来就没有 player 图，只有声明了 source 的尺寸缺图才值得提示
          if (hasPlayerSource && !silent) {
            message.warning(
              `压缩包缺少 ${applyIndexSuffix(`widgets_${sizeLabel}_music_player.png`, exportIndex)}`,
            );
          }
          continue;
        }
        item.player = {
          ...(item.player ?? {}),
          source: uploadResult.url,
          crop_props: {
            ...DEFAULT_CROP_PROPS,
            ...(item.player?.crop_props ?? {}),
          },
        };
      }
    }

    for (let i = 0; i < sizes.length; i += 1) {
      const item = sizes[i] as Record<string, any>;
      const sizeNumber = Number(item?.size);
      const sizeLabel = SIZE_LABEL_MAP[sizeNumber];
      if (!sizeLabel) continue;

      const filenameBase = `widgets_${sizeLabel}_${SOURCENAME_TYPE_WIDGET_MAP[type] || TYPE_WIDGET_MAP[type]}`;
      // 底图导出是 jpg，但外部给的包也可能是 png，按顺序试
      const candidateExts = isGif ? ['gif'] : ['jpg', 'png'];
      let uploadResult: Awaited<ReturnType<typeof uploadMediaFromZip>> = null;
      for (const candidateExt of candidateExts) {
        uploadResult = await uploadMediaFromZip(
          `${filenameBase}.${candidateExt}`,
          zip,
          exportIndex,
        );
        if (uploadResult) break;
      }
      if (uploadResult) {
        const mediaSize = await getBlobImageSize(uploadResult.mediaBlob);
        const targetSize =
          (CONFIG_SIZE_MAP as Record<number, { width?: number; height?: number }>)[
            sizeNumber
          ] ?? {};
        const targetWidth = Number(targetSize.width);
        const targetHeight = Number(targetSize.height);
        const scaleX =
          Number.isFinite(targetWidth) && targetWidth > 0
            ? targetWidth / mediaSize.width
            : 1;
        const scaleY =
          Number.isFinite(targetHeight) && targetHeight > 0
            ? targetHeight / mediaSize.height
            : 1;
        item.source = uploadResult.url;
        item.crop_props = {
          ...DEFAULT_CROP_PROPS,
          ...(item.crop_props ?? {}),
          scaleX,
          scaleY,
        };
      }
      if (typeof item.radius !== 'number') {
        item.radius = DEFAULT_RADIUS;
      }

      if (item.firstImageAnimation) {
        const filename = `widgets_${sizeLabel}_animation_first.png`;
        const animUpload = await uploadMediaFromZip(filename, zip, exportIndex);
        if (!animUpload) {
          if (!silent) message.warning(`压缩包缺少 ${applyIndexSuffix(filename, exportIndex)}`);
          continue;
        }
        item.firstImageAnimation.source = animUpload.url;
        item.firstImageAnimation.crop_props = {
          ...DEFAULT_CROP_PROPS,
        };
      }
      if (item.secondImageAnimation) {
        const filename = `widgets_${sizeLabel}_animation_second.png`;
        const animUpload = await uploadMediaFromZip(filename, zip, exportIndex);
        if (!animUpload) {
          if (!silent) message.warning(`压缩包缺少 ${applyIndexSuffix(filename, exportIndex)}`);
          continue;
        }
        item.secondImageAnimation.source = animUpload.url;
        item.secondImageAnimation.crop_props = {
          ...DEFAULT_CROP_PROPS,
        };
      }
      if (item.thirdImageAnimation) {
        const filename = `widgets_${sizeLabel}_animation_third.png`;
        const animUpload = await uploadMediaFromZip(filename, zip, exportIndex);
        if (!animUpload) {
          if (!silent) message.warning(`压缩包缺少 ${applyIndexSuffix(filename, exportIndex)}`);
          continue;
        }
        item.thirdImageAnimation.source = animUpload.url;
        item.thirdImageAnimation.crop_props = {
          ...DEFAULT_CROP_PROPS,
        };
      }
      if (item.fourthImageAnimation) {
        const filename = `widgets_${sizeLabel}_animation_fourth.png`;
        const animUpload = await uploadMediaFromZip(filename, zip, exportIndex);
        if (!animUpload) {
          if (!silent) message.warning(`压缩包缺少 ${applyIndexSuffix(filename, exportIndex)}`);
          continue;
        }
        item.fourthImageAnimation.source = animUpload.url;
        item.fourthImageAnimation.crop_props = {
          ...DEFAULT_CROP_PROPS,
        };
      }
      if (item.appLinks && Array.isArray(item.appLinks) && item.layoutType < 5 && type === 14) {
        const existingAppLinksSource = Array.isArray(item.appLinksSource)
          ? item.appLinksSource
          : [];
        const appLinksSource = await Promise.all(
          item.appLinks.map(async (_links: any, index: number) => {
            const filenameBase = `link${sizeLabel}_${index + 1}`;
            const candidateFilenames = [
              `${filenameBase}.png`,
              `${filenameBase}.jpg`,
              `${filenameBase}.jpeg`,
            ];
            let linkUpload: Awaited<ReturnType<typeof uploadMediaFromZip>> = null;
            for (const filename of candidateFilenames) {
              linkUpload = await uploadMediaFromZip(filename, zip, exportIndex);
              if (linkUpload) break;
            }
            if (!linkUpload) {
              if (!silent) {
                message.warning(
                  `压缩包缺少 ${applyIndexSuffix(`${filenameBase}.png`, exportIndex)}`,
                );
              }
              return {
                ...(existingAppLinksSource[index] ?? {}),
                source: existingAppLinksSource[index]?.source ?? '',
              };
            }
            return {
              ...(existingAppLinksSource[index] ?? {}),
              source: linkUpload.url,
            };
          }),
        );
        item.appLinksSource = appLinksSource;
      }
      if (item.weekday) {
        item.weekday.show = true;
      }
      if (item.AmAndPm) {
        item.AmAndPm.show = true;
      }

      if (type === 5 && item.layoutType === 0) {
        const batterSource = [
          'battery_20',
          'battery_40',
          'battery_60',
          'battery_80',
          'battery_100',
        ];
        await Promise.all(
          batterSource.map(async (key: any) => {
            const filenameBase = `widgets_${sizeLabel}_${key}`;
            const candidateFilenames = [
              `${filenameBase}.png`,
              `${filenameBase}.jpg`,
              `${filenameBase}.jpeg`,
            ];
            let batteryUpload: Awaited<ReturnType<typeof uploadMediaFromZip>> = null;
            for (const filename of candidateFilenames) {
              batteryUpload = await uploadMediaFromZip(filename, zip, exportIndex);
              if (batteryUpload) break;
            }
            if (!batteryUpload && !silent) {
              message.warning(
                `压缩包缺少 ${applyIndexSuffix(`${filenameBase}.png`, exportIndex)}`,
              );
            }
            item[key] = {
              crop_props: {
                ...DEFAULT_CROP_PROPS,
              },
              source: batteryUpload ? batteryUpload.url : '',
            };
          }),
        );
      }
    }

    const importConfig: Record<string, any> = {};
    importConfig[system] = spec;
    const rootId = addWidget(importConfig);
    if (!rootId) return null;
    return { rootId, config: importConfig, system };
  };

  const readWidgetsSpecFromZip = async (file: File) => {
    const isZipFile =
      file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip');
    if (!isZipFile) {
      message.error('仅支持上传 zip 压缩包');
      return false;
    }

    return withImportLoading(async () => {
      try {
        if (!projectId) {
          message.error('项目未初始化，无法上传资源');
          return false;
        }
        const zip = await JSZip.loadAsync(file);
        const result = await importWidgetFromZip(zip);
        if (result) {
          onClose();
          message.success('导入成功');
        }
      } catch (error) {
        console.error('[ImportModal] 读取 widgets_spec.json 失败:', error);
        message.error('读取 widgets_spec.json 失败');
      }
      return false;
    });
  };

  /**
   * 深拷贝 IconPackDefaultConfig，按 apps key 在 zip 里找 icon_{key}.jpg/png 上传填 url；
   * 找不到则 source 置空。预览面另取 icons_{key}.{ext} 填进对应 surface.source。
   */
  const importIconPackFromZip = async (
    zip: JSZip,
    options?: { silent?: boolean },
  ): Promise<{ rootId: string; config: Record<string, any>; uploadedCount: number } | null> => {
    const silent = Boolean(options?.silent);
    const config = structuredClone(IconPackDefaultConfig) as typeof IconPackDefaultConfig;
    const apps = config.apps as Record<string, { source?: string; [key: string]: any }>;
    let uploadedCount = 0;

    for (const key of Object.keys(apps)) {
      const app = apps[key];
      if (!app || typeof app !== 'object') continue;

      const candidates = [
        `icon_${key}.jpg`,
        `icon_${key}.jpeg`,
        `icon_${key}.png`,
      ];
      let uploadResult: Awaited<ReturnType<typeof uploadMediaFromZip>> = null;
      for (const filename of candidates) {
        uploadResult = await uploadMediaFromZip(filename, zip);
        if (uploadResult) break;
      }

      if (uploadResult) {
        app.source = uploadResult.url;
        uploadedCount += 1;
      } else {
        app.source = '';
      }
    }

    if (uploadedCount === 0) {
      if (!silent) message.error('压缩包内未找到 icon 资源');
      return null;
    }

    // 预览面不再按选中元素拼装，直接用包里的成品图
    const missingSurfaces: string[] = [];
    for (const { key, exts } of ICONPACK_SURFACE_IMAGES) {
      const surface = (config as Record<string, any>)[key];
      if (!surface || typeof surface !== 'object') continue;

      let surfaceUpload: Awaited<ReturnType<typeof uploadMediaFromZip>> = null;
      for (const ext of exts) {
        surfaceUpload = await uploadMediaFromZip(`icons_${key}.${ext}`, zip);
        if (surfaceUpload) break;
      }
      if (surfaceUpload) {
        surface.source = surfaceUpload.url;
      } else {
        missingSurfaces.push(`icons_${key}.${exts[0]}`);
      }
    }
    if (missingSurfaces.length && !silent) {
      message.warning(`压缩包缺少预览图：${missingSurfaces.join('、')}`);
    }

    const rootId = addIconPack(config);
    if (!rootId) return null;
    return { rootId, config, uploadedCount };
  };

  const readIconPackFromZip = async (file: File) => {
    const isZipFile =
      file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip');
    if (!isZipFile) {
      message.error('仅支持上传 zip 压缩包');
      return false;
    }

    return withImportLoading(async () => {
      try {
        if (!projectId) {
          message.error('项目未初始化，无法上传资源');
          return false;
        }

        const zip = await JSZip.loadAsync(file);
        const result = await importIconPackFromZip(zip);
        if (result) {
          onClose();
          message.success(`IconPack 导入成功（上传 ${result.uploadedCount} 个）`);
        }
      } catch (error) {
        console.error('[ImportModal] iconpack 导入失败:', error);
        message.error('iconpack 导入失败');
      }
      return false;
    });
  };

  /**
   * 优先读 wallpaper_spec.json；没有则用 defaultConfig。
   * 按各尺寸 name/key 在 zip 里找 {name}.{ext|jpg|png} 上传填 url。
   */
  const importWallpaperFromZip = async (
    zip: JSZip,
    options?: {
      exportIndex?: ExportIndex;
      silent?: boolean;
      defaultConfig?: Record<string, any>;
      emptyWarning?: string;
    },
  ): Promise<{ rootId: string; config: Record<string, any>; uploadedCount: number } | null> => {
    const exportIndex = options?.exportIndex ?? null;
    const silent = Boolean(options?.silent);
    const emptyWarning = options?.emptyWarning || '该套 wallpaper 未找到可用图片';

    const specFilename = applyIndexSuffix('wallpaper_spec.json', exportIndex);
    const specFile =
      zip.file(specFilename) ??
      zip.file(new RegExp(`(^|\\/)${escapeRegExp(specFilename)}$`, 'i'))?.[0] ??
      (exportIndex == null
        ? zip.file(/(^|\/)wallpaper_spec\.json$/i)?.[0]
        : undefined);

    let config: Record<string, any> = structuredClone(
      options?.defaultConfig ?? WallpaperDefaultConfig.Wallpaper,
    ) as Record<string, any>;

    if (specFile) {
      try {
        const specText = await specFile.async('string');
        const parsed = JSON.parse(specText);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          config = parsed;
        }
      } catch (error) {
        console.warn('[ImportModal] wallpaper_spec.json 解析失败，使用默认配置:', error);
      }
    }

    let uploadedCount = 0;
    for (const key of Object.keys(config)) {
      const item = config[key];
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;

      const nameToken = String(item.name || key || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_\-]/g, '');
      const preferredExt = String(item.ext ?? '')
        .trim()
        .toLowerCase()
        .replace(/^\./, '');
      const candidates = [
        ...(preferredExt
          ? [`${nameToken}.${preferredExt}`, `${key}.${preferredExt}`]
          : []),
        `${nameToken}.jpg`,
        `${nameToken}.jpeg`,
        `${nameToken}.png`,
        `${key}.jpg`,
        `${key}.jpeg`,
        `${key}.png`,
      ].filter(Boolean);

      let uploadResult: Awaited<ReturnType<typeof uploadMediaFromZip>> = null;
      for (const filename of candidates) {
        uploadResult = await uploadMediaFromZip(filename, zip, exportIndex);
        if (uploadResult) break;
      }

      if (uploadResult) {
        item.source = uploadResult.url;
        item.crop_props = item.crop_props || DEFAULT_CROP_PROPS;
        uploadedCount += 1;
      } else {
        item.source = '';
      }

      item.name = item.name || key;
      item.width = Number(item.width) > 0 ? Number(item.width) : undefined;
      item.height = Number(item.height) > 0 ? Number(item.height) : undefined;
    }

    if (uploadedCount === 0) {
      if (!silent) message.warning(emptyWarning);
      return null;
    }

    const rootId = addWallpaper(config);
    if (!rootId) return null;
    return { rootId, config, uploadedCount };
  };

  /**
   * Photo Shuffles：默认用 WallpaperDefaultConfig['Photo Shuffles']
   * 期望 zip 内含 wallpaper_1~5 / wallpaper_ipad_1~5，以及可选 preview png。
   */
  const importPhotoShufflesFromZip = async (
    zip: JSZip,
    options?: { silent?: boolean },
  ): Promise<{ rootId: string; config: Record<string, any>; uploadedCount: number } | null> =>
    importWallpaperFromZip(zip, {
      silent: options?.silent,
      defaultConfig: WallpaperDefaultConfig['Photo Shuffles'] as Record<string, any>,
      emptyWarning:
        '该套 Photo Shuffles 未找到可用图片（需 wallpaper_1~5 / wallpaper_ipad_1~5 等）',
    });

  /**
   * Wallpaper Depth：默认用 WallpaperDefaultConfig['Wallpaper Depth']
   * 期望 zip 内含 wallpaper 与 wallpaper_depth_preview 两张图。
   */
  const importWallpaperDepthFromZip = async (
    zip: JSZip,
    options?: { silent?: boolean },
  ): Promise<{ rootId: string; config: Record<string, any>; uploadedCount: number } | null> =>
    importWallpaperFromZip(zip, {
      silent: options?.silent,
      defaultConfig: WallpaperDefaultConfig['Wallpaper Depth'] as Record<string, any>,
      emptyWarning:
        '该套 Wallpaper Depth 未找到可用图片（需 wallpaper / wallpaper_depth_preview）',
    });

  /**
   * Live Wallpaper：按平台取 mov(iOS) / mp4(Android) 默认配置，
   * 在 zip 里找导出时写入的 live_wallpaper.{mov|mp4}，上传后填 movsource / mp4source。
   */
  const importLiveWallpaperFromZip = async (
    zip: JSZip,
    options?: { system?: ImportSystem; silent?: boolean },
  ): Promise<{ rootId: string; config: Record<string, any> } | null> => {
    const system = options?.system ?? importSystem;
    const silent = Boolean(options?.silent);
    const isAndroid = system === 'android';
    const ext = isAndroid ? 'mp4' : 'mov';
    const sourceField = isAndroid ? 'mp4source' : 'movsource';
    const config = structuredClone(
      isAndroid
        ? WallpaperDefaultConfig['Live Wallpaper Android']
        : WallpaperDefaultConfig['Live Wallpaper IOS'],
    ) as Record<string, any>;

    let uploaded = false;
    for (const key of Object.keys(config)) {
      const item = config[key];
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;

      // 导出固定写 live_wallpaper.{ext}，另外兼容按 config name / key 命名的包
      const candidates = [
        `live_wallpaper.${ext}`,
        ...(item.name ? [`${item.name}.${ext}`] : []),
        `${key}.${ext}`,
      ];
      let uploadResult: Awaited<ReturnType<typeof uploadVideoFromZip>> = null;
      for (const filename of candidates) {
        uploadResult = await uploadVideoFromZip(filename, zip);
        if (uploadResult) break;
      }

      if (uploadResult) {
        item[sourceField] = uploadResult.url;
        uploaded = true;
      } else {
        item[sourceField] = '';
      }
    }

    if (!uploaded) {
      if (!silent) message.error(`压缩包内未找到 live_wallpaper.${ext}`);
      return null;
    }

    const rootId = addWallpaper(config);
    if (!rootId) return null;
    return { rootId, config };
  };

  const readWallpaperFromZip = async (file: File) => {
    const isZipFile =
      file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip');
    if (!isZipFile) {
      message.error('仅支持上传 zip 压缩包');
      return false;
    }

    return withImportLoading(async () => {
      try {
        if (!projectId) {
          message.error('项目未初始化，无法上传资源');
          return false;
        }

        const zip = await JSZip.loadAsync(file);
        const result = await importWallpaperFromZip(zip);
        if (result) {
          onClose();
          message.success(`Wallpaper 导入成功（上传 ${result.uploadedCount} 个）`);
        }
      } catch (error) {
        console.error('[ImportModal] wallpaper 导入失败:', error);
        message.error('wallpaper 导入失败');
      }
      return false;
    });
  };

  const readPhotoShufflesFromZip = async (file: File) => {
    const isZipFile =
      file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip');
    if (!isZipFile) {
      message.error('仅支持上传 zip 压缩包');
      return false;
    }

    return withImportLoading(async () => {
      try {
        if (!projectId) {
          message.error('项目未初始化，无法上传资源');
          return false;
        }

        const zip = await JSZip.loadAsync(file);
        const result = await importPhotoShufflesFromZip(zip);
        if (result) {
          onClose();
          message.success(
            `Photo Shuffles 导入成功（上传 ${result.uploadedCount} 个）`,
          );
        }
      } catch (error) {
        console.error('[ImportModal] Photo Shuffles 导入失败:', error);
        message.error('Photo Shuffles 导入失败');
      }
      return false;
    });
  };

  const readWallpaperDepthFromZip = async (file: File) => {
    const isZipFile =
      file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip');
    if (!isZipFile) {
      message.error('仅支持上传 zip 压缩包');
      return false;
    }

    return withImportLoading(async () => {
      try {
        if (!projectId) {
          message.error('项目未初始化，无法上传资源');
          return false;
        }

        const zip = await JSZip.loadAsync(file);
        const basenames = listZipBasenames(zip);
        const missing = WALLPAPER_DEPTH_REQUIRED.filter(
          (required) =>
            !basenames.some((name) =>
              new RegExp(`^${escapeRegExp(required)}\\.(?:jpg|jpeg|png)$`, 'i').test(name),
            ),
        );
        if (missing.length) {
          message.error(
            `Wallpaper Depth 压缩包缺少：${missing.map((name) => `${name}.jpg`).join('、')}`,
          );
          return false;
        }

        const result = await importWallpaperDepthFromZip(zip);
        if (result) {
          onClose();
          message.success(
            `Wallpaper Depth 导入成功（上传 ${result.uploadedCount} 个）`,
          );
        }
      } catch (error) {
        console.error('[ImportModal] Wallpaper Depth 导入失败:', error);
        message.error('Wallpaper Depth 导入失败');
      }
      return false;
    });
  };

  const readLiveWallpaperFromZip = async (file: File) => {
    const isZipFile =
      file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip');
    if (!isZipFile) {
      message.error('仅支持上传 zip 压缩包');
      return false;
    }

    return withImportLoading(async () => {
      try {
        if (!projectId) {
          message.error('项目未初始化，无法上传资源');
          return false;
        }

        const zip = await JSZip.loadAsync(file);
        const result = await importLiveWallpaperFromZip(zip);
        if (result) {
          onClose();
          message.success('Live Wallpaper 导入成功');
        }
      } catch (error) {
        console.error('[ImportModal] Live Wallpaper 导入失败:', error);
        message.error('Live Wallpaper 导入失败');
      }
      return false;
    });
  };

  /** 选择 Theme zip 后先扫描，有 widget 则进入按套选平台 */
  const prepareThemeImport = async (file: File) => {
    const isZipFile =
      file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip');
    if (!isZipFile) {
      message.error('仅支持上传 zip 压缩包');
      return false;
    }
    if (!projectId) {
      message.error('项目未初始化，无法上传资源');
      return false;
    }

    return withImportLoading(async () => {
      try {
        const zip = await JSZip.loadAsync(file);
        const hasIconPack = hasIconPackAssets(zip);
        if (!hasIconPack) {
          message.error('Theme 压缩包必须包含 iconpack（icon_*.jpg/png）');
          return false;
        }

        const wallpaperIndices = discoverWallpaperIndices(zip);
        const widgetIndices = discoverWidgetIndices(zip);
        setThemePending({
          zip,
          fileName: file.name,
          hasIconPack,
          wallpaperIndices,
          widgetIndices,
          widgetSystems: widgetIndices.map(() => 'common'),
        });
        message.success(
          `已解析 Theme：IconPack 1，Wallpaper ${wallpaperIndices.length}，Widget ${widgetIndices.length}`,
        );
      } catch (error) {
        console.error('[ImportModal] theme 解析失败:', error);
        message.error('Theme 压缩包解析失败');
      }
      return false;
    });
  };

  const confirmThemeImport = async () => {
    if (!themePending || !projectId) return;
    setThemeImporting(true);
    await withImportLoading(async () => {
      try {
        const { zip, wallpaperIndices, widgetIndices, widgetSystems } = themePending;

        const iconResult = await importIconPackFromZip(zip, { silent: true });
        if (!iconResult) {
          message.error('IconPack 导入失败');
          return;
        }

        const wallpaperItems: Array<{ id: string; config: Record<string, any> }> = [];
        for (const exportIndex of wallpaperIndices) {
          const result = await importWallpaperFromZip(zip, {
            exportIndex,
            silent: true,
          });
          if (result) {
            wallpaperItems.push({ id: result.rootId, config: result.config });
          }
        }

        const widgetItems: Array<{
          id: string;
          system: ImportSystem;
          config: Record<string, any>;
        }> = [];
        for (let i = 0; i < widgetIndices.length; i += 1) {
          const system = widgetSystems[i] ?? 'common';
          const result = await importWidgetFromZip(zip, {
            exportIndex: widgetIndices[i],
            system,
            silent: true,
          });
          if (result) {
            widgetItems.push({
              id: result.rootId,
              system: result.system,
              config: result.config,
            });
          }
        }

        const selectElements = {
          apps: [iconResult.rootId],
          widgets: widgetItems.map((item) => `${item.id},${item.system}`),
          wallpaper: wallpaperItems.map((item) => item.id),
        };
        const showElements = buildThemeShowElements({
          iconPackId: iconResult.rootId,
          iconPackConfig: iconResult.config,
          wallpaperItems,
          widgetItems,
        });
        // 预览面不再按选中元素拼装，直接用包里的成品图
        const surfaceSources: Record<string, string> = {};
        const missingSurfaces: string[] = [];
        for (const key of THEME_SURFACE_KEYS) {
          let surfaceUpload: Awaited<ReturnType<typeof uploadMediaFromZip>> = null;
          for (const ext of THEME_SURFACE_EXTS) {
            surfaceUpload = await uploadMediaFromZip(`${key}.${ext}`, zip);
            if (surfaceUpload) break;
          }
          if (surfaceUpload) {
            surfaceSources[key] = surfaceUpload.url;
          } else {
            missingSurfaces.push(`${key}.${THEME_SURFACE_EXTS[0]}`);
          }
        }
        if (missingSurfaces.length) {
          message.warning(`Theme 压缩包缺少预览图：${missingSurfaces.join('、')}`);
        }

        const withSurface = (key: string, surface: Record<string, any>) => ({
          ...surface,
          showElements: [...showElements],
          source: surfaceSources[key] ?? '',
        });

        addTheme({
          ...DEFAULT_THEME_CONFIG,
          preview_long: withSurface('preview_long', {
            ...DEFAULT_THEME_CONFIG.preview_long,
            width: 887,
            height: 1920,
          }),
          preview_short: withSurface('preview_short', DEFAULT_THEME_CONFIG.preview_short),
          list_view: withSurface('list_view', DEFAULT_THEME_CONFIG.list_view),
          preview_long_ipad: withSurface(
            'preview_long_ipad',
            DEFAULT_THEME_CONFIG.preview_long_ipad,
          ),
          list_view_ipad: withSurface('list_view_ipad', DEFAULT_THEME_CONFIG.list_view_ipad),
          selectElements,
        });

        clearThemePending();
        onClose();
        message.success(
          `Theme 导入完成：IconPack 1，Wallpaper ${wallpaperItems.length}/${wallpaperIndices.length}，Widget ${widgetItems.length}/${widgetIndices.length}`,
        );
      } catch (error) {
        console.error('[ImportModal] theme 导入失败:', error);
        message.error('Theme 导入失败');
      } finally {
        setThemeImporting(false);
      }
    });
  };

  const beforeUpload = async (file: File) => {
    if (importKind === 'iconPack') {
      return readIconPackFromZip(file);
    }
    if (importKind === 'wallpaper') {
      return readWallpaperFromZip(file);
    }
    if (importKind === 'photo_shuffles') {
      return readPhotoShufflesFromZip(file);
    }
    if (importKind === 'wallpaper_depth') {
      return readWallpaperDepthFromZip(file);
    }
    if (importKind === 'live_wallpaper') {
      return readLiveWallpaperFromZip(file);
    }
    if (importKind === 'theme') {
      return prepareThemeImport(file);
    }
    return readWidgetsSpecFromZip(file);
  };

  const updateThemeWidgetSystem = (rowIndex: number, system: ImportSystem) => {
    setThemePending((prev) => {
      if (!prev) return prev;
      const nextSystems = [...prev.widgetSystems];
      nextSystems[rowIndex] = system;
      return { ...prev, widgetSystems: nextSystems };
    });
  };

  return (
    <>
      <div className={`${styles.panel} ${!open ? styles.panelClosed : ''}`}>
        <Typography.Title level={5} className={styles.title}>
          Import
        </Typography.Title>
        <Select
          value={importKind}
          onChange={handleImportKindChange}
          options={[
            { label: 'Widget', value: 'widget' },
            { label: 'IconPack', value: 'iconPack' },
            {
              label: 'WallPaper',
              options: [
                {
                  label: 'wallpaper',
                  value: 'wallpaper',
                },
                {
                  label: 'photo shuffles',
                  value: 'photo_shuffles',
                },
                {
                  label: 'wallpaper depth',
                  value: 'wallpaper_depth',
                },
                {
                  label: 'live wallpaper',
                  value: 'live_wallpaper',
                }
              ],
            },
            { label: 'Theme', value: 'theme' },
          ]}
          style={{ width: '100%' }}
        />
        {importKind === 'widget' || importKind === 'live_wallpaper' ? (
          <Segmented<ImportSystem>
            block
            value={importSystem}
            onChange={(value) => setImportSystem(value)}
            options={[
              { label: 'Common', value: 'common', disabled: importKind === 'live_wallpaper' },
              { label: 'iOS', value: 'ios' },
              { label: 'Android', value: 'android' },
            ]}
          />
        ) : null}
        {importKind === 'theme' && themePending ? (
          <>
            <div className={styles.themeMeta}>
              {themePending.fileName}
              <br />
              IconPack: 1 · Wallpaper: {themePending.wallpaperIndices.length} ·
              Widget: {themePending.widgetIndices.length}
            </div>
            {themePending.widgetIndices.map((exportIndex, rowIndex) => (
              <div className={styles.widgetRow} key={`widget-${exportIndex ?? 'plain'}-${rowIndex}`}>
                <div className={styles.widgetRowTitle}>
                  Widget #{exportIndex == null ? 1 : exportIndex}
                  {exportIndex != null ? ` (_${exportIndex})` : ''}
                </div>
                <Segmented<ImportSystem>
                  block
                  size="small"
                  value={themePending.widgetSystems[rowIndex] ?? 'common'}
                  onChange={(value) => updateThemeWidgetSystem(rowIndex, value)}
                  options={[
                    { label: 'Common', value: 'common' },
                    { label: 'iOS', value: 'ios' },
                    { label: 'Android', value: 'android' },
                  ]}
                />
              </div>
            ))}
            <Button
              type="primary"
              block
              loading={themeImporting}
              onClick={confirmThemeImport}
            >
              确认导入
            </Button>
            <Button block disabled={themeImporting} onClick={clearThemePending}>
              重新选择文件
            </Button>
          </>
        ) : (
          <Upload.Dragger
            fileList={[]}
            accept=".zip,application/zip"
            maxCount={1}
            beforeUpload={beforeUpload}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              点击或拖拽 zip 压缩包到这里
            </p>
          </Upload.Dragger>
        )}
      </div>
    </>
  );
};

export default ImportModal;
