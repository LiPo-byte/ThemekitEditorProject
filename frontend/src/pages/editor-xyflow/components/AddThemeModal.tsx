import React from 'react';
import { Button, Divider, Flex, Tag, Typography, message } from 'antd';
import { createStyles } from 'antd-style';
import { useEditorGetElementsConfigMap, useEditorNodes, useEditorAddTheme } from '../context';
import { CONFIG_SIZE_MAP, TYPE_WIDGET_MAP, TYPE_WIDGET_NAME_MAP } from '../widget/base-config';
import { xyFlowTypeNodeType } from '../xyFlowTypeNodeType';
import { DEFAULT_THEME_CONFIG } from '@/editor-core/defaultConfig';
import AppIcon from '../icon';

const tagsData = [
  { label: 'Widget', value: 'widget' },
  { label: 'Icon', value: 'icon' },
  { label: 'Wallpaper', value: 'wallpaper' },
] as const;

type ThemeCategory = (typeof tagsData)[number]['value'];
type ElementCategory = 'widget' | 'iconpack' | 'wallpaper';

type ElementItem = {
  elementKey: string;
  category: string;
  config: Record<string, any>;
};

const WIDGET_SYSTEMS = ['common', 'ios', 'android'] as const;
type WidgetSystem = (typeof WIDGET_SYSTEMS)[number];

type WidgetPreviewItem = {
  selectionKey: string;
  elementKey: string;
  system: WidgetSystem;
  type: number;
  platformConfig: Record<string, any>;
};

type WidgetSubGroup = {
  type: number;
  label: string;
  items: WidgetPreviewItem[];
};

type SelectedKeysByCategory = {
  widget: string[];
  icon: string | null;
  wallpaper: string[];
};

const CATEGORY_MAP: Record<ThemeCategory, ElementCategory> = {
  widget: 'widget',
  icon: 'iconpack',
  wallpaper: 'wallpaper',
};

const ELEMENT_TO_THEME_CATEGORY: Record<ElementCategory, ThemeCategory> = {
  widget: 'widget',
  iconpack: 'icon',
  wallpaper: 'wallpaper',
};

const EMPTY_SELECTED_KEYS: SelectedKeysByCategory = {
  widget: [],
  icon: null,
  wallpaper: [],
};

const PUREIMAGE_TYPE = 8;
const WIDGET_PREVIEW_WIDTH = 200;
const WIDGET_BASE_WIDTH = CONFIG_SIZE_MAP[3].width;
const WIDGET_PREVIEW_SCALE = WIDGET_PREVIEW_WIDTH / WIDGET_BASE_WIDTH;
const ICON_PREVIEW_SIZE = 45;
const ICON_BASE_SIZE = 180;

const resolveWidgetXyflowType = (type: number, layoutType?: number) => {
  const wt = TYPE_WIDGET_MAP[type];
  if (!wt) return '';
  return `${wt}_${layoutType || 0}`;
};

const expandWidgetPlatformItems = (elements: ElementItem[]): WidgetPreviewItem[] => {
  const items: WidgetPreviewItem[] = [];
  elements.forEach((element) => {
    WIDGET_SYSTEMS.forEach((system) => {
      const platformConfig = element.config?.[system] as Record<string, any> | undefined;
      if (!platformConfig) return;
      const hasSize1 = (platformConfig.sizes || []).some(
        (item: any) => Number(item?.size) === 1,
      );
      if (!hasSize1) return;
      items.push({
        selectionKey: `${element.elementKey},${system}`,
        elementKey: element.elementKey,
        system,
        type: Number(platformConfig.type) || 0,
        platformConfig,
      });
    });
  });
  return items;
};

const groupWidgetsByType = (items: WidgetPreviewItem[]): WidgetSubGroup[] => {
  const groupMap = new Map<number, WidgetSubGroup>();
  items.forEach((item) => {
    const existing = groupMap.get(item.type);
    if (existing) {
      existing.items.push(item);
      return;
    }
    groupMap.set(item.type, {
      type: item.type,
      label: TYPE_WIDGET_NAME_MAP[item.type] || TYPE_WIDGET_MAP[item.type] || `Type ${item.type}`,
      items: [item],
    });
  });
  return Array.from(groupMap.values()).sort((a, b) => {
    if (a.type === PUREIMAGE_TYPE) return -1;
    if (b.type === PUREIMAGE_TYPE) return 1;
    return a.label.localeCompare(b.label);
  });
};

const resolveAmazonApp = (apps: any): Record<string, any> | null => {
  if (Array.isArray(apps)) {
    return (
      apps.find((app) => String(app?.name ?? app?.key ?? '').toLowerCase() === 'amazon') ?? null
    );
  }
  if (!apps || typeof apps !== 'object') return null;
  if (apps.amazon && typeof apps.amazon === 'object') {
    return { key: 'amazon', name: 'amazon', ...apps.amazon };
  }
  const entry = Object.entries(apps).find(
    ([key, value]) =>
      String(key).toLowerCase() === 'amazon' ||
      String((value as any)?.name ?? '').toLowerCase() === 'amazon',
  );
  if (!entry) return null;
  const [key, value] = entry;
  if (value && typeof value === 'object') {
    return { key, name: String((value as any).name ?? key), ...(value as any) };
  }
  return { key, name: key, source: String(value ?? '') };
};

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
    border-radius: 8px;
    border: 2px solid var(--editor-panel-border, transparent);
    background: ${token.colorFillQuaternary};
    overflow: hidden;
    cursor: pointer;
    user-select: none;
    transition: border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
    box-shadow: ${token.boxShadowSecondary};
  `,
  itemSelected: css`
    border-color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
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

