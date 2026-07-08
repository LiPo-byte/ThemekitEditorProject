import React from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { useEditorAddWidget, useEditorProjectId } from '../context';
import { message, Upload, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { CONFIG_SIZE_MAP, DEFAULT_CROP_PROPS, DEFAULT_RADIUS, SIZE_LABEL_MAP, SOURCENAME_TYPE_WIDGET_MAP, TYPE_WIDGET_MAP } from '../widget/base-config';
import JSZip from 'jszip';
import { uploadProjectImage } from '../service';

const useStyles = createStyles(({ token, css }) => ({
  panel: css`
    position: absolute;
    right: 24%;
    bottom: 52px;
    transform: translateX(-50%);
    width: 300px;
    height: 200px;
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
  const projectId = useEditorProjectId();
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

      for (let i = 0; i < sizes.length; i += 1) {
        const item = sizes[i] as Record<string, any>;
        const sizeNumber = Number(item?.size);
        const sizeLabel = SIZE_LABEL_MAP[sizeNumber];
        if (!sizeLabel) continue;

        // 处理背景资源
        const ext = isGif ? 'gif' : 'jpg';
        const expectedFilename = `widgets_${sizeLabel}_${SOURCENAME_TYPE_WIDGET_MAP[type] || TYPE_WIDGET_MAP[type]}.${ext}`;
        const uploadResult = await uploadMediaFromZip(expectedFilename, zip);
        if (!uploadResult) {
          message.warning(`压缩包缺少 ${expectedFilename}`);
          continue;
        }
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
      }

      addWidget({
        ios: spec,
        android: spec,
      });
      onClose();
      message.success('导入成功');
    } catch (error) {
      console.error('[ImportModal] 读取 widgets_spec.json 失败:', error);
      message.error('读取 widgets_spec.json 失败');
    }
    return false;
  };

  return (
    <>
      <div className={`${styles.panel} ${!open ? styles.panelClosed : ''}`}>
        <Typography.Title level={5} className={styles.title}>
          Import
        </Typography.Title>
        <Upload.Dragger fileList={[]} accept=".zip,application/zip" maxCount={1} beforeUpload={readWidgetsSpecFromZip}>
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
