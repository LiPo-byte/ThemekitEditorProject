import { App, Button, Divider, Flex, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import React, { useMemo, useRef, useState } from 'react';
import { useEditorAddSticker, useEditorProjectId } from '../../context';
import AddStickerModal, {
  buildStickerConfig,
  EMPTY_STICKER_VALUE,
  type StickerFormValue,
  uploadStickerFiles,
  validateStickerValue,
} from './AddStickerModal';

const useStyles = createStyles(({ token, css }) => ({
  panel: css`
    position: absolute;
    bottom: 52px;
    transform: translateX(-50%);
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
    transform: translateX(-50%) translateY(500px);
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
  { label: 'Wallpaper', value: 'wallpaper', subTags: subWallpaperTags },
] as const satisfies readonly MoreTagItem[];
type MoreCategory = (typeof tagsData)[number]['value'];
/** 只取带 subTags 的一级标签，拿到所有二级取值的联合类型 */
type MoreSubCategory = Extract<
  (typeof tagsData)[number],
  { subTags: unknown }
>['subTags'][number]['value'];

const tagOptions = tagsData.slice(0, 2).map(({ label, value }) => ({ label, value }));

/** 每个一级标签默认的二级选中项 */
const DEFAULT_SUB_SELECTED: Partial<Record<MoreCategory, MoreSubCategory>> = {
  wallpaper: 'normal_wallpaper',
};

const getSubTags = (category: MoreCategory): readonly MoreSubTagItem[] => {
  const tag = tagsData.find((item) => item.value === category);
  return tag && 'subTags' in tag ? tag.subTags : [];
};
/** 内容待定，先只有面板骨架：头部标题 + 可滚动 body + 底部操作区 */
const AddMoreElementModal: React.FC<Props> = ({ open, onClose }) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const projectId = useEditorProjectId();
  const addSticker = useEditorAddSticker();
  const [singleSelected, setSingleSelected] = useState<MoreCategory>('sticker');
  /** 二级选中按一级标签分别记住，来回切一级时保留各自上次的选择 */
  const [subSelectedMap, setSubSelectedMap] = useState<
    Partial<Record<MoreCategory, MoreSubCategory>>
  >(DEFAULT_SUB_SELECTED);

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
  const [submitting, setSubmitting] = useState(false);

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
      message.success('sticker 已添加');
      setStickerValue(EMPTY_STICKER_VALUE);
      onClose();
    } catch {
      message.error('上传失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const onAdd = () => {
    if (singleSelected === 'sticker') {
      void onAddSticker();
      return;
    }
    // 其余分类的内容还没做，先留日志
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
        {singleSelected === 'sticker' ? (
          <AddStickerModal value={stickerValue} onChange={setStickerValue} />
        ) : <>暂未实现</>}
      </div>
      <Divider className={styles.divider} size="small" />
      <div className={styles.footer}>
        <Flex gap={8} justify="flex-end">
          <Button onClick={onClose}>cancel</Button>
          <Button type="primary" loading={submitting} onClick={onAdd}>add</Button>
        </Flex>
      </div>
    </div>
  );
};

export default AddMoreElementModal;
