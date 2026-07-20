import { nanoid } from 'nanoid';
import { CONFIG_SIZE_MAP, DEFAULT_CROP_PROPS } from '../widget/base-config';
import {
  CELL as PREVIEW_CELL,
  COLUMNS as PREVIEW_COLUMNS,
  GAP_X as PREVIEW_GAP_X,
  GAP_Y as PREVIEW_GAP_Y,
  ROWS as PREVIEW_ROWS,
} from './desktop-dnd';

const ICON_SIZE = 180;
const ICON_GAP = 100;
const ICON_COLUMNS = 8;
const DEFAULT_ICON_RADIUS = 39.96;
const PREVIEW_INNER_GAP = 50;

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
  const { apps: appsData, pureImage, preview } = config;
  const iconEntries = normalizeIconEntries(appsData);
  const rootGroupId = elementKey || nanoid();
  const platformGroupId = nanoid();
  const pureImageGroupId = nanoid() + '_pureImage';
  const previewGroupId = nanoid() + '_preview';
  const nodes: any[] = [];

  const hasIcons = iconEntries.length > 0;
  const rowCount = hasIcons ? Math.ceil(iconEntries.length / ICON_COLUMNS) : 1;
  const colCount = hasIcons ? Math.min(ICON_COLUMNS, iconEntries.length) : 1;
  const contentWidth = colCount * ICON_SIZE + (colCount - 1) * ICON_GAP;
  const contentHeight = rowCount * ICON_SIZE + (rowCount - 1) * ICON_GAP;
  const previewWidth = PREVIEW_COLUMNS * PREVIEW_CELL + (PREVIEW_COLUMNS - 1) * PREVIEW_GAP_X;
  const previewHeight = PREVIEW_ROWS * PREVIEW_CELL + (PREVIEW_ROWS - 1) * PREVIEW_GAP_Y;
  const previewGroupWidth = previewWidth + PREVIEW_INNER_GAP * 2;
  const previewGroupHeight = previewHeight + PREVIEW_INNER_GAP * 2;
  const platformWidth = contentWidth + ICON_GAP * 2;
  const platformHeight = contentHeight + ICON_GAP * 2;

  const pureImageSizes = Array.isArray(pureImage?.sizes)
    ? [...pureImage.sizes].reverse()
    : [];
  const pureImageGap = 50;
  let pureImageWidth = 0;
  let pureImageHeight = 0;
  if (pureImageSizes.length > 0) {
    pureImageWidth = pureImageGap;
    pureImageHeight = pureImageGap;
    pureImageSizes.forEach((item: any) => {
      const sizeConfig = CONFIG_SIZE_MAP[item.size] || CONFIG_SIZE_MAP[1];
      pureImageWidth = Math.max(pureImageWidth, sizeConfig.width + pureImageGap * 2);
      pureImageHeight += sizeConfig.height + pureImageGap;
    });
  }

  const hasPureImage = pureImageSizes.length > 0;
  const rootWidth =
    platformWidth +
    (hasPureImage ? pureImageWidth + ICON_GAP : 0) +
    previewGroupWidth +
    ICON_GAP * 3;
  const rootHeight =
    Math.max(platformHeight, pureImageHeight, previewGroupHeight) + ICON_GAP * 2;

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
  const previewApps: any = [];
  iconEntries.forEach((icon, index) => {
    const col = index % ICON_COLUMNS;
    const row = Math.floor(index / ICON_COLUMNS);
    previewApps.push({
      name: icon.name,
      previewSource: icon.source,
      crop_props: icon.crop_props || DEFAULT_CROP_PROPS,
    })
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

  if (hasPureImage) {
    const pureImageNodes: any[] = [];
    let startY = pureImageGap;
    pureImageSizes.forEach((item: any) => {
      const sizeConfig = CONFIG_SIZE_MAP[item.size] || CONFIG_SIZE_MAP[1];
      pureImageNodes.push({
        id: nanoid(),
        type: 'pureimage_0',
        metaable: true,
        data: { ...item },
        cropable: true,
        position: { x: pureImageGap, y: startY },
        parentId: pureImageGroupId,
        extent: 'parent',
        draggable: false,
        selectable: false,
        connectable: false,
        focusable: false,
        style: {
          border: '2px solid transparent',
        },
      });
      startY += sizeConfig.height + pureImageGap;
    });

    nodes.push({
      id: pureImageGroupId,
      type: 'platform_group',
      position: { x: ICON_GAP * 2 + platformWidth, y: ICON_GAP },
      data: {
        ...pureImage,
        label: 'pureImage',
        themekitType: 'pureimage_0',
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
        width: pureImageWidth,
        height: pureImageHeight,
        background: '#eef3ff',
        border: '1px solid #dfe5ff',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(63, 93, 255, 0.06)',
      },
    });
    nodes.push(...pureImageNodes);
  }

  const previewGroupX =
    ICON_GAP * 2 + platformWidth + (hasPureImage ? pureImageWidth + ICON_GAP : 0);

  nodes.push({
    id: previewGroupId,
    type: 'platform_group',
    position: { x: previewGroupX, y: ICON_GAP },
    data: {
      label: 'preview',
      themekitType: 'preview',
    },
    parentId: rootGroupId,
    extent: 'parent',
    draggable: false,
    selectable: false,
    connectable: false,
    focusable: false,
    zIndex: 10,
    style: {
      width: previewGroupWidth,
      height: previewGroupHeight,
      background: '#eef3ff',
      border: '1px solid #dfe5ff',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(63, 93, 255, 0.06)',
    },
  });

  nodes.push({
    id: nanoid(),
    type: 'preview',
    desktopeditable: true,
    data: {
      name: preview?.name ?? 'list_view',
      targetElementKeys: Array.isArray(preview?.targetElementKeys)
        ? preview.targetElementKeys
        : [rootGroupId],
      desketopShow: Array.isArray(preview?.desketopShow) ? preview.desketopShow : [],
    },
    position: {
      x: PREVIEW_INNER_GAP,
      y: PREVIEW_INNER_GAP,
    },
    parentId: previewGroupId,
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