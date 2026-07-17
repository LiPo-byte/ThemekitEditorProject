import { nanoid } from 'nanoid';
import { DEFAULT_CROP_PROPS } from '../widget/base-config';

const ICON_SIZE = 180;
const ICON_GAP = 100;
const ICON_COLUMNS = 8;
const DEFAULT_ICON_RADIUS = 39.96;
const PREVIEW_COLUMNS = 4;
const PREVIEW_GAP = 12;
const PREVIEW_ROWS = 4;

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

export const iconPackConfig2Nodes: any = (config: any) => {
  const appsData = config?.apps;
  const iconEntries = normalizeIconEntries(appsData);
  const rootGroupId = nanoid();
  const platformGroupId = nanoid();
  const nodes: any[] = [];

  const hasIcons = iconEntries.length > 0;
  const rowCount = hasIcons ? Math.ceil(iconEntries.length / ICON_COLUMNS) : 1;
  const colCount = hasIcons ? Math.min(ICON_COLUMNS, iconEntries.length) : 1;
  const contentWidth = colCount * ICON_SIZE + (colCount - 1) * ICON_GAP;
  const contentHeight = rowCount * ICON_SIZE + (rowCount - 1) * ICON_GAP;
  const previewWidth = PREVIEW_COLUMNS * ICON_SIZE + (PREVIEW_COLUMNS - 1) * PREVIEW_GAP;
  const previewHeight = PREVIEW_ROWS * ICON_SIZE + (PREVIEW_ROWS - 1) * PREVIEW_GAP;
  const platformWidth = contentWidth + ICON_GAP * 2;
  const platformHeight = contentHeight + ICON_GAP * 2;
  const rootWidth = platformWidth + previewWidth + ICON_GAP * 3;
  const rootHeight = Math.max(platformHeight, previewHeight) + ICON_GAP * 2;

  const rootNode = {
    id: rootGroupId,
    type: 'group',
    deleteable: true,
    position: { x: 0, y: 0 },
    data: {
      category: 'iconpack',
    },
    draggable: false,
    selectable: false,
    connectable: false,
    focusable: false,
    zIndex: 1,
    style: {
      width: rootWidth,
      height: rootHeight,
      background: '#f5f7ff',
      border: '1px solid #b4c0ff',
      borderRadius: 16,
    },
  };

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
      selectable: false,
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
      label: 'iconpack',
      themekitType: 'common',
    },
    packable: true,
    parentId: rootGroupId,
    extent: 'parent',
    draggable: false,
    selectable: false,
    connectable: false,
    focusable: false,
    zIndex: 10,
    style: {
      width: platformWidth,
      height: platformHeight,
      background: '#eef3ff',
      border: '1px solid #dfe5ff',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(63, 93, 255, 0.06)',
    },
  });
  nodes.push(...iconNodes);

  nodes.push({
    id: nanoid(),
    type: 'icon_preview',
    data: {
      gap: PREVIEW_GAP,
    },
    position: {
      x: ICON_GAP * 2 + platformWidth,
      y: ICON_GAP,
    },
    parentId: rootGroupId,
    extent: 'parent',
    draggable: false,
    selectable: false,
    connectable: false,
    focusable: false,
    style: {
      border: '2px solid transparent',
    },
  });

  return { nodes: [rootNode, ...nodes], rootNode };
};