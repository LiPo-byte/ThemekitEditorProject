import React from 'react';
import { InboxOutlined } from '@ant-design/icons';
import {
  useEditorAddIconPack,
  useEditorAddWidget,
  useEditorProjectId,
} from '../context';
import { message, Segmented, Select, Upload, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { CONFIG_SIZE_MAP, DEFAULT_CROP_PROPS, DEFAULT_RADIUS, SIZE_LABEL_MAP, SOURCENAME_TYPE_WIDGET_MAP, TYPE_WIDGET_MAP } from '../widget/base-config';
import JSZip from 'jszip';
import { uploadProjectImage } from '../service';
import { IconPackDefaultConfig } from '@/editor-core/defaultConfig';

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
}));

type Props = {
  open: boolean;
  onClose: () => void;
};
type ImportSystem = 'ios' | 'android' | 'common';
type ImportKind = 'widget' | 'iconPack';

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
  const projectId = useEditorProjectId();
  const [importKind, setImportKind] = React.useState<ImportKind>('widget');
  const [importSystem, setImportSystem] = React.useState<ImportSystem>('common');
  const uploadMediaFromZip = async (filename: string, zip: JSZip) => {
    if (!projectId) {
      throw new Error('项目未初始化，无法上传资源');
    }
    const mediaFile =
      zip.file(filename) ??
      zip.file(new RegExp(`(^|\\/)${escapeRegExp(filename)}$`, 'i'))?.[0];
    if (!mediaFile) return null;
    const mediaBlob = await mediaFile.async('blob');
    const fileExt = filename.split('.').pop()?.toLowerCase();
    const mimeType = fileExt ? `image/${fileExt}` : 'application/octet-stream';
    const uploadFile = new File([mediaBlob], filename, { type: mimeType });
    const { url } = await uploadProjectImage(projectId, uploadFile);
    return { url, mediaBlob };
  };

  const readWidgetsSpecFromZip = async (file: File) => {
    const isZipFile =
      file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip');
    if (!isZipFile) {
      message.error('仅支持上传 zip 压缩包');
      return false;
    }

    try {
      if (!projectId) {
        message.error('项目未初始化，无法上传资源');
        return false;
      }
      const zip = await JSZip.loadAsync(file);
      const specFile =
        zip.file('widgets_spec.json') ??
        zip.file(/(^|\/)widgets_spec\.json$/i)?.[0];
      if (!specFile) {
        message.error('压缩包内未找到 widgets_spec.json');
        return false;
      }

      const specText = await specFile.async('string');
      const spec = JSON.parse(specText);
      const { sizes, isGif, type } = spec;
      if (!Array.isArray(sizes)) {
        message.error('widgets_spec.json 缺少 sizes 数组');
        return false;
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
          // if (!spec[field]) continue;
          const filenameBase = `image_${key}`;
          const candidateFilenames = [
            `${filenameBase}.png`,
            `${filenameBase}.jpg`,
            `${filenameBase}.jpeg`,
          ];
          let uploadResult: Awaited<ReturnType<typeof uploadMediaFromZip>> = null;
          for (const filename of candidateFilenames) {
            uploadResult = await uploadMediaFromZip(filename, zip);
            if (uploadResult) break;
          }
          if (!uploadResult) {
            message.warning(`压缩包缺少 ${filenameBase}.png/.jpg/.jpeg`);
            spec[field] = {
              source: '',
              crop_props: {
                ...DEFAULT_CROP_PROPS,
              }
            };
            continue;
          }
          spec[field] = {
            source: uploadResult.url,
            crop_props: {
              ...DEFAULT_CROP_PROPS,
            }
          };
        }
      }
      if (type === 18) {
        const clockImageEntries = [
          { key: 'minute_clock', field: 'minuteClock'},
          { key: 'hour_clock', field: 'hourClock' },
          { key: 'dot_clock', field: 'dotClock' },
          { key: 'dial_large_clock', field: 'dialLargeClock' },
          { key: 'dial_small_clock', field: 'dialSmallClock' },
        ]
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
            uploadResult = await uploadMediaFromZip(filename, zip);
            if (uploadResult) break;
          }
          if (!uploadResult) {
            message.warning(`压缩包缺少 ${filenameBase}.png/.jpg/.jpeg`);
            continue;
          }
          spec[field] = {
            source: uploadResult.url,
            crop_props: {
              ...DEFAULT_CROP_PROPS,
            }
          };
        }
      }

      for (let i = 0; i < sizes.length; i += 1) {
        const item = sizes[i] as Record<string, any>;
        const sizeNumber = Number(item?.size);
        const sizeLabel = SIZE_LABEL_MAP[sizeNumber];
        if (!sizeLabel) continue;

        // 处理背景资源
        const ext = isGif ? 'gif' : 'jpg';
        const expectedFilename = `widgets_${sizeLabel}_${SOURCENAME_TYPE_WIDGET_MAP[type] || TYPE_WIDGET_MAP[type]}.${ext}`;
        const uploadResult = await uploadMediaFromZip(expectedFilename, zip);
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

        // 处理动画资源
        // widgets_medium_animation_first
        // firstImageAnimation secondImageAnimation
        if (item.firstImageAnimation) {
          const filename = `widgets_${sizeLabel}_animation_first.png`;
          const uploadResult = await uploadMediaFromZip(filename, zip);
          if (!uploadResult) {
            message.warning(`压缩包缺少 ${filename}`);
            continue;
          }
          item.firstImageAnimation.source = uploadResult.url;
          item.firstImageAnimation.crop_props = {
            ...DEFAULT_CROP_PROPS,
          };
        }
        if (item.secondImageAnimation) {
          const filename = `widgets_${sizeLabel}_animation_second.png`;
          const uploadResult = await uploadMediaFromZip(filename, zip);
          if (!uploadResult) {
            message.warning(`压缩包缺少 ${filename}`);
            continue;
          }
          item.secondImageAnimation.source = uploadResult.url;
          item.secondImageAnimation.crop_props = {
            ...DEFAULT_CROP_PROPS,
          };
        }
        if (item.thirdImageAnimation) {
          const filename = `widgets_${sizeLabel}_animation_third.png`;
          const uploadResult = await uploadMediaFromZip(filename, zip);
          if (!uploadResult) {
            message.warning(`压缩包缺少 ${filename}`);
            continue;
          }
          item.thirdImageAnimation.source = uploadResult.url;
          item.thirdImageAnimation.crop_props = {
            ...DEFAULT_CROP_PROPS,
          };
        }
        if (item.fourthImageAnimation) {
          const filename = `widgets_${sizeLabel}_animation_fourth.png`;
          const uploadResult = await uploadMediaFromZip(filename, zip);
          if (!uploadResult) {
            message.warning(`压缩包缺少 ${filename}`);
            continue;
          }
          item.fourthImageAnimation.source = uploadResult.url;
          item.fourthImageAnimation.crop_props = {
            ...DEFAULT_CROP_PROPS,
          };
        }
        // 处理appLinks 只有layoutType 小于6的时候才处理这个
        if (item.appLinks && Array.isArray(item.appLinks) && item.layoutType < 6) {
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
              let uploadResult: Awaited<ReturnType<typeof uploadMediaFromZip>> = null;
              for (const filename of candidateFilenames) {
                uploadResult = await uploadMediaFromZip(filename, zip);
                if (uploadResult) break;
              }
              if (!uploadResult) {
                message.warning(`压缩包缺少 ${filenameBase}.png/.jpg/.jpeg`);
                return {
                  ...(existingAppLinksSource[index] ?? {}),
                  source: existingAppLinksSource[index]?.source ?? '',
                };
              }
              return {
                ...(existingAppLinksSource[index] ?? {}),
                source: uploadResult.url,
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

        // 电池组件 layoutType === 0
        if (type === 5 && item.layoutType === 0) {
          const batterSource = ['battery_20', 'battery_40', 'battery_60', 'battery_80', 'battery_100'];
          await Promise.all(
            batterSource.map(async (key: any) => {
              const filenameBase = `widgets_${sizeLabel}_${key}`;
              const candidateFilenames = [
                `${filenameBase}.png`,
                `${filenameBase}.jpg`,
                `${filenameBase}.jpeg`,
              ];
              let uploadResult: Awaited<ReturnType<typeof uploadMediaFromZip>> = null;
              for (const filename of candidateFilenames) {
                uploadResult = await uploadMediaFromZip(filename, zip);
                if (uploadResult) break;
              }
              if (!uploadResult) {
                message.warning(`压缩包缺少 ${filenameBase}.png/.jpg/.jpeg`);
              }
              item[key] = {
                crop_props: {
                  ...DEFAULT_CROP_PROPS,
                },
                source: uploadResult ? uploadResult.url : '',
              }
            }),
          );
        }
      }

      const importConfig: Record<string, any> = {};
      importConfig[importSystem] = spec;
      addWidget(importConfig);
      onClose();
      message.success('导入成功');
    } catch (error) {
      console.error('[ImportModal] 读取 widgets_spec.json 失败:', error);
      message.error('读取 widgets_spec.json 失败');
    }
    return false;
  };

  /**
   * 深拷贝 IconPackDefaultConfig，按 apps key 在 zip 里找 icon_{key}.jpg/png 上传填 url；
   * 找不到则 source 置空。preview 暂不处理。
   */
  const readIconPackFromZip = async (file: File) => {
    const isZipFile =
      file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip');
    if (!isZipFile) {
      message.error('仅支持上传 zip 压缩包');
      return false;
    }

    try {
      if (!projectId) {
        message.error('项目未初始化，无法上传资源');
        return false;
      }

      const zip = await JSZip.loadAsync(file);
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

      addIconPack(config);
      onClose();
      message.success(`IconPack 导入成功（上传 ${uploadedCount} 个）`);
    } catch (error) {
      console.error('[ImportModal] iconpack 导入失败:', error);
      message.error('iconpack 导入失败');
    }
    return false;
  };

  const beforeUpload = async (file: File) => {
    if (importKind === 'iconPack') {
      return readIconPackFromZip(file);
    }
    return readWidgetsSpecFromZip(file);
  };

  return (
    <>
      <div className={`${styles.panel} ${!open ? styles.panelClosed : ''}`}>
        <Typography.Title level={5} className={styles.title}>
          Import
        </Typography.Title>
        <Select<ImportKind>
          value={importKind}
          onChange={setImportKind}
          options={[
            { label: 'Widget', value: 'widget' },
            { label: 'IconPack', value: 'iconPack' },
          ]}
          style={{ width: '100%' }}
        />
        <Segmented<ImportSystem>
          block
          value={importSystem}
          onChange={(value) => setImportSystem(value)}
          options={[
            { label: 'Common', value: 'common' },
            { label: 'iOS', value: 'ios' },
            { label: 'Android', value: 'android' },
          ]}
        />
        <Upload.Dragger
          fileList={[]}
          accept=".zip,application/zip"
          maxCount={1}
          beforeUpload={beforeUpload}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽 zip 压缩包到这里</p>
        </Upload.Dragger>
      </div>
    </>
  );
};

export default ImportModal;
