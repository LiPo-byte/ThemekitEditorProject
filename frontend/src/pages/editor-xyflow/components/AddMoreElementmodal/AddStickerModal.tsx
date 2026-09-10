import { MovSvg } from '@/icons';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { App, Button, Flex, Switch, Typography, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import { StickerDefaultConfig } from '@/editor-core/defaultConfig';
import { uploadProjectFile, uploadProjectImage } from '../../service';

const useStyles = createStyles(({ token, css }) => ({
  wrap: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px 0;
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
    margin-right: 20px;
  `,
  tip: css`
    color: ${token.colorTextTertiary};
    font-size: 12px;
  `,
  /** 图片和 mov 的缩略图共用一套尺寸，两种上传位排版才一致 */
  preview: css`
    width: 28px;
    height: 28px;
    margin-right: 8px;
    border-radius: 4px;
    object-fit: contain;
    background: ${token.colorFillQuaternary};
  `,
  previewIcon: css`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
  `,
  fileBtn: css`
    flex: 1;
    justify-content: flex-start;
    overflow: hidden;
  `,
}));

type StickerSlot = 'webp' | 'mov' | 'png';

/** 每个上传位的规格：后缀 + 必须的像素尺寸；mov 要用 video 才能读到尺寸 */
const SLOT_SPEC: Record<
  StickerSlot,
  {
    label: string;
    ext: string;
    width: number;
    height: number;
    kind: 'image' | 'video';
  }
> = {
  webp: { label: 'list_view.webp', ext: 'webp', width: 192, height: 192, kind: 'image' },
  mov: { label: 'sticker.mov', ext: 'mov', width: 450, height: 450, kind: 'video' },
  png: { label: 'sticker.png', ext: 'png', width: 450, height: 450, kind: 'image' },
};

const GIF_SLOTS: readonly StickerSlot[] = ['webp', 'mov'];
const STATIC_SLOTS: readonly StickerSlot[] = ['png'];

export type StickerFormValue = {
  isGif: boolean;
  webp: File | null;
  mov: File | null;
  png: File | null;
};

export const EMPTY_STICKER_VALUE: StickerFormValue = {
  isGif: false,
  webp: null,
  mov: null,
  png: null,
};

/** 当前 isGif 下真正需要的上传位，另一套残留的选择直接忽略 */
const getRequiredSlots = (isGif: boolean) => (isGif ? GIF_SLOTS : STATIC_SLOTS);

/** 缺文件就返回提示文案，齐了返回 null */
export const validateStickerValue = (value: StickerFormValue) => {
  const missing = getRequiredSlots(value.isGif).filter((slot) => !value[slot]);
  if (!missing.length) return null;
  return `请先上传 ${missing.map((slot) => SLOT_SPEC[slot].label).join(' 和 ')}`;
};

export type StickerUploadResult = {
  isGif: boolean;
  webp?: string;
  mov?: string;
  png?: string;
};

/**
 * 点 add 时才真正上传：webp/png 走图片接口，mov 走文件接口。
 * 串行上传，前一个失败就不再传后面的，少留没人引用的文件。
 */
export const uploadStickerFiles = async (
  projectId: string,
  value: StickerFormValue,
) => {
  const result: StickerUploadResult = { isGif: value.isGif };
  for (const slot of getRequiredSlots(value.isGif)) {
    const file = value[slot];
    if (!file) continue;
    const { url } =
      SLOT_SPEC[slot].kind === 'image'
        ? await uploadProjectImage(projectId, file)
        : await uploadProjectFile(projectId, file);
    result[slot] = url;
  }
  return result;
};

/** 按 isGif 取对应模板，把上传拿到的 url 填进去，产出 addSticker 要的 config */
export const buildStickerConfig = (result: StickerUploadResult) => {
  const template = result.isGif
    ? StickerDefaultConfig['Sticker Gif']
    : StickerDefaultConfig.Sticker;
  const config = JSON.parse(JSON.stringify(template)) as Record<string, any>;
  if (result.isGif) {
    config.list_view.source = result.webp ?? '';
    config.sticker.movsource = result.mov ?? '';
  } else {
    config.sticker.source = result.png ?? '';
  }
  return config;
};

const readImageSize = (file: File) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image decode failed'));
    };
    img.src = url;
  });

const readVideoSize = (file: File) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const { videoWidth, videoHeight } = video;
      URL.revokeObjectURL(url);
      if (!videoWidth || !videoHeight) {
        reject(new Error('video size unavailable'));
        return;
      }
      resolve({ width: videoWidth, height: videoHeight });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('video decode failed'));
    };
    video.src = url;
  });

type CheckResult = { ok: true; warning?: string } | { ok: false; error: string };

const checkFile = async (
  slot: StickerSlot,
  file: File,
): Promise<CheckResult> => {
  const spec = SLOT_SPEC[slot];
  if (!file.name.toLowerCase().endsWith(`.${spec.ext}`)) {
    return { ok: false, error: `请选择 .${spec.ext} 文件` };
  }
  let size: { width: number; height: number };
  try {
    size =
      spec.kind === 'image'
        ? await readImageSize(file)
        : await readVideoSize(file);
  } catch {
    // ProRes / HEVC 之类的 mov 浏览器解不出来，拿不到尺寸就没法校验，只能提示后放过
    return {
      ok: true,
      warning: `无法读取 ${file.name} 的尺寸，请自行确认是 ${spec.width}×${spec.height}`,
    };
  }
  if (size.width !== spec.width || size.height !== spec.height) {
    return {
      ok: false,
      error: `${spec.label} 必须是 ${spec.width}×${spec.height}，当前是 ${size.width}×${size.height}`,
    };
  }
  return { ok: true };
};

/** File -> 本地预览 URL，换文件或卸载时释放，避免 objectURL 泄漏 */
const useObjectUrl = (file: File | null) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!file) {
      setUrl('');
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
};

const StickerSlotRow: React.FC<{
  slot: StickerSlot;
  file: File | null;
  onPick: (file: File | null) => void;
}> = ({ slot, file, onPick }) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const spec = SLOT_SPEC[slot];
  const [checking, setChecking] = useState(false);
  const previewUrl = useObjectUrl(file);
  /** mov 的编码浏览器可能放不了，播放失败就退回图标 */
  const [videoPreviewFailed, setVideoPreviewFailed] = useState(false);
  useEffect(() => {
    setVideoPreviewFailed(false);
  }, [file]);

  const onUploadChange: UploadProps['onChange'] = async ({ fileList }) => {
    const raw = fileList.slice(-1)[0]?.originFileObj as File | undefined;
    if (!raw) return;
    setChecking(true);
    try {
      const result = await checkFile(slot, raw);
      if (!result.ok) {
        message.error(result.error);
        return;
      }
      if (result.warning) message.warning(result.warning);
      onPick(raw);
    } finally {
      setChecking(false);
    }
  };

  const renderPreview = () => {
    if (!previewUrl) return null;
    if (spec.kind === 'image') {
      return <img className={styles.preview} src={previewUrl} alt="" />;
    }
    if (videoPreviewFailed) {
      return (
        <span className={styles.previewIcon}>
          <MovSvg />
        </span>
      );
    }
    // sticker 的 mov 是动图，小窗直接循环播放比只显示首帧更直观
    return (
      <video
        className={styles.preview}
        src={previewUrl}
        autoPlay
        loop
        muted
        playsInline
        onError={() => setVideoPreviewFailed(true)}
      />
    );
  };

  return (
    <div className={styles.row}>
      <span className={styles.label}>{spec.label}</span>
      <span className={styles.tip}>
        {`.${spec.ext} - ${spec.width}×${spec.height}`}
      </span>
      {file ? (
        <Flex align="center" gap={8}>
          <Button variant="filled" color="default" className={styles.fileBtn}>
            {renderPreview()}
            <Typography.Text
              style={{ width: 200 }}
              ellipsis={{ tooltip: file.name }}
            >
              {file.name}
            </Typography.Text>
          </Button>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => onPick(null)}
          />
        </Flex>
      ) : (
        <Upload
          accept={`.${spec.ext}`}
          maxCount={1}
          fileList={[]}
          beforeUpload={() => false}
          onChange={onUploadChange}
        >
          <Button variant="filled" color="default" loading={checking}>
            <UploadOutlined />
            {`upload ${spec.label}`}
          </Button>
        </Upload>
      )}
    </div>
  );
};

type Props = {
  value: StickerFormValue;
  onChange: (value: StickerFormValue) => void;
};

/**
 * Sticker 表单：isGif 打开时要 192×192 的 webp + 450×450 的 mov，关闭时要 450×450 的 png。
 * 只负责收集文件，上传和落库由外层面板处理。
 */
const AddStickerModal: React.FC<Props> = ({ value, onChange }) => {
  const { styles } = useStyles();
  // 切换 isGif 不清掉另一套文件，切回来还能用；提交时只取 getRequiredSlots 里的那套
  const slots = value.isGif ? GIF_SLOTS : STATIC_SLOTS;

  return (
    <div className={styles.wrap}>
      <Flex align="center">
        <span className={styles.label}>isGif</span>
        <Switch
          size="small"
          checked={value.isGif}
          onChange={(isGif) => onChange({ ...value, isGif })}
        />
      </Flex>
      {slots.map((slot) => (
        <StickerSlotRow
          key={slot}
          slot={slot}
          file={value[slot]}
          onPick={(file) => onChange({ ...value, [slot]: file })}
        />
      ))}
    </div>
  );
};

export default AddStickerModal;
