import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { App, Button, Flex, Select, Typography, Upload } from 'antd';
import { createStyles } from 'antd-style';
import JSZip from 'jszip';
import React, { useEffect, useState } from 'react';
import { IconPackDefaultConfig } from '@/editor-core/defaultConfig';
import { uploadProjectImage } from '../../service';

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

const APPS = IconPackDefaultConfig.apps as Record<
  string,
  { name?: string }
>;
const APP_KEYS = Object.keys(APPS);
/** apps 以外带 source 的面图：preview_long / preview_short / list_view */
const SURFACE_KEYS = Object.keys(IconPackDefaultConfig).filter((key) => {
  if (key === 'apps') return false;
  const item = (IconPackDefaultConfig as Record<string, unknown>)[key];
  return Boolean(
    item && typeof item === 'object' && !Array.isArray(item) && 'source' in item,
  );
});
const SURFACE_KEY_SET = new Set(SURFACE_KEYS);

const CONCAT_SOURCE_KEYS = [...APP_KEYS, ...SURFACE_KEYS];
/** 长 key 优先，避免 google 盖住 google_maps */
const CONCAT_SOURCE_KEYS_BY_LENGTH = [...CONCAT_SOURCE_KEYS].sort(
  (a, b) => b.length - a.length,
);

const CONCAT_SOURCE_OPTIONS = [
  {
    label: 'Apps',
    options: APP_KEYS.map((key) => ({
      value: key,
      label: APPS[key]?.name ?? key,
    })),
  },
  {
    label: 'Surfaces',
    options: SURFACE_KEYS.map((key) => ({
      value: key,
      label: key,
    })),
  },
];

/** 文件名里包含哪个资源 key，就默认选中；没有就留空 */
const guessAppKey = (filename: string) => {
  const lower = filename.toLowerCase();
  return CONCAT_SOURCE_KEYS_BY_LENGTH.find((key) => lower.includes(key));
};

const useStyles = createStyles(({ token, css }) => ({
  wrap: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    // padding: 8px 0;
  `,
  row: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  label: css`
    color: ${token.colorText};
    font-size: 13px;
    font-weight: 600;
  `,
  tip: css`
    color: ${token.colorTextTertiary};
    font-size: 12px;
  `,
  list: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  item: css`
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  preview: css`
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    border-radius: 4px;
    object-fit: contain;
    background: ${token.colorFillQuaternary};
  `,
  fileBtn: css`
    flex: 1;
    justify-content: flex-start;
    overflow: hidden;
  `,
}));

export type IconPackFormValue = {
  images: File[];
  /** filename → apps / surface 资源 key */
  appKeys: Record<string, string>;
};

export const EMPTY_ICON_PACK_VALUE: IconPackFormValue = {
  images: [],
  appKeys: {},
};

export const validateIconPackValue = (value: IconPackFormValue) => {
  // 可以不传图直接 add；传了就必须每张都选 Concat Source
  if (!value.images.length) return null;
  const missing = value.images.filter((file) => !value.appKeys[file.name]);
  if (!missing.length) return null;
  return `请为以下图片选择 Concat Source：${missing.map((file) => file.name).join('、')}`;
};

/**
 * 点 add 时才真正上传：按 Concat Source 把 url 填进默认模板。
 * 未选 Source 的图跳过；同一 key 多张时后面的覆盖前面的。
 */
export const uploadIconPackFiles = async (
  projectId: string,
  value: IconPackFormValue,
) => {
  const config = structuredClone(IconPackDefaultConfig) as Record<string, any>;
  const apps = config.apps as Record<string, { source?: string }>;
  let uploadedCount = 0;

  for (const file of value.images) {
    const key = value.appKeys[file.name];
    if (!key) continue;
    const { url } = await uploadProjectImage(projectId, file);
    if (SURFACE_KEY_SET.has(key)) {
      if (!config[key] || typeof config[key] !== 'object') continue;
      config[key].source = url;
    } else if (apps[key]) {
      apps[key].source = url;
    } else {
      continue;
    }
    uploadedCount += 1;
  }

  return { config, uploadedCount };
};

/** 上传结果本身已是 addIconPack 要的 config，这里只做透传方便和 sticker 对齐 */
export const buildIconPackConfig = (result: {
  config: Record<string, any>;
}) => result.config;

/** 不传图时直接落默认模板，和底栏 Add IconPack 一致 */
export const buildEmptyIconPackConfig = () =>
  structuredClone(IconPackDefaultConfig) as Record<string, any>;

const getExt = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
};

const isImageFile = (file: File) =>
  file.type.startsWith('image/') || IMAGE_EXT.has(getExt(file.name));

const isZipFile = (file: File) =>
  file.type === 'application/zip' ||
  file.type === 'application/x-zip-compressed' ||
  getExt(file.name) === 'zip';

const isSkippableZipPath = (path: string) => {
  const base = path.split('/').pop() || '';
  return (
    !base ||
    path.startsWith('__MACOSX/') ||
    path.includes('/__MACOSX/') ||
    base.startsWith('.')
  );
};

