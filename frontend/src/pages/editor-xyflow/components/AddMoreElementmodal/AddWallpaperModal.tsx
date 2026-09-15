import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { App, Button, Flex, Segmented, Typography, Upload } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import { readVideoSize } from './AddStickerModal';
import { WallpaperDefaultConfig } from '@/editor-core/defaultConfig';
import { uploadProjectFile, uploadProjectImage, uploadProjectLottie } from '../../service';

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
  preview: css`
    width: 48px;
    height: 48px;
    border-radius: 4px;
    object-fit: contain;
    background: ${token.colorFillQuaternary};
  `,
  videoPreview: css`
    width: 37px;
    height: 80px;
    border-radius: 4px;
    object-fit: contain;
    background: #000;
  `,
}));

type WallpaperSlotSpec = {
  fileName: string;
  expectedWidth: number;
  expectedHeight: number;
  format: string;
  kind?: 'image' | 'video' | 'lottie';
};

export type LiveWallpaperSystem = 'ios' | 'android';

export type WallpaperFormValue = {
    wallpaperArrays: (File | null)[];
    wallpaperIpadArrays: (File | null)[];
    wallpaperIpad: File | null;
    wallpaper: File | null;
    wallpaperDepthPreview: File | null;
    liveSystem: LiveWallpaperSystem;
    liveFile: File | null;
    diyLottie: File | null;
}
export const EMPTY_WALLPAPER_VALUE: WallpaperFormValue = {
    wallpaperArrays: [],
    wallpaperIpadArrays: [],
    wallpaperIpad: null,
    wallpaper: null,
    wallpaperDepthPreview: null,
    liveSystem: 'ios',
    liveFile: null,
    diyLottie: null,
  };
type Props = {
    value: WallpaperFormValue;
    onChange: (value: WallpaperFormValue) => void;
    wallpaperType: string;
};

const handlerPhotoShuffle = () => {
    const res = [];
    for (let i = 0; i < 5; i++) {
        res.push({
            fileName: `wallpaper_${i+1}.jpg`,
            expectedWidth: 887,
            expectedHeight: 1920,
            format: 'jpg'
        })
        res.push({
            fileName: `wallpaper_ipad_${i+1}.jpg`,
            expectedWidth: 2048,
            expectedHeight: 2732,
            format: 'jpg'
        })
    }
    return res;
}
const wallpaperFormMap: Record<string, WallpaperSlotSpec[]> = {
    normal_wallpaper: [{
        fileName: 'wallpaper.jpg',
        expectedWidth: 887,
        expectedHeight: 1920,
        format: 'jpg'
    }, {
        fileName: 'wallpaper_ipad.jpg',
        expectedWidth: 2048,
        expectedHeight: 2732,
        format: 'jpg'
    }],
    photo_shuffle: [...handlerPhotoShuffle()],
    depth_wallpaper: [{
        fileName: 'wallpaper.jpg',
        expectedWidth: 887,
        expectedHeight: 1920,
        format: 'jpg'
    }, {
        fileName: 'wallpaper_depth_preview.jpg',
        expectedWidth: 887,
        expectedHeight: 1920,
        format: 'jpg'
    }],
    contact_poster: [{
        fileName: 'wallpaper.jpg',
        expectedWidth: 887,
        expectedHeight: 1920,
        format: 'jpg'
    }, {
        fileName: 'wallpaper_depth_preview.jpg',
        expectedWidth: 887,
        expectedHeight: 1920,
        format: 'jpg'
    }],
    dynamicisland_wallpaper: [{
        fileName: 'wallpaper.jpg',
        expectedWidth: 887,
        expectedHeight: 1920,
        format: 'jpg'
    }],
    chat_wallpaper: [{
        fileName: 'wallpaper.jpg',
        expectedWidth: 887,
        expectedHeight: 1920,
        format: 'jpg'
    }, {
        fileName: 'wallpaper_ipad.jpg',
        expectedWidth: 2048,
        expectedHeight: 2732,
        format: 'jpg'
    }]
}

const LIVE_SIZE = { width: 886, height: 1920 };

