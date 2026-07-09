import { nanoid } from 'nanoid';
import { CONFIG_SIZE_MAP, TYPE_WIDGET_MAP } from './base-config';
// import { WIDGET_BORDER_RADIUS } from '@/editor-core/WidgetBaseNode';
export type ImageSize = {
  width: number;
  height: number;
};

/**
 * 通过图片地址获取原始尺寸（naturalWidth / naturalHeight）。
 */
export const getImageSize = (src: string): Promise<ImageSize> =>
  new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('Image src is required.'));
      return;
    }

    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`));
    };
    image.src = src;
});

const getWidgetType = (type: number, layoutType?: number) => {
    let wt = TYPE_WIDGET_MAP[type];
    let lyt = layoutType || 0;
    return wt + '_' + lyt;
}
export const widgetConfig2Nodes: any = (config: any) => {
  const gap = 50;
  const res:any = [];
  const { ios, android, common } = config;
  const rootGroupId = nanoid();
  const platformNodes: any[] = [];

  const pushPlatformNodes = (platformConfig: any, groupX: number, system: string) => {
    if (!platformConfig) {
      return null;
    }

    const groupId = nanoid() + '_' + system;
    // const platformLabel = system === 'ios' ? 'IOS' : 'Android';
    let groupWidth = gap;
    let groupHeight = gap;
    let startY = gap;
    const sizes = Array.isArray(platformConfig.sizes)
      ? [...platformConfig.sizes].reverse()
      : [];
    const widgetNodes: any[] = [];

    sizes.forEach((item: any) => {
      const sizeConfig = CONFIG_SIZE_MAP[item.size] || CONFIG_SIZE_MAP[1];
      const { layoutType } = item;
      const { width, height } = sizeConfig;
      groupWidth = Math.max(groupWidth, width + gap * 2);
      // 添加默认的source 和 crop_props

      widgetNodes.push({
        id: nanoid(),
        type: getWidgetType(platformConfig.type, layoutType),
        metaable: true,
        data: { ...item },
        cropable: true,
        position: { x: gap, y: startY },
        parentId: groupId,
        extent: 'parent',
        draggable: false,
        selectable: false,
        connectable: false,
        focusable: false,
        style: {
          border: '2px solid transparent',
        },
      });

      startY += height + gap;
      groupHeight += height + gap;
    });

    platformNodes.push({
      id: groupId,
      type: 'platform_group',
      className: 'widget-group-node',
      position: { x: groupX, y: gap },
      data: {
        ...platformConfig,
        label: system,
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
        width: groupWidth,
        height: groupHeight,
        background: '#eef3ff',
        border: '1px solid #dfe5ff',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(63, 93, 255, 0.06)',
      },
    });
    platformNodes.push(...widgetNodes);

    return {
      width: groupWidth,
      height: groupHeight,
    };
  };

  let rootWidth = 0;
  let rootHeight = 0;
  if (ios || android) {
    const iosMeta = ios ? pushPlatformNodes(ios, gap, 'ios') : null;
    const androidMeta = android
      ? pushPlatformNodes(
          android,
          iosMeta ? gap + iosMeta.width + gap : gap,
          'android',
        )
      : null;
    rootWidth = iosMeta && androidMeta
      ? gap + iosMeta.width + gap + androidMeta.width + gap
      : gap + (iosMeta?.width || androidMeta?.width || 0) + gap;
    rootHeight = gap
      + Math.max(iosMeta?.height || 0, androidMeta?.height || 0)
      + gap;
  }

  if (common) {
    const commonMeta = pushPlatformNodes(common, gap, 'common');
    rootWidth = commonMeta && commonMeta.width + 2 * gap || 2 * gap;
    rootHeight = commonMeta && commonMeta.height + 2 * gap || 2 * gap;
  }


  const rootNode = {
    id: rootGroupId,
    type: 'group',
    className: 'widget-group-node',
    deleteable: true,
    position: { x: 0, y: 0 },
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
  }
  res.push(rootNode, ...platformNodes);
  return { nodes: res, rootNode }
};