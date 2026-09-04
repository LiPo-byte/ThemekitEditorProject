import { nanoid } from 'nanoid';
import { DEFAULT_ICON_RADIUS } from '@/editor-core/defaultConfig';
import { DEFAULT_CROP_PROPS } from '../widget/base-config';
import {
  PLATFORM_GROUP_STYLE,
  ROOT_GROUP_STYLE,
} from '../util/groupNodeStyle';

const ICON_SIZE = 180;
const ICON_GAP = 100;
const ICON_COLUMNS = 8;
const SURFACE_GAP = 50;

/** iconpack 预览面：带 width/height 的对象；排除 apps 等非预览字段 */
const isIconPackSurfaceItem = (value: unknown): value is Record<string, any> =>
  Boolean(value) &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Number((value as Record<string, any>).width) > 0 &&
  Number((value as Record<string, any>).height) > 0;

const getIconPackSurfaceEntries = (
  config: Record<string, any> | null | undefined,
): Array<{ key: string; item: Record<string, any> }> => {
  if (!config || typeof config !== 'object') return [];
  return Object.entries(config)
    .filter(([key, value]) => key !== 'apps' && isIconPackSurfaceItem(value))
    .map(([key, item]) => ({ key, item: item as Record<string, any> }));
};

const getSuffixName = (filename: string): string => {
  const base = filename.replace(/\.[^.]+$/, '');
  const idx = base.lastIndexOf('_');
  return idx >= 0 ? base.slice(idx + 1) : base;
};

const normalizeIconEntries = (appsData: any) => {
  if (Array.isArray(appsData)) {
    return appsData.map((icon: any, index: number) => ({
      key: String(index),
      name: icon?.name || getSuffixName(icon?.source || ''),
      source: String(icon?.source || ''),
      crop_props: icon?.crop_props || DEFAULT_CROP_PROPS,
      radius: icon?.radius,
    }));
  }
  return Object.entries(appsData || {}).map(([key, value]) => {
    if (value && typeof value === 'object') {
      const appItem = value as { name?: string; source?: string; crop_props?: any; radius?: number };
      return {
        key,
        name: appItem.name || key,
        source: String(appItem.source || ''),
        crop_props: appItem.crop_props || DEFAULT_CROP_PROPS,
        radius: appItem.radius,
      };
    }
    return {
      key,
      name: key,
      source: String(value || ''),
      crop_props: DEFAULT_CROP_PROPS,
      radius: undefined,
    };
  });
};

export const iconPackConfig2Nodes: any = (config: any, elementKey?: any) => {
  const { apps: appsData } = config || {};
  const iconEntries = normalizeIconEntries(appsData);
  const surfaceEntries = getIconPackSurfaceEntries(config);
  const rootGroupId = elementKey || nanoid();
  const platformGroupId = nanoid();
  const nodes: any[] = [];

  const hasIcons = iconEntries.length > 0;
  const rowCount = hasIcons ? Math.ceil(iconEntries.length / ICON_COLUMNS) : 1;
  const colCount = hasIcons ? Math.min(ICON_COLUMNS, iconEntries.length) : 1;
  const contentWidth = colCount * ICON_SIZE + (colCount - 1) * ICON_GAP;
  const contentHeight = rowCount * ICON_SIZE + (rowCount - 1) * ICON_GAP;
  const platformWidth = contentWidth + ICON_GAP * 2;
  const platformHeight = contentHeight + ICON_GAP * 2;

  const iconNodes: any[] = [];
  iconEntries.forEach((icon, index) => {
    const col = index % ICON_COLUMNS;
    const row = Math.floor(index / ICON_COLUMNS);
    iconNodes.push({
      id: nanoid(),
      type: 'icon',
      data: {
        key: icon.key,
        name: icon.name,
        source: icon.source,
        crop_props: icon.crop_props || DEFAULT_CROP_PROPS,
        radius: typeof icon.radius === 'number' ? icon.radius : DEFAULT_ICON_RADIUS,
      },
      cropable: true,
      position: {
        x: ICON_GAP + col * (ICON_SIZE + ICON_GAP),
        y: ICON_GAP + row * (ICON_SIZE + ICON_GAP),
      },
      parentId: platformGroupId,
      extent: 'parent',
      draggable: false,
      // selectable: false,
      connectable: false,
      focusable: false,
      style: {
        border: '2px solid transparent',
      },
    });
  });

  nodes.push({
    id: platformGroupId,
    type: 'platform_group',
    position: { x: ICON_GAP, y: ICON_GAP },
    data: {
      label: 'common',
      themekitType: 'iconpack',
    },
    parentId: rootGroupId,
    extent: 'parent',
    draggable: false,
    // selectable: false,
    connectable: false,
    focusable: false,
    zIndex: 10,
    style: {
      width: platformWidth,
      height: platformHeight,
      ...PLATFORM_GROUP_STYLE.iconpack,
    },
  });
  nodes.push(...iconNodes);

  let cursorX = ICON_GAP * 2 + platformWidth;
  let maxPlatformHeight = platformHeight;

  const se = { apps: [rootGroupId] };
  surfaceEntries.forEach(({ key, item }) => {
    const width = Number(item.width) || 887;
    const height = Number(item.height) || 1920;
    const surfaceGroupId = `${nanoid()}_${key}`;
    const groupWidth = width + SURFACE_GAP * 2;
    const groupHeight = height + SURFACE_GAP * 2;
    maxPlatformHeight = Math.max(maxPlatformHeight, groupHeight);

    nodes.push({
      id: surfaceGroupId,
      type: 'platform_group',
      className: 'widget-group-node',
      position: { x: cursorX, y: ICON_GAP },
      data: {
        label: 'common',
        themekitType: key,
      },
      parentId: rootGroupId,
      extent: 'parent',
      draggable: false,
      connectable: false,
      focusable: false,
      selectable: false,
      zIndex: 10,
      style: {
        width: groupWidth,
        height: groupHeight,
        ...PLATFORM_GROUP_STYLE.iconpack,
      },
    });

    nodes.push({
      id: nanoid(),
      type: key === 'list_view' ? 'list_view_short' : key,
      data: {
        ...item,
        key,
        name: item.name || key,
        width,
        height,
        // 预览图直接上传；老 config 无该字段时兜底，右侧面板才会出现上传框
        source: item.source ?? '',
        // selectElements: se,
        // showElements: Array.isArray(item.showElements) ? item.showElements : [],
      },
      position: { x: SURFACE_GAP, y: SURFACE_GAP },
      parentId: surfaceGroupId,
      extent: 'parent',
      draggable: false,
      // selectable: false,
      connectable: false,
      focusable: false,
      style: {
        border: '2px solid transparent',
      },
    });

    cursorX += groupWidth + ICON_GAP;
  });

  const rootWidth = Math.max(cursorX, platformWidth + ICON_GAP * 2);
  const rootHeight = maxPlatformHeight + ICON_GAP * 2;

  const rootNode = {
    id: rootGroupId,
    type: 'group',
    deleteable: true,
    packable: true,
    position: { x: 0, y: 0 },
    data: {
      category: 'iconpack',
    },
    draggable: false,
    // selectable: false,
    connectable: false,
    focusable: false,
    zIndex: 1,
    style: {
      width: rootWidth,
      height: rootHeight,
      ...ROOT_GROUP_STYLE.iconpack,
    },
  };

  return { nodes: [rootNode, ...nodes], rootNode };
};