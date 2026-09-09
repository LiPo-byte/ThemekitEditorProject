import { Button, Divider, Flex, message, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import { useEditorGetElementsConfigMap, useEditorNodes } from '../context';
import {
  LOCK_CONFIG_SIZE_MAP,
  LOCK_TYPE_WIDGET_NAME_MAP,
} from '../lockwidget/base-config';
import { getLockWidgetType } from '../lockwidget/util';
import { xyFlowTypeNodeType } from '../xyFlowTypeNodeType';

const useStyles = createStyles(({ token, css }) => ({
  panel: css`
    position: absolute;
    // right: -4%;
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
  panelClosed: css`
    transform: translateX(-50%) translateY(300px);
    opacity: 0;
    pointer-events: none;
  `,
  divider: css`
    margin: 0 -12px;
    width: calc(100% + 24px);
  `,
  groups: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
  `,
  group: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  groupTitle: css`
    margin: 0;
    color: ${token.colorText};
    font-size: 13px;
    font-weight: 600;
  `,
  list: css`
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  `,
  item: css`
    position: relative;
    padding: 8px;
    margin: 5px;
    border-radius: 8px;
    border: 1px solid ${token.colorBorderSecondary};
    background: transparent;
    overflow: hidden;
    cursor: pointer;
    user-select: none;
    transition: border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
    &:hover {
      background: ${token.colorFillQuaternary};
      box-shadow: ${token.boxShadowSecondary};
    }
  `,
  itemSelected: css`
    border-color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
    /* item 的 hover 背景带伪类，优先级更高，选中态要再声明一次才不会被盖掉 */
    &:hover {
      background: ${token.colorPrimaryBg};
    }
  `,
  /** 锁屏组件三种形状宽高差异大，用两列等大包围盒排列，组件在盒内居中 */
  listGrid: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    // gap: 12px;
  `,
  itemBox: css`
    box-sizing: border-box;
    min-height: 88px;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  platformTag: css`
    position: absolute;
    top: 4px;
    left: 4px;
    z-index: 1;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10px;
    line-height: 16px;
    color: ${token.colorWhite};
    background: ${token.colorPrimary};
    pointer-events: none;
  `,
  empty: css`
    color: ${token.colorTextQuaternary};
    font-size: 12px;
    padding: 12px 0;
  `,
}));

type Props = {
  open: boolean;
  onClose: () => void;
};

const tagsData = [
  { label: 'Lock Widget', value: 'lockWidget' },
  { label: 'Wallpaper', value: 'wallpaper' },
] as const;
type ThemeCategory = (typeof tagsData)[number]['value'];

type ElementItem = {
  elementKey: string;
  config: Record<string, any>;
};

/** tag 取值 -> 根节点 data.category */
const CATEGORY_MAP: Record<ThemeCategory, string> = {
  lockWidget: 'lockwidget',
  wallpaper: 'wallpaper',
};

const WALLPAPER_PREVIEW_WIDTH = 72;
const WALLPAPER_PREVIEW_HEIGHT = 128;

/** LockPack = 单张壁纸 + 1~N 套锁屏组件，所以壁纸单选、锁屏组件多选 */
type SelectedKeys = {
  lockWidget: string[];
  wallpaper: string | null;
};

const EMPTY_SELECTED_KEYS: SelectedKeys = {
  lockWidget: [],
  wallpaper: null,
};

const AddLockPackModal: React.FC<Props> = ({ open, onClose }) => {
  const { styles } = useStyles();
  const nodes = useEditorNodes();
  const getElementsConfigMap = useEditorGetElementsConfigMap();
  const [singleSelected, setSingleSelected] =
    React.useState<ThemeCategory | null>('lockWidget');
  const [selectedKeys, setSelectedKeys] =
    React.useState<SelectedKeys>(EMPTY_SELECTED_KEYS);

  const toggleLockWidgetSelect = (elementKey: string) => {
    setSelectedKeys((prev) => ({
      ...prev,
      lockWidget: prev.lockWidget.includes(elementKey)
        ? prev.lockWidget.filter((key) => key !== elementKey)
        : [...prev.lockWidget, elementKey],
    }));
  };

  const toggleWallpaperSelect = (elementKey: string) => {
    setSelectedKeys((prev) => ({
      ...prev,
      wallpaper: prev.wallpaper === elementKey ? null : elementKey,
    }));
  };

  const filteredElements = React.useMemo(() => {
    if (!singleSelected) return [];
    const targetCategory = CATEGORY_MAP[singleSelected];
    const configMap = getElementsConfigMap();
    return nodes
      .filter((node) => node.type === 'group' && !node.parentId)
      .filter(
        (rootNode) =>
          (((rootNode.data as Record<string, any> | undefined)?.category ??
            'widget') as string) === targetCategory,
      )
      .map(
        (rootNode) =>
          ({
            elementKey: rootNode.id,
            config: configMap[rootNode.id] ?? {},
          }) as ElementItem,
      )
      .filter((element) => {
        // LockPack 当前只允许普通壁纸（wallpaperType === 0）
        if (targetCategory !== 'wallpaper') return true;
        return (Number(element.config?.wallpaperType ?? 0) || 0) === 0;
      });
  }, [nodes, getElementsConfigMap, singleSelected]);

  const renderLockWidgetPreview = (element: ElementItem) => {
    const sizeItem = element.config?.sizes?.[0];
    if (!sizeItem) return <div className={styles.empty}>暂无 size</div>;
    const sizeConfig =
      LOCK_CONFIG_SIZE_MAP[sizeItem.size] || LOCK_CONFIG_SIZE_MAP[1002];
    const nodeType = getLockWidgetType(Number(element.config?.type), sizeItem);
    const Comp = nodeType ? xyFlowTypeNodeType[nodeType] : null;
    if (!Comp) return <div className={styles.empty}>暂无预览</div>;
    return (
      <div
        style={{
          width: sizeConfig.width,
          height: sizeConfig.height,
          overflow: 'hidden',
        }}
      >
        <Comp data={sizeItem} scale={1} />
      </div>
    );
  };

  const renderLockWidgetList = () => (
    <div className={styles.listGrid}>
      {filteredElements.map((element) => (
        <div
          key={element.elementKey}
          className={`${styles.item} ${styles.itemBox} ${
            selectedKeys.lockWidget.includes(element.elementKey)
              ? styles.itemSelected
              : ''
          }`}
          onClick={() => toggleLockWidgetSelect(element.elementKey)}
        >
          <span className={styles.platformTag}>
            {LOCK_TYPE_WIDGET_NAME_MAP[Number(element.config?.type)] ||
              'Lock Widget'}
          </span>
          {renderLockWidgetPreview(element)}
        </div>
      ))}
    </div>
  );

  const renderWallpaperPreview = (element: ElementItem) => {
    const wallpaper = element.config?.wallpaper;
    if (!wallpaper?.source)
      return <div className={styles.empty}>暂无 wallpaper</div>;
    return (
      <div
        style={{
          width: WALLPAPER_PREVIEW_WIDTH,
          height: WALLPAPER_PREVIEW_HEIGHT,
          overflow: 'hidden',
          borderRadius: 6,
        }}
      >
        <img
          src={wallpaper.source}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    );
  };

  const renderWallpaperList = () => (
    <div className={styles.list}>
      {filteredElements.map((element) => (
        <div
          key={element.elementKey}
          className={`${styles.item} ${
            selectedKeys.wallpaper === element.elementKey
              ? styles.itemSelected
              : ''
          }`}
          onClick={() => toggleWallpaperSelect(element.elementKey)}
        >
          {renderWallpaperPreview(element)}
        </div>
      ))}
    </div>
  );

  const renderBody = () => {
    if (filteredElements.length === 0) {
      return <div className={styles.empty}>暂无该分类组件</div>;
    }
    return singleSelected === 'lockWidget'
      ? renderLockWidgetList()
      : renderWallpaperList();
  };
  const onConfirm = () => {
    if (!selectedKeys.lockWidget.length) {
      message.error('请至少选择一个 Lock Widget');
      return;
    }
    if (!selectedKeys.wallpaper) {
      message.error('请选择一张 Wallpaper');
      return;
    }
    console.log('onConfirm', selectedKeys);
    onClose();
  };

  return (
    <div className={`${styles.panel} ${!open ? styles.panelClosed : ''}`}>
      <div className={styles.header}>
        <Typography.Title level={5} className={styles.title}>
          Add Lock Pack
        </Typography.Title>
        <Tag.CheckableTagGroup
          options={[...tagsData]}
          value={singleSelected}
          onChange={(value) => {
            if (!value) return;
            setSingleSelected(value as ThemeCategory | null);
          }}
        />
      </div>
      <Divider className={styles.divider} size="small" />
      <div className={styles.body}>{renderBody()}</div>
      <Divider className={styles.divider} size="small" />
      <div className={styles.footer}>
        <Flex gap={8} justify="flex-end">
          <Button onClick={onClose}>cancel</Button>
          <Button type="primary" onClick={onConfirm}>confirm</Button>
        </Flex>
      </div>
    </div>
  );
};

export default AddLockPackModal;
