import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { App, Button, Flex, Typography, Upload } from 'antd';
import { createStyles } from 'antd-style';
import { PAGView, types } from 'libpag-lite';
import React, { useEffect, useRef, useState } from 'react';
import { readVideoSize } from './AddStickerModal';
import { uploadProjectFile } from '../../service';
import { ChargingAnimationDefaultConfig } from '@/editor-core/defaultConfig';

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
  fileBtn: css`
    flex: 1;
    justify-content: flex-start;
    overflow: hidden;
  `,
  /** 充电动画多是竖屏且带透明通道，预览底色压黑更接近真机效果 */
  stage: css`
    position: relative;
    width: 180px;
    height: 320px;
    border-radius: 8px;
    overflow: hidden;
    background: #000;
    border: 1px solid var(--editor-panel-border, ${token.colorBorderSecondary});
  `,
  /** canvas 的 CSS 尺寸就是 libpag 的取景尺寸，必须显式给满 */
  media: css`
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  `,
  error: css`
    color: ${token.colorError};
    font-size: 12px;
    white-space: pre-wrap;
  `,
}));

type ChargingSlot = 'pag' | 'mp4';

/** 用 Record 绑定，加上传位时改 ChargingSlot 和 SLOT_SPEC 就够，表单值不会漏 */
export type ChargingAnimationFormValue = Record<ChargingSlot, File | null>;

export const EMPTY_CHARGING_ANIMATION_VALUE: ChargingAnimationFormValue = {
  pag: null,
  mp4: null,
};

export type ChargingAnimationUploadResult = {
  pag?: string;
  mp4?: string;
};

/** 两个文件都是资源包必需的，少一个都不能提交 */
const REQUIRED_SLOTS: readonly ChargingSlot[] = ['pag', 'mp4'];

/** 把上传拿到的 url 填进默认模板，产出 addChargingAnimation 要的 config */
export const buildChargingAnimationConfig = (
  result: ChargingAnimationUploadResult,
) => {
  const config = JSON.parse(
    JSON.stringify(ChargingAnimationDefaultConfig),
  ) as Record<string, any>;
  config.preview.pagsource = result.pag ?? '';
  config.charging_wallpaper.mp4source = result.mp4 ?? '';
  return config;
};

/**
 * 点 add 时才真正上传：pag / mp4 都走文件接口。
 * 串行上传，前一个失败就不再传后面的，少留没人引用的文件。
 */
export const uploadChargingAnimationFiles = async (
  projectId: string,
  value: ChargingAnimationFormValue,
) => {
  const result: ChargingAnimationUploadResult = {};
  for (const slot of REQUIRED_SLOTS) {
    const file = value[slot];
    if (!file) continue;
    const { url } = await uploadProjectFile(projectId, file);
    result[slot] = url;
  }
  return result;
};

/** mp4 必须是这个分辨率，和端上充电动画的画布一致 */
const MP4_SIZE = { width: 886, height: 1920 };

/** 每个上传位的文案和后缀，校验提示和界面共用同一份 label */
const SLOT_SPEC: Record<
  ChargingSlot,
  { label: string; ext: string; tip: string }
> = {
  pag: {
    label: 'preview.pag',
    ext: 'pag',
    tip: '.pag - 仅支持单一 BMP 序列帧，Firefox 无法播放',
  },
  mp4: {
    label: 'charging_wallpaper.mp4',
    ext: 'mp4',
    tip: `.mp4 - ${MP4_SIZE.width}×${MP4_SIZE.height}`,
  },
};

/** 缺文件就返回提示文案，齐了返回 null */
export const validateChargingAnimationValue = (
  value: ChargingAnimationFormValue,
) => {
  const missing = REQUIRED_SLOTS.filter((slot) => !value[slot]);
  if (!missing.length) return null;
  return `请先上传 ${missing.map((slot) => SLOT_SPEC[slot].label).join(' 和 ')}`;
};

type CheckResult =
  | { ok: true; warning?: string }
  | { ok: false; error: string };

const checkMp4 = async (file: File): Promise<CheckResult> => {
  if (!file.name.toLowerCase().endsWith('.mp4')) {
    return { ok: false, error: '请选择 .mp4 文件' };
  }
  let size: { width: number; height: number };
  try {
    size = await readVideoSize(file);
  } catch {
    // 编码浏览器解不出来时拿不到尺寸，没法校验，只能提示后放过
    return {
      ok: true,
      warning: `无法读取 ${file.name} 的尺寸，请自行确认是 ${MP4_SIZE.width}×${MP4_SIZE.height}`,
    };
  }
  if (size.width !== MP4_SIZE.width || size.height !== MP4_SIZE.height) {
    return {
      ok: false,
      error: `mp4 必须是 ${MP4_SIZE.width}×${MP4_SIZE.height}，当前是 ${size.width}×${size.height}`,
    };
  }
  return { ok: true };
};