const getLiveSlotSpec = (system: LiveWallpaperSystem): WallpaperSlotSpec =>
  system === 'android'
    ? {
        fileName: 'live_wallpaper.mp4',
        expectedWidth: LIVE_SIZE.width,
        expectedHeight: LIVE_SIZE.height,
        format: 'mp4',
        kind: 'video',
      }
    : {
        fileName: 'live_wallpaper.mov',
        expectedWidth: LIVE_SIZE.width,
        expectedHeight: LIVE_SIZE.height,
        format: 'mov',
        kind: 'video',
      };

const DIY_LOTTIE_SPEC: WallpaperSlotSpec = {
  fileName: 'diy_live_wallpaper.lottie',
  expectedWidth: 886,
  expectedHeight: 1920,
  format: 'lottie',
  kind: 'lottie',
};

const WALLPAPER_TEMPLATE: Record<
  string,
  keyof typeof WallpaperDefaultConfig
> = {
  normal_wallpaper: 'Wallpaper',
  photo_shuffle: 'Photo Shuffles',
  depth_wallpaper: 'Wallpaper Depth',
  contact_poster: 'Contact Poster',
  dynamicisland_wallpaper: 'Dynamicisland Wallpaper',
  chat_wallpaper: 'Chat Wallpaper',
  diy_live_wallpaper: 'Diy Live Wallpaper',
};

const cloneWallpaperTemplate = (
  wallpaperType: string,
  liveSystem: LiveWallpaperSystem,
) => {
  const key =
    wallpaperType === 'live_wallpaper'
      ? liveSystem === 'android'
        ? 'Live Wallpaper Android'
        : 'Live Wallpaper IOS'
      : WALLPAPER_TEMPLATE[wallpaperType];
  if (!key) return null;
  return structuredClone(WallpaperDefaultConfig[key]) as Record<string, any>;
};

export const validateWallpaperValue = (
  value: WallpaperFormValue,
  wallpaperType: string,
) => {
  if (!wallpaperType) return '请选择壁纸类型';
  if (wallpaperType === 'live_wallpaper' || wallpaperType === 'diy_live_wallpaper') {
    return null;
  }
  if (!WALLPAPER_TEMPLATE[wallpaperType]) return '该壁纸类型暂未实现';
  return null;
};

export const hasWallpaperFiles = (
  value: WallpaperFormValue,
  wallpaperType: string,
) => {
  if (wallpaperType === 'live_wallpaper') return Boolean(value.liveFile);
  if (wallpaperType === 'diy_live_wallpaper') return Boolean(value.diyLottie);
  if (wallpaperType === 'photo_shuffle') {
    return (
      value.wallpaperArrays.some(Boolean) ||
      value.wallpaperIpadArrays.some(Boolean)
    );
  }
  return Boolean(
    value.wallpaper || value.wallpaperIpad || value.wallpaperDepthPreview,
  );
};

const fillImageSource = async (
  projectId: string,
  item: { source?: string } | undefined,
  file: File | null,
) => {
  if (!item || !file) return 0;
  const { url } = await uploadProjectImage(projectId, file);
  item.source = url;
  return 1;
};

export const uploadWallpaperFiles = async (
  projectId: string,
  value: WallpaperFormValue,
  wallpaperType: string,
) => {
  const config = cloneWallpaperTemplate(wallpaperType, value.liveSystem);
  if (!config) {
    throw new Error('该壁纸类型暂未实现');
  }
  let uploadedCount = 0;

  if (wallpaperType === 'live_wallpaper') {
    if (value.liveFile) {
      const { url } = await uploadProjectFile(projectId, value.liveFile);
      if (value.liveSystem === 'android') {
        if (config.mp4) config.mp4.mp4source = url;
      } else if (config.mov) {
        config.mov.movsource = url;
      }
      uploadedCount += 1;
    }
    return { config, uploadedCount };
  }

  if (wallpaperType === 'diy_live_wallpaper') {
    if (value.diyLottie && config.diy_live_wallpaper) {
      const { url } = await uploadProjectLottie(projectId, value.diyLottie);
      config.diy_live_wallpaper.lottieSource = url;
      uploadedCount += 1;
    }
    return { config, uploadedCount };
  }

  uploadedCount += await fillImageSource(
    projectId,
    config.wallpaper,
    value.wallpaper,
  );
  uploadedCount += await fillImageSource(
    projectId,
    config.wallpaper_ipad,
    value.wallpaperIpad,
  );
  uploadedCount += await fillImageSource(
    projectId,
    config.wallpaper_depth_preview,
    value.wallpaperDepthPreview,
  );

  if (wallpaperType === 'photo_shuffle') {
    for (let i = 0; i < 5; i += 1) {
      uploadedCount += await fillImageSource(
        projectId,
        config[`wallpaper_${i + 1}`],
        value.wallpaperArrays[i] ?? null,
      );
      uploadedCount += await fillImageSource(
        projectId,
        config[`wallpaper_ipad_${i + 1}`],
        value.wallpaperIpadArrays[i] ?? null,
      );
    }
  }

  return { config, uploadedCount };
};

