import { App, Button, Divider, Flex, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import React, { useMemo, useRef, useState } from 'react';
import {
  useEditorAddChargingAnimation,
  useEditorAddControlCenter,
  useEditorAddIconPack,
  useEditorAddSticker,
  useEditorAddWallpaper,
  useEditorProjectId,
} from '../../context';
import AddChargingAnimationModal, {
  buildChargingAnimationConfig,
  type ChargingAnimationFormValue,
  EMPTY_CHARGING_ANIMATION_VALUE,
  uploadChargingAnimationFiles,
  validateChargingAnimationValue,
} from './AddChargingAnimationModal';
import AddControlCenterModal, {
  buildControlCenterConfig,
  buildEmptyControlCenterConfig,
  type ControlCenterFormValue,
  type ControlCenterUploadProgress,
  EMPTY_CONTROL_CENTER_VALUE,
  uploadControlCenterFiles,
  validateControlCenterValue,
} from './AddControlCenterModal';
import AddIconPackModal, {
  buildEmptyIconPackConfig,
  buildIconPackConfig,
  EMPTY_ICON_PACK_VALUE,
  type IconPackFormValue,
  uploadIconPackFiles,
  validateIconPackValue,
} from './AddIconPackModal';
import AddStickerModal, {
  buildStickerConfig,
  EMPTY_STICKER_VALUE,
  type StickerFormValue,
  uploadStickerFiles,
  validateStickerValue,
} from './AddStickerModal';
import AddWallpaperModal, {
  buildEmptyWallpaperConfig,
  buildWallpaperConfig,
  EMPTY_WALLPAPER_VALUE,
  hasWallpaperFiles,
  uploadWallpaperFiles,
  validateWallpaperValue,
  type WallpaperFormValue,
} from './AddWallpaperModal';

const useStyles = createStyles(({ token, css }) => ({
  panel: css`
    position: absolute;
    bottom: 52px;
    transform: translateX(50%);
    width: 100%;
    height: 500px;
    border-radius: 12px;
    border: 1px solid var(--editor-panel-border, transparent);
    box-shadow: ${token.boxShadowSecondary};
    background: ${token.colorBgElevated}f2;
    backdrop-filter: blur(14px);
    z-index: 31;
    transition: transform 260ms ease, opacity 220ms ease;
    padding: 12px;
    color: ${token.colorTextSecondary};
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,
  panelClosed: css`
    transform: translateX(50%) translateY(500px);
    opacity: 0;
    pointer-events: none;
  `,
  header: css`
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  body: css`
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
  `,
  footer: css`
    flex: 0 0 auto;
  `,
  title: css`
    margin: 0;
    color: ${token.colorText};
  `,
  divider: css`
    margin: 0 -12px;
    width: calc(100% + 24px);
  `,
  /** 二级标签的展开/收起动画：0fr -> 1fr + 淡入 */
  subTagsWrap: css`
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition: grid-template-rows 220ms ease, opacity 200ms ease;
  `,
  subTagsWrapOpen: css`
    grid-template-rows: 1fr;
    opacity: 1;
  `,
  /** 二级标签较多，固定一行横向滚动，避免换行导致 header 高度跳动把 body 顶上顶下 */
  subTagsRow: css`
    min-height: 0;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
    > * {
      flex-wrap: nowrap;
    }
  `,
  /** 二级选中态换成紫色，和一级的主色蓝区分开；三层 & 是为了压过 antd 自带的 checked 样式 */
  subTagChecked: css`
    &&& {
      background: ${token.purple6};
      border-color: ${token.purple6};
      color: ${token.colorWhite};
      &:hover {
        background: ${token.purple5};
        border-color: ${token.purple5};
        color: ${token.colorWhite};
      }
    }
  `,
}));

type Props = {
  open: boolean;
  onClose: () => void;
};

type MoreSubTagItem = { label: string; value: string };
type MoreTagItem = MoreSubTagItem & { subTags?: readonly MoreSubTagItem[] };

/** value 不能和一级的 'wallpaper' 重名，否则二级选中值和一级分类没法区分 */
const subWallpaperTags = [
  { label: 'Normal Wallpaper', value: 'normal_wallpaper' },
  { label: 'Photo Shuffle', value: 'photo_shuffle' },
  { label: 'Depth Wallpaper', value: 'depth_wallpaper' },
  { label: 'Contact Poster', value: 'contact_poster' },
  { label: 'DynamicIsland Wallpaper', value: 'dynamicisland_wallpaper' },
  { label: 'Chat Wallpaper', value: 'chat_wallpaper' },
  { label: 'Live Wallpaper', value: 'live_wallpaper' },
  { label: 'Diy Live Wallpaper', value: 'diy_live_wallpaper' },
] as const;

const tagsData = [
  { label: 'Sticker', value: 'sticker' },
  { label: 'Charging Animation', value: 'charging_animation' },
  { label: 'Icon Pack', value: 'icon_pack' },
  { label: 'Control Center', value: 'control_center' },
  { label: 'Wallpaper', value: 'wallpaper', subTags: subWallpaperTags },
] as const satisfies readonly MoreTagItem[];
type MoreCategory = (typeof tagsData)[number]['value'];
/** 只取带 subTags 的一级标签，拿到所有二级取值的联合类型 */
type MoreSubCategory = Extract<
  (typeof tagsData)[number],
  { subTags: unknown }
>['subTags'][number]['value'];

// const tagOptions = tagsData.slice(0, 3).map(({ label, value }) => ({ label, value }));
const tagOptions = tagsData.map(({ label, value }) => ({ label, value }));

/** 每个一级标签默认的二级选中项 */
const DEFAULT_SUB_SELECTED: Partial<Record<MoreCategory, MoreSubCategory>> = {
  wallpaper: 'normal_wallpaper',
};

const getSubTags = (category: MoreCategory): readonly MoreSubTagItem[] => {
  const tag = tagsData.find((item) => item.value === category);
  return tag && 'subTags' in tag ? tag.subTags : [];
};

/** 一个一级分类要提供的东西：body 里的表单，以及可选的 add 行为 */
type MoreCategoryHandler = {
  render: () => React.ReactNode;
  /** 不填表示 add 还没接，点了只打日志 */
  onAdd?: () => void | Promise<void>;
};
/** 内容待定，先只有面板骨架：头部标题 + 可滚动 body + 底部操作区 */
const AddMoreElementModal: React.FC<Props> = ({ open, onClose }) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const projectId = useEditorProjectId();
  const addSticker = useEditorAddSticker();
  const addChargingAnimation = useEditorAddChargingAnimation();
  const addIconPack = useEditorAddIconPack();
  const addWallpaper = useEditorAddWallpaper();
  const addControlCenter = useEditorAddControlCenter();
  const [singleSelected, setSingleSelected] = useState<MoreCategory>('sticker');
  /** 二级选中按一级标签分别记住，来回切一级时保留各自上次的选择 */
  const [subSelectedMap, setSubSelectedMap] =
    useState<Partial<Record<MoreCategory, MoreSubCategory>>>(
      DEFAULT_SUB_SELECTED,
    );

  const subTags = useMemo(() => getSubTags(singleSelected), [singleSelected]);
  /** 当前一级没有二级标签时为 undefined；body 后续按 singleSelected + subSelected 筛选 */
  const subSelected = subTags.length
    ? subSelectedMap[singleSelected]
    : undefined;

  /** 收起动画期间仍要渲染上一次的二级标签，否则内容瞬间消失就看不到过渡 */
  const lastSubTagsRef = useRef<readonly MoreSubTagItem[]>(subTags);
  if (subTags.length) lastSubTagsRef.current = subTags;
  const subTagOptions = useMemo(
    () =>
      (subTags.length ? subTags : lastSubTagsRef.current).map(
        ({ label, value }) => ({
          label,
          value,
          className: value === subSelected ? styles.subTagChecked : undefined,
        }),
      ),
    [subTags, subSelected, styles.subTagChecked],
  );

  const [stickerValue, setStickerValue] =
    useState<StickerFormValue>(EMPTY_STICKER_VALUE);
  const [chargingValue, setChargingValue] =
    useState<ChargingAnimationFormValue>(EMPTY_CHARGING_ANIMATION_VALUE);
  const [iconPackValue, setIconPackValue] = useState<IconPackFormValue>(
    EMPTY_ICON_PACK_VALUE,
  );
  const [controlCenterValue, setControlCenterValue] =
    useState<ControlCenterFormValue>(EMPTY_CONTROL_CENTER_VALUE);
  const [wallpaperValue, setWallpaperValue] = useState<WallpaperFormValue>(
    EMPTY_WALLPAPER_VALUE,
  );
  const [submitting, setSubmitting] = useState(false);
  /** 只有 Control Center 会一次传几十个文件，需要让用户看到进度 */
  const [uploadProgress, setUploadProgress] =
    useState<ControlCenterUploadProgress | null>(null);

  const onAddSticker = async () => {
    const invalidText = validateStickerValue(stickerValue);
    if (invalidText) {
      message.error(invalidText);
      return;
    }
    if (!projectId) {
      message.error('项目未初始化，无法上传');
      return;
    }
    setSubmitting(true);
    try {
      const result = await uploadStickerFiles(projectId, stickerValue);
      addSticker(buildStickerConfig(result));
      message.success('Sticker 已添加');
      setStickerValue(EMPTY_STICKER_VALUE);
      onClose();
    } catch {
      message.error('上传失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const onAddChargingAnimation = async () => {
    const invalidText = validateChargingAnimationValue(chargingValue);
    if (invalidText) {
      message.error(invalidText);
      return;
    }
    if (!projectId) {
      message.error('项目未初始化，无法上传');
      return;
    }
    setSubmitting(true);
    try {
      const result = await uploadChargingAnimationFiles(
        projectId,
        chargingValue,
      );
      addChargingAnimation(buildChargingAnimationConfig(result));
      message.success('Charging Animation 已添加');
      setChargingValue(EMPTY_CHARGING_ANIMATION_VALUE);
      onClose();
    } catch {
      message.error('上传失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const onAddIconPack = async () => {
    const invalidText = validateIconPackValue(iconPackValue);
    if (invalidText) {
      message.error(invalidText);
      return;
    }
    // 无图直接落默认 config；有图才需要上传
    if (!iconPackValue.images.length) {
      addIconPack(buildEmptyIconPackConfig());
      message.success('Icon Pack 已添加');
      setIconPackValue(EMPTY_ICON_PACK_VALUE);
      onClose();
      return;
    }
    if (!projectId) {
      message.error('项目未初始化，无法上传');
      return;
    }
    setSubmitting(true);
    try {
      const result = await uploadIconPackFiles(projectId, iconPackValue);
      addIconPack(buildIconPackConfig(result));
      message.success(`Icon Pack 已添加（上传 ${result.uploadedCount} 个）`);
      setIconPackValue(EMPTY_ICON_PACK_VALUE);
      onClose();
    } catch {
      message.error('上传失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const onAddControlCenter = async () => {
    const invalidText = validateControlCenterValue(controlCenterValue);
    if (invalidText) {
      message.error(invalidText);
      return;
    }
    // 不传素材也能先加个空壳到画布上，素材后面再补
    if (!controlCenterValue.files.length) {
      addControlCenter(buildEmptyControlCenterConfig());
      message.success('Control Center 已添加');
      onClose();
      return;
    }
    if (!projectId) {
      message.error('项目未初始化，无法上传');
      return;
    }
    setSubmitting(true);
    try {
      const result = await uploadControlCenterFiles(
        projectId,
        controlCenterValue,
        setUploadProgress,
      );
      addControlCenter(buildControlCenterConfig(result));
      if (result.failed.length) {
        // 失败的没落进 config，画布上对应格子是空的，重新传那几个覆盖即可
        message.warning(
          `Control Center 已添加，${result.failed.length} 个文件上传失败：${result.failed.join('、')}`,
        );
      } else {
        message.success(
          `Control Center 已添加（上传 ${result.uploadedCount} 个）`,
        );
      }
      setControlCenterValue(EMPTY_CONTROL_CENTER_VALUE);
      onClose();
    } catch {
      message.error('上传失败，请重试');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const onAddWallpaper = async () => {
    const wallpaperType = subSelected || '';
    const invalidText = validateWallpaperValue(wallpaperValue, wallpaperType);
    if (invalidText) {
      message.error(invalidText);
      return;
    }
    if (!hasWallpaperFiles(wallpaperValue, wallpaperType)) {
      const config = buildEmptyWallpaperConfig(
        wallpaperType,
        wallpaperValue.liveSystem,
      );
      if (!config) {
        message.error('该壁纸类型暂未实现');
        return;
      }
      addWallpaper(config);
      message.success('Wallpaper 已添加');
      setWallpaperValue(EMPTY_WALLPAPER_VALUE);
      onClose();
      return;
    }
    if (!projectId) {
      message.error('项目未初始化，无法上传');
      return;
    }
    setSubmitting(true);
    try {
      const result = await uploadWallpaperFiles(
        projectId,
        wallpaperValue,
        wallpaperType,
      );
      addWallpaper(buildWallpaperConfig(result));
      message.success(
        result.uploadedCount
          ? `Wallpaper 已添加（上传 ${result.uploadedCount} 个）`
          : 'Wallpaper 已添加',
      );
      setWallpaperValue(EMPTY_WALLPAPER_VALUE);
      onClose();
    } catch {
      message.error('上传失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 各一级分类的 body 表单和 add 行为。加新分类只在这里补一项，
   * 不用再去改下面的 JSX 和 onAdd；表里没登记的分类走「暂未实现」。
   */
  const categoryHandlers: Partial<Record<MoreCategory, MoreCategoryHandler>> = {
    sticker: {
      render: () => (
        <AddStickerModal value={stickerValue} onChange={setStickerValue} />
      ),
      onAdd: onAddSticker,
    },
    charging_animation: {
      render: () => (
        <AddChargingAnimationModal
          value={chargingValue}
          onChange={setChargingValue}
        />
      ),
      onAdd: onAddChargingAnimation,
    },
    icon_pack: {
      render: () => (
        <AddIconPackModal value={iconPackValue} onChange={setIconPackValue} />
      ),
      onAdd: onAddIconPack,
    },
    control_center: {
      render: () => (
        <AddControlCenterModal
          value={controlCenterValue}
          onChange={setControlCenterValue}
        />
      ),
      onAdd: onAddControlCenter,
    },
    wallpaper: {
      render: () => (
        <AddWallpaperModal
          value={wallpaperValue}
          onChange={setWallpaperValue}
          wallpaperType={subSelected || ''}
        />
      ),
      onAdd: onAddWallpaper,
    },
  };
  const currentHandler = categoryHandlers[singleSelected];

  const onAdd = () => {
    if (currentHandler?.onAdd) {
      void currentHandler.onAdd();
      return;
    }
    // 还没接 add 的分类，先留日志
    console.log('[AddMoreElement] add', {
      category: singleSelected,
      subCategory: subSelected,
    });
  };

  return (
    <div className={`${styles.panel} ${!open ? styles.panelClosed : ''}`}>
      <div className={styles.header}>
        <Typography.Title level={5} className={styles.title}>
          More
        </Typography.Title>
        <Tag.CheckableTagGroup
          options={tagOptions}
          value={singleSelected}
          onChange={(value) => {
            if (!value) return;
            setSingleSelected(value as MoreCategory);
          }}
        />
        <div
          className={`${styles.subTagsWrap} ${subTags.length ? styles.subTagsWrapOpen : ''}`}
        >
          <div className={styles.subTagsRow}>
            <Tag.CheckableTagGroup
              options={subTagOptions}
              value={subSelected ?? null}
              onChange={(value) => {
                if (!value) return;
                setSubSelectedMap((prev) => ({
                  ...prev,
                  [singleSelected]: value as MoreSubCategory,
                }));
              }}
            />
          </div>
        </div>
      </div>
      <Divider className={styles.divider} size="small" />
      <div className={styles.body}>
        {currentHandler ? currentHandler.render() : <>暂未实现</>}
      </div>
      <Divider className={styles.divider} size="small" />
      <div className={styles.footer}>
        <Flex gap={8} justify="flex-end" align="center">
          {uploadProgress ? (
            <Typography.Text type="secondary" style={{ marginRight: 'auto' }}>
              上传中 {uploadProgress.done} / {uploadProgress.total}
            </Typography.Text>
          ) : null}
          <Button onClick={onClose}>cancel</Button>
          <Button type="primary" loading={submitting} onClick={onAdd}>
            add
          </Button>
        </Flex>
      </div>
    </div>
  );
};

export default AddMoreElementModal;