/** lite 版只认单一 BMP 序列帧的 PAG，解析不出序列时抛的就是这句 */
const NO_BMP_SEQUENCE = 'has no BMP video sequence';

const toErrorText = (error: unknown) => {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes(NO_BMP_SEQUENCE)) {
    return '该 PAG 不是单一 BMP 序列帧，播放器解不了。请在 AE 导出时于根节点勾选 BMP 重新导出。';
  }
  return `PAG 解析失败：${raw}`;
};

/** 把 File 解成 ArrayBuffer 交给 libpag 渲染，循环播放 */
const PagPreview: React.FC<{ file: File }> = ({ file }) => {
  const { styles } = useStyles();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let alive = true;
    let view: ReturnType<typeof PAGView.init> | null = null;
    setErrorText('');
    void (async () => {
      try {
        const buffer = await file.arrayBuffer();
        // await 期间可能已经换了文件或卸载，canvas 会被复用，这里必须重新确认
        if (!alive || !canvasRef.current) return;
        view = PAGView.init(buffer, canvasRef.current, {
          renderingMode: types.RenderingMode.WebGL,
        });
        view.setRepeatCount(0);
        await view.play();
      } catch (error) {
        if (alive) setErrorText(toErrorText(error));
      }
    })();
    return () => {
      alive = false;
      // 不 destroy 的话 video 元素和 WebGL context 会一直留着
      view?.destroy();
    };
  }, [file]);

  return (
    <div className={styles.row}>
      <div className={styles.stage}>
        <canvas ref={canvasRef} className={styles.media} />
      </div>
      {errorText ? <span className={styles.error}>{errorText}</span> : null}
    </div>
  );
};

const Mp4Preview: React.FC<{ file: File }> = ({ file }) => {
  const { styles } = useStyles();
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    setFailed(false);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return (
    <div className={styles.row}>
      <div className={styles.stage}>
        {url ? (
          <video
            className={styles.media}
            src={url}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setFailed(true)}
          />
        ) : null}
      </div>
      {failed ? (
        <span className={styles.error}>
          该 mp4 的编码浏览器放不了，只能在真机确认
        </span>
      ) : null}
    </div>
  );
};

/** pag 和 mp4 两个上传位的公共外壳：标题、说明、上传/换文件、预览 */
const FileSlotRow: React.FC<{
  label: string;
  tip: string;
  ext: string;
  file: File | null;
  check?: (file: File) => Promise<CheckResult>;
  onPick: (file: File | null) => void;
  children?: React.ReactNode;
}> = ({ label, tip, ext, file, check, onPick, children }) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [checking, setChecking] = useState(false);

  const onUploadChange: UploadProps['onChange'] = async ({ fileList }) => {
    const raw = fileList.slice(-1)[0]?.originFileObj as File | undefined;
    if (!raw) return;
    if (!check) {
      onPick(raw);
      return;
    }
    setChecking(true);
    try {
      const result = await check(raw);
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

  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.tip}>{tip}</span>
      {file ? (
        <Flex align="center" gap={8}>
          <Button variant="filled" color="default" className={styles.fileBtn}>
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
          accept={`.${ext}`}
          maxCount={1}
          fileList={[]}
          beforeUpload={() => false}
          onChange={onUploadChange}
        >
          <Button variant="filled" color="default" loading={checking}>
            <UploadOutlined />
            {`upload ${label}`}
          </Button>
        </Upload>
      )}
      {children}
    </div>
  );
};

type Props = {
  value: ChargingAnimationFormValue;
  onChange: (value: ChargingAnimationFormValue) => void;
};

/** 充电动画表单：本地选 .pag / .mp4 并预览，真正上传在点 Add 时发生 */
const AddChargingAnimationModal: React.FC<Props> = ({ value, onChange }) => {
  const { styles } = useStyles();

  return (
    <div className={styles.wrap}>
      <Flex gap={16} vertical>
        <FileSlotRow
          label={SLOT_SPEC.pag.label}
          tip={SLOT_SPEC.pag.tip}
          ext={SLOT_SPEC.pag.ext}
          file={value.pag}
          onPick={(pag) => onChange({ ...value, pag })}
        >
          {/* key 带上文件标识，换文件时重建 canvas，省掉复用 canvas 的清屏问题 */}
          {value.pag ? (
            <PagPreview
              key={`${value.pag.name}-${value.pag.lastModified}`}
              file={value.pag}
            />
          ) : null}
        </FileSlotRow>
        <FileSlotRow
          label={SLOT_SPEC.mp4.label}
          tip={SLOT_SPEC.mp4.tip}
          ext={SLOT_SPEC.mp4.ext}
          file={value.mp4}
          check={checkMp4}
          onPick={(mp4) => onChange({ ...value, mp4 })}
        >
          {value.mp4 ? (
            <Mp4Preview
              key={`${value.mp4.name}-${value.mp4.lastModified}`}
              file={value.mp4}
            />
          ) : null}
        </FileSlotRow>
      </Flex>
    </div>
  );
};

export default AddChargingAnimationModal;