export const buildWallpaperConfig = (result: { config: Record<string, any> }) =>
  result.config;

export const buildEmptyWallpaperConfig = (
  wallpaperType: string,
  liveSystem: LiveWallpaperSystem,
) => cloneWallpaperTemplate(wallpaperType, liveSystem);

const setArrayItem = (
  list: (File | null)[],
  index: number,
  file: File | null,
) => {
  const next = list.slice();
  while (next.length <= index) next.push(null);
  next[index] = file;
  return next;
};

const getSlotFile = (value: WallpaperFormValue, fileName: string): File | null => {
  const numberedIpad = fileName.match(/^wallpaper_ipad_(\d+)\./i);
  if (numberedIpad) {
    return value.wallpaperIpadArrays[Number(numberedIpad[1]) - 1] ?? null;
  }
  const numbered = fileName.match(/^wallpaper_(\d+)\./i);
  if (numbered) {
    return value.wallpaperArrays[Number(numbered[1]) - 1] ?? null;
  }
  if (fileName === 'wallpaper_depth_preview.jpg') return value.wallpaperDepthPreview;
  if (fileName === 'wallpaper_ipad.jpg') return value.wallpaperIpad;
  if (fileName === 'wallpaper.jpg') return value.wallpaper;
  if (fileName.startsWith('live_wallpaper.')) return value.liveFile;
  return null;
};

const setSlotFile = (
  value: WallpaperFormValue,
  fileName: string,
  file: File | null,
): WallpaperFormValue => {
  const numberedIpad = fileName.match(/^wallpaper_ipad_(\d+)\./i);
  if (numberedIpad) {
    return {
      ...value,
      wallpaperIpadArrays: setArrayItem(
        value.wallpaperIpadArrays,
        Number(numberedIpad[1]) - 1,
        file,
      ),
    };
  }
  const numbered = fileName.match(/^wallpaper_(\d+)\./i);
  if (numbered) {
    return {
      ...value,
      wallpaperArrays: setArrayItem(
        value.wallpaperArrays,
        Number(numbered[1]) - 1,
        file,
      ),
    };
  }
  if (fileName === 'wallpaper_depth_preview.jpg') {
    return { ...value, wallpaperDepthPreview: file };
  }
  if (fileName === 'wallpaper_ipad.jpg') {
    return { ...value, wallpaperIpad: file };
  }
  if (fileName === 'wallpaper.jpg') {
    return { ...value, wallpaper: file };
  }
  if (fileName.startsWith('live_wallpaper.')) {
    return { ...value, liveFile: file };
  }
  return value;
};

type CheckResult = { ok: true; warning?: string } | { ok: false; error: string };

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

