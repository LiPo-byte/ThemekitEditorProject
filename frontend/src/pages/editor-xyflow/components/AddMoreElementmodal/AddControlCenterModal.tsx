import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { App, Button, Flex, Select, Typography, Upload } from 'antd';
import { createStyles } from 'antd-style';
import JSZip from 'jszip';
import React, { useEffect, useMemo, useState } from 'react';
import { ControlCenterDefaultConfig } from '@/editor-core/defaultConfig';
import {
  CONTROL_CENTER_FILE_OPTIONS,
  type ControlCenterFileOption,
  type ControlCenterFileOptionGroup,
  getControlCenterFileRule,
  toControlCenterAssetKey,
} from '../../control_center/asset-rules';
import { uploadProjectFile, uploadProjectImage } from '../../service';

/** yaml 只要求 png / jpg / pag；jpeg 也放行，让用户能手选到对应的 .jpg 槽位 */
const ASSET_EXT = new Set(['png', 'jpg', 'jpeg', 'pag']);
/** pag 要走 libpag 才能画，列表里不预览，只占位 */
const PREVIEWABLE_EXT = new Set(['png', 'jpg', 'jpeg']);

const useStyles = createStyles(({ token, css }) => ({
  wrap: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
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
  placeholder: css`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${token.colorTextQuaternary};
    font-size: 18px;
  `,
  fileBtn: css`
    flex: 1;
    justify-content: flex-start;
    overflow: hidden;
  `,
  /** 下拉选项的第二行：出处 + 包内文件名，落库的是这个名字，得让人看得见 */
  optionSub: css`
    color: ${token.colorTextTertiary};
    font-size: 12px;
    line-height: 1.4;
  `,
}));

export type ControlCenterFormValue = {
  files: File[];
  /** 上传的文件名 → 包内目标文件名 */
  targets: Record<string, string>;
};

export const EMPTY_CONTROL_CENTER_VALUE: ControlCenterFormValue = {
  files: [],
  targets: {},
};

export const validateControlCenterValue = (value: ControlCenterFormValue) => {
  // 可以不传文件直接 add；传了就必须每个都指定包内文件名
  if (!value.files.length) return null;
  const missing = value.files.filter((file) => !value.targets[file.name]);
  if (!missing.length) return null;
  return `请为以下文件选择包内文件名：${missing.map((file) => file.name).join('、')}`;
};

const getExt = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
};

const isAssetFile = (file: File) => ASSET_EXT.has(getExt(file.name));

/**
 * JSZip 解出来的 blob 不带 MIME，直接 new File 得到的 content_type 是空串，
 * 而后端 upload-image 要求它以 image/ 开头，会整单打回
 * "Only image files are supported"。所以按扩展名补上。
 */
const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  pag: 'application/octet-stream',
};

/** 单独选文件时浏览器一般会带上正确的 MIME，这里只兜没带或带错的情况 */
const withMime = (file: File) => {
  const expected = MIME_BY_EXT[getExt(file.name)];
  if (!expected || file.type === expected) return file;
  return new File([file], file.name, { type: expected });
};

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

/**
 * 包内文件名是固定清单，所以只认精确命中，不做 iconpack 那种包含匹配。
 * 标准包丢进来 73 个文件会全部自动选上，命不中的留空让用户手选。
 */
const guessTarget = (filename: string) =>
  getControlCenterFileRule(filename) ? filename : undefined;

const mergeFiles = (prev: File[], next: File[]) => {
  const map = new Map(prev.map((file) => [file.name, file]));
  next.forEach((file) => {
    map.set(file.name, file);
  });
  return Array.from(map.values());
};

/** 合并文件时给新进来的重新猜，老的保留用户已经改过的选择 */
const mergeTargets = (
  prevTargets: Record<string, string>,
  nextFiles: File[],
  mergedFiles: File[],
) => {
  const nextNames = new Set(nextFiles.map((file) => file.name));
  const next: Record<string, string> = {};
  mergedFiles.forEach((file) => {
    if (nextNames.has(file.name)) {
      const guessed = guessTarget(file.name);
      if (guessed) next[file.name] = guessed;
      return;
    }
    if (prevTargets[file.name]) next[file.name] = prevTargets[file.name];
  });
  return next;
};

const extractFromZip = async (file: File) => {
  const zip = await JSZip.loadAsync(file);
  const assets: File[] = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (!entry || entry.dir || isSkippableZipPath(path)) continue;
    const name = path.split('/').pop() || '';
    if (!ASSET_EXT.has(getExt(name))) continue;
    const blob = await entry.async('blob');
    assets.push(
      new File([blob], name, { type: MIME_BY_EXT[getExt(name)] ?? '' }),
    );
  }

  return assets;
};

export type ControlCenterUploadProgress = { done: number; total: number };

export type ControlCenterUploadResult = {
  config: Record<string, any>;
  uploadedCount: number;
  /** 传失败的文件名；其余照常落进 config，不整单回滚 */
  failed: string[];
};