const mergeImages = (prev: File[], next: File[]) => {
  const map = new Map(prev.map((file) => [file.name, file]));
  next.forEach((file) => map.set(file.name, file));
  return Array.from(map.values());
};

/** 合并文件时给新图猜 key；同名覆盖时重新猜 */
const mergeAppKeys = (
  prevKeys: Record<string, string>,
  nextImages: File[],
  mergedImages: File[],
) => {
  const nextNames = new Set(nextImages.map((file) => file.name));
  const next: Record<string, string> = {};
  mergedImages.forEach((file) => {
    if (nextNames.has(file.name)) {
      const guessed = guessAppKey(file.name);
      if (guessed) next[file.name] = guessed;
      return;
    }
    if (prevKeys[file.name]) next[file.name] = prevKeys[file.name];
  });
  return next;
};

const extractImagesFromZip = async (file: File) => {
  const zip = await JSZip.loadAsync(file);
  const images: File[] = [];
  for (const [path, entry] of Object.entries(zip.files)) {
    if (!entry || entry.dir || isSkippableZipPath(path)) continue;
    const name = path.split('/').pop() || '';
    if (!IMAGE_EXT.has(getExt(name))) continue;
    const blob = await entry.async('blob');
    images.push(new File([blob], name, { type: blob.type || 'image/png' }));
  }
  return images;
};

const ImageThumb: React.FC<{ file: File }> = ({ file }) => {
  const { styles } = useStyles();
  const [url, setUrl] = useState('');

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  if (!url) return null;
  return <img className={styles.preview} src={url} alt="" />;
};

type Props = {
  value: IconPackFormValue;
  onChange: (value: IconPackFormValue) => void;
};

/** Icon Pack 表单：一个按钮同时收 zip 和单张图，图片纵向列在按钮下面 */
const AddIconPackModal: React.FC<Props> = ({ value, onChange }) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [reading, setReading] = useState(false);

  const onUploadChange: UploadProps['onChange'] = async ({ fileList }) => {
    const rawFiles = fileList
      .map((item) => item.originFileObj as File | undefined)
      .filter((file): file is File => Boolean(file));
    if (!rawFiles.length) return;

    setReading(true);
    try {
      const collected: File[] = [];
      for (const file of rawFiles) {
        if (isZipFile(file)) {
          const images = await extractImagesFromZip(file);
          if (!images.length) {
            message.error(`${file.name} 里没有可用图片`);
            continue;
          }
          collected.push(...images);
          continue;
        }
        if (isImageFile(file)) {
          collected.push(file);
          continue;
        }
        message.error(`${file.name} 不是 zip 或图片`);
      }
      if (collected.length) {
        const images = mergeImages(value.images, collected);
        onChange({
          images,
          appKeys: mergeAppKeys(value.appKeys, collected, images),
        });
      }
    } catch {
      message.error('读取失败，请重试');
    } finally {
      setReading(false);
    }
  };

  const onRemove = (name: string) => {
    const { [name]: _, ...restKeys } = value.appKeys;
    onChange({
      images: value.images.filter((file) => file.name !== name),
      appKeys: restKeys,
    });
  };

  const onAppKeyChange = (filename: string, appKey: string | null) => {
    const nextKeys = { ...value.appKeys };
    if (appKey) nextKeys[filename] = appKey;
    else delete nextKeys[filename];
    onChange({ ...value, appKeys: nextKeys });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <span className={styles.label}>Icon Pack</span>
        <span className={styles.tip}>
        可上传 zip，或一张一张选图片；同名文件会覆盖；
        </span>
        <Flex gap={12}>
            <Upload
                accept=".zip,.jpg,.jpeg,.png,.webp"
                multiple
                fileList={[]}
                beforeUpload={() => false}
                onChange={onUploadChange}
            >
                <Button variant="filled" color="default" loading={reading}>
                <UploadOutlined />
                upload zip or images
                </Button>
            </Upload>
            <Button
                disabled={!value.images.length}
                variant="filled"
                color="danger"
                onClick={() => onChange(EMPTY_ICON_PACK_VALUE)}
            >
                Clear All
            </Button>
        </Flex>
        {value.images.length ? (
          <div className={styles.list}>
            {value.images.map((file) => (
              <div className={styles.item} key={file.name}>
                <ImageThumb file={file} />
                <Button
                  variant="filled"
                  color="default"
                  className={styles.fileBtn}
                >
                  <Typography.Text
                    style={{ width: 200 }}
                    ellipsis={{ tooltip: file.name }}
                  >
                    {file.name}
                  </Typography.Text>
                </Button>
                <Select
                  style={{ width: 200 }}
                  allowClear
                  showSearch={{
                    filterOption: (input, option) =>
                      String(option?.label ?? '')
                        .toLowerCase()
                        .includes(input.toLowerCase()),
                  }}
                  placeholder="Concat Source"
                  options={CONCAT_SOURCE_OPTIONS}
                  value={value.appKeys[file.name]}
                  onChange={(next) => onAppKeyChange(file.name, next ?? null)}
                />
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => onRemove(file.name)}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AddIconPackModal;