const checkWallpaperFile = async (
  spec: WallpaperSlotSpec,
  file: File,
): Promise<CheckResult> => {
  const ext = spec.format.toLowerCase();
  if (!file.name.toLowerCase().endsWith(`.${ext}`)) {
    return { ok: false, error: `请选择 .${ext} 文件` };
  }
  if (spec.kind === 'lottie') return { ok: true };
  let size: { width: number; height: number };
  try {
    size =
      spec.kind === 'video'
        ? await readVideoSize(file)
        : await readImageSize(file);
  } catch {
    return {
      ok: true,
      warning: `无法读取 ${file.name} 的尺寸，请自行确认是 ${spec.expectedWidth}×${spec.expectedHeight}`,
    };
  }
  if (size.width !== spec.expectedWidth || size.height !== spec.expectedHeight) {
    return {
      ok: false,
      error: `${spec.fileName} 必须是 ${spec.expectedWidth}×${spec.expectedHeight}，当前是 ${size.width}×${size.height}`,
    };
  }
  return { ok: true };
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

const VideoThumb: React.FC<{ file: File }> = ({ file }) => {
  const { styles } = useStyles();
  const [url, setUrl] = useState('');

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  if (!url) return null;
  return (
    <video
      className={styles.videoPreview}
      src={url}
      muted
      loop
      autoPlay
      playsInline
    />
  );
};

const FileSlotRow: React.FC<{
  spec: WallpaperSlotSpec;
  file: File | null;
  onPick: (file: File | null) => void;
}> = ({ spec, file, onPick }) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [checking, setChecking] = useState(false);

  const onUploadChange: UploadProps['onChange'] = async ({ fileList }) => {
    const raw = fileList.slice(-1)[0]?.originFileObj as File | undefined;
    if (!raw) return;
    setChecking(true);
    try {
      const result = await checkWallpaperFile(spec, raw);
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
      <span className={styles.label}>{spec.fileName}</span>
      <span className={styles.tip}>
        {spec.kind === 'lottie'
          ? `.${spec.format} - 画布 ${spec.expectedWidth}×${spec.expectedHeight}`
          : `.${spec.format} - ${spec.expectedWidth}×${spec.expectedHeight}`}
      </span>
      {file ? (
        <Flex align="center" gap={8}>
          {spec.kind === 'video' ? (
            <VideoThumb file={file} />
          ) : spec.kind === 'lottie' ? null : (
            <ImageThumb file={file} />
          )}
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
          accept={
            spec.kind === 'video' || spec.kind === 'lottie'
              ? `.${spec.format}`
              : `.${spec.format},.jpeg`
          }
          maxCount={1}
          fileList={[]}
          beforeUpload={() => false}
          onChange={onUploadChange}
        >
          <Button variant="filled" color="default" loading={checking}>
            <UploadOutlined />
            {`upload ${spec.fileName}`}
          </Button>
        </Upload>
      )}
    </div>
  );
};

const AddWallpaperModal: React.FC<Props> = ({ value, onChange, wallpaperType }) => {
    const { styles } = useStyles();

    if (wallpaperType === 'live_wallpaper') {
      const spec = getLiveSlotSpec(value.liveSystem);
      return (
        <div className={styles.wrap}>
          <Flex gap={16} vertical>
            <Segmented<LiveWallpaperSystem>
              block
              value={value.liveSystem}
              onChange={(system) =>
                onChange({ ...value, liveSystem: system, liveFile: null })
              }
              options={[
                { label: 'iOS', value: 'ios' },
                { label: 'Android', value: 'android' },
              ]}
            />
            <FileSlotRow
              key={spec.fileName}
              spec={spec}
              file={value.liveFile}
              onPick={(file) => onChange({ ...value, liveFile: file })}
            />
          </Flex>
        </div>
      );
    }

    if (wallpaperType === 'diy_live_wallpaper') {
      return (
        <div className={styles.wrap}>
          <FileSlotRow
            spec={DIY_LOTTIE_SPEC}
            file={value.diyLottie}
            onPick={(file) => onChange({ ...value, diyLottie: file })}
          />
        </div>
      );
    }

    const slots = wallpaperFormMap[wallpaperType];

    if (!slots?.length) {
      return <div className={styles.wrap}>暂未实现</div>;
    }

    return (
      <div className={styles.wrap}>
        <Flex gap={16} vertical>
          {slots.map((spec) => (
            <FileSlotRow
              key={spec.fileName}
              spec={spec}
              file={getSlotFile(value, spec.fileName)}
              onPick={(file) => onChange(setSlotFile(value, spec.fileName, file))}
            />
          ))}
        </Flex>
      </div>
    );
}

export default AddWallpaperModal;