/** 不传素材时直接落默认模板，和其他元素的空 config 一致 */
export const buildEmptyControlCenterConfig = () =>
  structuredClone(ControlCenterDefaultConfig) as Record<string, any>;

/** 73 个文件串行传要等很久，并发太高又容易被网关限流，6 路是个折中 */
const UPLOAD_CONCURRENCY = 6;

/** upload-image 的白名单不收 pag，跟 charging_animation 一样改走 upload-file */
const uploadOne = (projectId: string, file: File) =>
  getExt(file.name) === 'pag'
    ? uploadProjectFile(projectId, withMime(file))
    : uploadProjectImage(projectId, withMime(file));

/**
 * 点 add 时才真正上传，只传已经指定了包内文件名的那些。
 * 单个失败只记下来不中断，避免传完 70 个卡在第 71 个上前功尽弃。
 */
export const uploadControlCenterFiles = async (
  projectId: string,
  value: ControlCenterFormValue,
  onProgress?: (progress: ControlCenterUploadProgress) => void,
): Promise<ControlCenterUploadResult> => {
  const config = buildEmptyControlCenterConfig();
  const assets = config.assets as Record<string, Record<string, any>>;
  const tasks = value.files
    .map((file) => ({ file, target: value.targets[file.name] }))
    .filter((task): task is { file: File; target: string } =>
      Boolean(task.target),
    );

  const failed: string[] = [];
  let uploadedCount = 0;
  let done = 0;
  let cursor = 0;

  const worker = async () => {
    while (cursor < tasks.length) {
      const task = tasks[cursor];
      cursor += 1;
      try {
        const { url } = await uploadOne(projectId, task.file);
        // target 是带后缀的包内文件名，config 的 key 不带后缀
        const asset = assets[toControlCenterAssetKey(task.target)];
        if (asset) {
          // 字段名跟着模板走：图片是 source，pag 是 pagsource
          if ('pagsource' in asset) asset.pagsource = url;
          else asset.source = url;
          uploadedCount += 1;
        }
      } catch {
        failed.push(task.file.name);
      }
      done += 1;
      onProgress?.({ done, total: tasks.length });
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(UPLOAD_CONCURRENCY, tasks.length) }, () =>
      worker(),
    ),
  );

  return { config, uploadedCount, failed };
};

/** 上传结果本身就是 addControlCenter 要的 config，透传一层对齐其他元素 */
export const buildControlCenterConfig = (result: {
  config: Record<string, any>;
}) => result.config;

type ImageSize = { width: number; height: number };

/** 顺带把真实宽高回传出去，缩略图本来就要解码一次，不用再读一遍文件 */
const AssetThumb: React.FC<{
  file: File;
  onSize: (size: ImageSize) => void;
}> = ({ file, onSize }) => {
  const { styles } = useStyles();
  const [url, setUrl] = useState('');
  const previewable = PREVIEWABLE_EXT.has(getExt(file.name));

  useEffect(() => {
    if (!previewable) return;
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file, previewable]);

  if (!previewable) {
    return (
      <div className={`${styles.preview} ${styles.placeholder}`}>
        <img src="/icons/img_pag.png" style={{ height: '80%' }} alt="" />
      </div>
    );
  }
  if (!url) return null;
  return (
    <img
      className={styles.preview}
      src={url}
      alt=""
      onLoad={(event) =>
        onSize({
          width: event.currentTarget.naturalWidth,
          height: event.currentTarget.naturalHeight,
        })
      }
    />
  );
};

/**
 * options 传的是分组数组，antd 的泛型跟着推成了分组类型，
 * 但 filterOption / optionRender 回调里拿到的其实是组内的叶子选项。
 */
const asFileOption = (option: unknown) =>
  option as ControlCenterFileOption | undefined;

type AssetRowProps = {
  file: File;
  target?: string;
  /** 已被别的文件占用的包内文件名 */
  taken: Set<string>;
  onTargetChange: (filename: string, target: string | null) => void;
  onRemove: (filename: string) => void;
};

