import { nanoid } from 'nanoid';
import { CONFIG_SIZE_MAP, DEFAULT_CROP_PROPS } from '../widget/base-config';
import {
  BANNER_GAP as PREVIEW_BANNER_GAP,
  BANNER_PADDING as PREVIEW_BANNER_PADDING,
  CELL as PREVIEW_CELL,
  DEFAULT_GRID_PADDING_Y,
  GAP_X as PREVIEW_GAP_X,
  GAP_Y as PREVIEW_GAP_Y,
  getCellSlotY,
  parseGridPaddingY,
  parseGridSize,
} from './desktop-dnd';

const ICON_SIZE = 180;
const ICON_GAP = 100;
const ICON_COLUMNS = 8;
const DEFAULT_ICON_RADIUS = 39.96;
const PREVIEW_INNER_GAP = 50;

/** 默认桌面预览布局；后续新尺寸往这里加即可 */
// const DEFAULT_PREVIEW_CONFIGS = [
//   { name: 'list_view', col: 4, row: 3, size: [738, 564], withName: false },
//   {
//     name: 'preview_long',
//     col: 4,
//     row: 6,
//     size: [887, 1920],
//     withName: true,
//     withBanner: true,
//     gridPaddingY: DEFAULT_GRID_PADDING_Y,
//   },
//   {
//     name: 'preview_short',
//     col: 4,
//     row: 5,
//     size: [887, 1578],
//     withName: true,
//     withBanner: true,
//     gridPaddingY: DEFAULT_GRID_PADDING_Y,
//   },
// ];

const DEFAULT_PREVIEW_CONFIGS:any = [];

/**
 * 归一化 preview 配置为数组。
 * - 数组：原样使用
 * - 单对象（旧数据）：保留该条，并补上尚未存在的默认布局
 * - 缺省：使用全部默认布局
 */
const normalizePreviewConfigs = (preview: unknown): Record<string, any>[] => {
  if (Array.isArray(preview) && preview.length > 0) {
    return preview.filter((item) => item && typeof item === 'object');
  }

  if (preview && typeof preview === 'object') {
    const single = preview as Record<string, any>;
    const grid = parseGridSize(single.col, single.row);
    const items: Record<string, any>[] = [
      {
        ...single,
        name: single.name ?? 'short_preview',
        col: grid.columns,
        row: grid.rows,
      },
    ];
    DEFAULT_PREVIEW_CONFIGS.forEach((defaults: any) => {
      const exists = items.some(
        (item) =>
          item.name === defaults.name ||
          (Number(item.col) === defaults.col &&
            Number(item.row) === defaults.row),
      );
      if (!exists) {
        items.push({
          name: defaults.name,
          col: defaults.col,
          row: defaults.row,
          size: defaults.size,
          targetElementKeys: single.targetElementKeys,
          desketopShow: [],
        });
      }
    });
    return items;
  }

  return DEFAULT_PREVIEW_CONFIGS.map((item: any) => ({
    ...item,
    desketopShow: [],
  }));
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
  const { apps: appsData, pureImage, preview } = config;
  const iconEntries = normalizeIconEntries(appsData);
  const rootGroupId = elementKey || nanoid();
  const platformGroupId = nanoid();
  const pureImageGroupId = nanoid() + '_pureImage';
  const nodes: any[] = [];

  const hasIcons = iconEntries.length > 0;
  const rowCount = hasIcons ? Math.ceil(iconEntries.length / ICON_COLUMNS) : 1;
  const colCount = hasIcons ? Math.min(ICON_COLUMNS, iconEntries.length) : 1;
  const contentWidth = colCount * ICON_SIZE + (colCount - 1) * ICON_GAP;
  const contentHeight = rowCount * ICON_SIZE + (rowCount - 1) * ICON_GAP;
  const platformWidth = contentWidth + ICON_GAP * 2;
  const platformHeight = contentHeight + ICON_GAP * 2;

  
  const previewConfigs = normalizePreviewConfigs(preview);
  const previewLayouts = previewConfigs.map((item, index) => {
    const grid = parseGridSize(item.col, item.row);
    const withName = item.withName !== false;
    const withBanner = item.withBanner === true;
    const gridPaddingY = parseGridPaddingY(item.gridPaddingY);
    const cellY = getCellSlotY(withName);
    const gridWidth =
      grid.columns * PREVIEW_CELL + (grid.columns - 1) * PREVIEW_GAP_X;
    const width = withBanner
      ? gridWidth + PREVIEW_BANNER_PADDING * 2
      : gridWidth;
    const height =
      grid.rows * cellY +
      (grid.rows - 1) * PREVIEW_GAP_Y +
      gridPaddingY * 2 +
      (withBanner
        ? PREVIEW_BANNER_GAP + PREVIEW_CELL + PREVIEW_BANNER_PADDING * 2
        : 0);
    return {
      item,
      grid,
      withName,
      withBanner,
      gridPaddingY,
      width,
      height,
      groupWidth: width + PREVIEW_INNER_GAP * 2,
      groupHeight: height + PREVIEW_INNER_GAP * 2,
      index,
    };
  });
  const previewTotalWidth = previewLayouts.reduce(
    (sum, layout, index) =>
      sum + layout.groupWidth + (index > 0 ? ICON_GAP : 0),
    0,
  );
  const previewMaxHeight = previewLayouts.reduce(
    (max, layout) => Math.max(max, layout.groupHeight),
    0,
  );

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
    (previewTotalWidth > 0 ? previewTotalWidth + ICON_GAP : 0) +
    ICON_GAP * 2;
  const rootHeight =
    Math.max(platformHeight, pureImageHeight, previewMaxHeight) + ICON_GAP * 2;

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
      label: 'iconpack',
      themekitType: 'common',
    },
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
        // selectable: false,
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
      parentId: rootGroupId,
      extent: 'parent',
      draggable: false,
      // selectable: false,
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

  let previewCursorX =
    ICON_GAP * 2 + platformWidth + (hasPureImage ? pureImageWidth + ICON_GAP : 0);

  previewLayouts.forEach((layout) => {
    const previewGroupId = nanoid() + '_preview';
    const {
      item,
      grid,
      withName,
      withBanner,
      gridPaddingY,
      width,
      height,
      groupWidth,
      groupHeight,
    } = layout;

    nodes.push({
      id: previewGroupId,
      type: 'platform_group',
      position: { x: previewCursorX, y: ICON_GAP },
      data: {
        label: item.name,
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
        width: groupWidth,
        height: groupHeight,
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
        name: item.name ?? `preview_${grid.columns}x${grid.rows}`,
        targetElementKeys: Array.isArray(item.targetElementKeys)
          ? item.targetElementKeys
          : [rootGroupId],
        desketopShow: Array.isArray(item.desketopShow) ? item.desketopShow : [],
        // 导出尺寸优先用配置 size；画布格子仍按 col/row
        size:
          Array.isArray(item.size) && item.size.length >= 2
            ? [Number(item.size[0]), Number(item.size[1])]
            : [width, height],
        col: grid.columns,
        row: grid.rows,
        withName,
        withBanner,
        gridPaddingY,
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

    previewCursorX += groupWidth + ICON_GAP;
  });

  return { nodes: [rootNode, ...nodes], rootNode };
};