const PLATFORM_LABEL_MAP: Record<WidgetSystem, string> = {
  common: 'Common',
  ios: 'iOS',
  android: 'Android',
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const AddThemeModal: React.FC<Props> = ({ open, onClose }) => {
  const { styles } = useStyles();
  const nodes = useEditorNodes();
  const getElementsConfigMap = useEditorGetElementsConfigMap();
  const [singleSelected, setSingleSelected] = React.useState<ThemeCategory | null>('widget');
  const [selectedKeys, setSelectedKeys] =
    React.useState<SelectedKeysByCategory>(EMPTY_SELECTED_KEYS);

  const addTheme = useEditorAddTheme();
  const filteredElements = React.useMemo(() => {
    if (!singleSelected) return [];
    const targetCategory = CATEGORY_MAP[singleSelected];
    const configMap = getElementsConfigMap();
    return nodes
      .filter((node) => node.type === 'group' && !node.parentId)
      .map((rootNode) => {
        const rootData =
          (rootNode.data as Record<string, any> | undefined) ?? {};
        const category = (rootData.category ?? 'widget') as string;
        const config = configMap[rootNode.id] ?? {};
        return {
          elementKey: rootNode.id,
          category,
          config,
        } as ElementItem;
      })
      .filter((element) => {
        if (element.category === 'theme' || element.category !== targetCategory) {
          return false;
        }
        // Theme 当前只允许普通壁纸（wallpaperType === 0）
        if (targetCategory === 'wallpaper') {
          const wallpaperType =
            Number(element.config?.wallpaperType ?? 0) || 0;
          return wallpaperType === 0;
        }
        return true;
      });
  }, [nodes, getElementsConfigMap, singleSelected]);

  const widgetPreviewItems = React.useMemo(
    () => (singleSelected === 'widget' ? expandWidgetPlatformItems(filteredElements) : []),
    [singleSelected, filteredElements],
  );

  const widgetGroups = React.useMemo(
    () => (singleSelected === 'widget' ? groupWidgetsByType(widgetPreviewItems) : []),
    [singleSelected, widgetPreviewItems],
  );

  const toggleWidgetSelect = (selectionKey: string) => {
    setSelectedKeys((prev) => {
      const exists = prev.widget.includes(selectionKey);
      return {
        ...prev,
        widget: exists
          ? prev.widget.filter((key) => key !== selectionKey)
          : [...prev.widget, selectionKey],
      };
    });
  };

  const toggleElementSelect = (element: ElementItem) => {
    const themeCategory =
      ELEMENT_TO_THEME_CATEGORY[element.category as ElementCategory] ?? 'widget';
    setSelectedKeys((prev) => {
      if (themeCategory === 'icon') {
        return {
          ...prev,
          icon: prev.icon === element.elementKey ? null : element.elementKey,
        };
      }
      const list = prev[themeCategory];
      const exists = list.includes(element.elementKey);
      return {
        ...prev,
        [themeCategory]: exists
          ? list.filter((key) => key !== element.elementKey)
          : [...list, element.elementKey],
      };
    });
  };

  const renderWidgetPreview = (item: WidgetPreviewItem) => {
    const sizeItem = (item.platformConfig.sizes || []).find(
      (entry: any) => Number(entry?.size) === 1,
    );
    if (!sizeItem) return <div className={styles.empty}>暂无 size 1</div>;
    const sizeConfig = CONFIG_SIZE_MAP[1] || CONFIG_SIZE_MAP[3];
    const width = sizeConfig.width * WIDGET_PREVIEW_SCALE;
    const height = sizeConfig.height * WIDGET_PREVIEW_SCALE;
    const xyflowType = resolveWidgetXyflowType(
      Number(item.platformConfig.type),
      Number(sizeItem?.layoutType) || 0,
    );
    const Comp = xyflowType ? xyFlowTypeNodeType[xyflowType] : null;
    if (!Comp) return <div className={styles.empty}>暂无预览</div>;
    return (
      <div style={{ width, height, overflow: 'hidden' }}>
        <Comp
          data={sizeItem}
          scale={WIDGET_PREVIEW_SCALE}
          parentData={item.platformConfig}
        />
      </div>
    );
  };

  const renderSelectableWidgetItem = (item: WidgetPreviewItem) => {
    const selected = selectedKeys.widget.includes(item.selectionKey);
    return (
      <div
        key={item.selectionKey}
        className={`${styles.item} ${selected ? styles.itemSelected : ''}`}
        onClick={() => toggleWidgetSelect(item.selectionKey)}
      >
        <span className={styles.platformTag}>{PLATFORM_LABEL_MAP[item.system]}</span>
        {renderWidgetPreview(item)}
      </div>
    );
  };

  const renderElementPreview = (element: ElementItem) => {
    if (element.category === 'iconpack') {
      const amazon = resolveAmazonApp(element.config?.apps);
      if (!amazon) return <div className={styles.empty}>暂无 amazon</div>;
      return (
        <div style={{ width: ICON_PREVIEW_SIZE, height: ICON_PREVIEW_SIZE, overflow: 'hidden' }}>
          <AppIcon data={{ ...amazon, name: '' }} scale={ICON_PREVIEW_SIZE / ICON_BASE_SIZE} />
        </div>
      );
    }

    const wallpaper = element.config?.wallpaper;
    if (!wallpaper?.source) return <div className={styles.empty}>暂无 wallpaper</div>;
    return (
      <div style={{ width: 72, height: 128, overflow: 'hidden', borderRadius: 6 }}>
        <img
          src={wallpaper.source}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  };

  const renderSelectableItem = (element: ElementItem) => {
    const selected =
      element.category === 'iconpack'
        ? selectedKeys.icon === element.elementKey
        : selectedKeys.wallpaper.includes(element.elementKey);
    return (
      <div
        key={element.elementKey}
        className={`${styles.item} ${selected ? styles.itemSelected : ''}`}
        onClick={() => toggleElementSelect(element)}
      >
        {renderElementPreview(element)}
      </div>
    );
  };
  const onConfirm = () => {
    if (!selectedKeys.widget.length) {
      message.error('请至少选择一个 Widget');
      return;
    }
    if (!selectedKeys.icon) {
      message.error('请选择一个 AppIcon');
      return;
    }
    if (!selectedKeys.wallpaper.length) {
      message.error('请至少选择一个 Wallpaper');
      return;
    }

    const configMap = getElementsConfigMap();
    const wallpaperKey = selectedKeys.wallpaper[0];
    const iconKey = selectedKeys.icon;
    const showElements: Array<Record<string, any>> = [];

    const wallpaperData = configMap[wallpaperKey]?.wallpaper;
    if (wallpaperData) {
      showElements.push({
        key: `${wallpaperKey}_wallpaper`,
        category: 'wallpaper',
        data: { ...wallpaperData },
      });
    }

    selectedKeys.widget.forEach((selectionKey) => {
      const [elementKey, system] = String(selectionKey).split(',');
      const platformConfig = configMap[elementKey]?.[system || 'common'];
      if (!platformConfig) return;
      const sizeItem = (platformConfig.sizes || []).find(
        (item: any) => Number(item?.size) === 1,
      );
      if (!sizeItem) return;
      showElements.push({
        key: `${selectionKey}_size_1`,
        category: 'widget',
        data: {
          ...platformConfig,
          sizes: [{ ...sizeItem }],
        },
      });
    });

    const amazon = resolveAmazonApp(configMap[iconKey]?.apps);
    if (amazon) {
      showElements.push({
        key: `${iconKey}_Amazon`,
        category: 'iconpack',
        data: { ...amazon },
      });
    }

    const withShowElements = (surface: Record<string, any>) => ({
      ...surface,
      showElements: [...showElements],
    });

    addTheme({
      ...DEFAULT_THEME_CONFIG,
      preview_long: withShowElements({
        ...DEFAULT_THEME_CONFIG.preview_long,
        width: 887,
        height: 1920,
      }),
      preview_short: withShowElements(DEFAULT_THEME_CONFIG.preview_short),
      list_view: withShowElements(DEFAULT_THEME_CONFIG.list_view),
      preview_long_ipad: withShowElements(DEFAULT_THEME_CONFIG.preview_long_ipad),
      list_view_ipad: withShowElements(DEFAULT_THEME_CONFIG.list_view_ipad),
      selectElements: {
        apps: [iconKey],
        widgets: [...selectedKeys.widget],
        wallpaper: [...selectedKeys.wallpaper],
      },
    });
    onClose();
  };

  return (
    <div className={`${styles.panel} ${!open ? styles.panelClosed : ''}`}>
      <div className={styles.header}>
        <Typography.Title level={5} className={styles.title}>
          Add Theme
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
      <div className={styles.body}>
        {singleSelected === 'widget' ? (
          widgetPreviewItems.length === 0 ? (
            <div className={styles.empty}>暂无该分类组件</div>
          ) : (
            <div className={styles.groups}>
              {widgetGroups.map((group) => (
                <div key={group.type} className={styles.group}>
                  <div className={styles.groupTitle}>{group.label}</div>
                  <div className={styles.list}>
                    {group.items.map((item) => renderSelectableWidgetItem(item))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredElements.length === 0 ? (
          <div className={styles.empty}>暂无该分类组件</div>
        ) : (
          <div className={styles.list}>
            {filteredElements.map((element) => renderSelectableItem(element))}
          </div>
        )}
      </div>
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

export default AddThemeModal;