const AssetRow: React.FC<AssetRowProps> = ({
  file,
  target,
  taken,
  onTargetChange,
  onRemove,
}) => {
  const { styles } = useStyles();
  const [size, setSize] = useState<ImageSize | null>(null);

  /**
   * 73 个候选平铺出来挑不动，靠两件事收窄：
   *
   * 1. 已被别的文件占用的直接不显示（不是置灰），选得越多下拉越短。
   * 2. 尺寸和上传图一致的提到最前面单独成组。18 种尺寸规格里最大的一组也只有
   *    16 个候选，有 6 种尺寸是独一份，提上来就只剩一个候选。
   *
   * 尺寸只排序不过滤：设计师把 195x195 交成 198x198 是常事，硬过滤会让他
   * 反而选不到本该选的那个槽位。pag 读不出尺寸，就退回按界面分组。
   */
  const options = useMemo(() => {
    const dimension = size ? `${size.width}x${size.height}` : null;
    const fit: ControlCenterFileOption[] = [];
    const rest: ControlCenterFileOptionGroup[] = [];

    CONTROL_CENTER_FILE_OPTIONS.forEach((group) => {
      const usable = group.options.filter(
        (option) => !taken.has(option.value) || option.value === target,
      );
      if (!usable.length) return;
      if (!dimension) {
        rest.push({ label: group.label, options: usable });
        return;
      }
      fit.push(...usable.filter((option) => option.dimension === dimension));
      const miss = usable.filter((option) => option.dimension !== dimension);
      if (miss.length) rest.push({ label: group.label, options: miss });
    });

    if (!fit.length) return rest;
    return [{ label: `尺寸相符 · ${dimension}`, options: fit }, ...rest];
  }, [size, taken, target]);

  return (
    <div className={styles.item}>
      <AssetThumb file={file} onSize={setSize} />
      <Button variant="filled" color="default" className={styles.fileBtn}>
        <Typography.Text
          style={{ width: 200 }}
          ellipsis={{ tooltip: file.name }}
        >
          {file.name}
        </Typography.Text>
      </Button>
      <Select
        style={{ width: 380 }}
        allowClear
        showSearch={{
          // 中文名和包内文件名都能搜，输入「手电」或 flashlight 都命中
          filterOption: (input, option) =>
            Boolean(
              asFileOption(option)?.keywords.includes(input.toLowerCase()),
            ),
        }}
        placeholder="UnSelect"
        options={options}
        optionRender={(option) => {
          const data = asFileOption(option.data);
          return (
            <div>
              <div>{data?.label}</div>
              <div className={styles.optionSub}>
                {data?.section} · {data?.value}
              </div>
            </div>
          );
        }}
        value={target}
        onChange={(next) => onTargetChange(file.name, next ?? null)}
      />
      <Button
        type="text"
        icon={<DeleteOutlined />}
        onClick={() => onRemove(file.name)}
      />
    </div>
  );
};

type Props = {
  value: ControlCenterFormValue;
  onChange: (value: ControlCenterFormValue) => void;
};

/**
 * Control Center 表单：上传整包 zip（或零散文件），逐个指定它是包内的哪个文件。
 * 只收图片和 pag；control_spec.json 是导入整包时才需要的，这里不识别。
 */
const AddControlCenterModal: React.FC<Props> = ({ value, onChange }) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [reading, setReading] = useState(false);

  /** 一个包内文件名只能被一个上传文件占用，怎么用见 AssetRow 的 options */
  const taken = useMemo(
    () => new Set(Object.values(value.targets)),
    [value.targets],
  );

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
          const assets = await extractFromZip(file);
          if (!assets.length) {
            message.error(`${file.name} 里没有可用文件`);
            continue;
          }
          collected.push(...assets);
          continue;
        }
        if (isAssetFile(file)) {
          collected.push(file);
          continue;
        }
        message.error(`${file.name} 不是 zip、图片或 pag`);
      }

      if (collected.length) {
        const files = mergeFiles(value.files, collected);
        onChange({
          files,
          targets: mergeTargets(value.targets, collected, files),
        });
      }
    } catch {
      message.error('读取失败，请重试');
    } finally {
      setReading(false);
    }
  };

  const onRemove = (name: string) => {
    const { [name]: _, ...restTargets } = value.targets;
    onChange({
      files: value.files.filter((file) => file.name !== name),
      targets: restTargets,
    });
  };

  const onTargetChange = (filename: string, target: string | null) => {
    const nextTargets = { ...value.targets };
    if (target) nextTargets[filename] = target;
    else delete nextTargets[filename];
    onChange({ ...value, targets: nextTargets });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <span className={styles.label}>Control Center</span>
        <span className={styles.tip}>
          可上传整包
          zip，或一个一个选文件；同名文件会覆盖；文件名对得上会自动选中
        </span>
        <Flex gap={12}>
          <Upload
            accept=".zip,.png,.jpg,.jpeg,.pag"
            multiple
            fileList={[]}
            beforeUpload={() => false}
            onChange={onUploadChange}
          >
            <Button variant="filled" color="default" loading={reading}>
              <UploadOutlined />
              upload zip or files
            </Button>
          </Upload>
          <Button
            disabled={!value.files.length}
            variant="filled"
            color="danger"
            onClick={() => onChange(EMPTY_CONTROL_CENTER_VALUE)}
          >
            Clear All
          </Button>
        </Flex>
        {value.files.length ? (
          <span className={styles.tip}>共 {value.files.length} 个文件</span>
        ) : null}
        {value.files.length ? (
          <div className={styles.list}>
            {value.files.map((file) => (
              <AssetRow
                key={file.name}
                file={file}
                target={value.targets[file.name]}
                taken={taken}
                onTargetChange={onTargetChange}
                onRemove={onRemove}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AddControlCenterModal;
