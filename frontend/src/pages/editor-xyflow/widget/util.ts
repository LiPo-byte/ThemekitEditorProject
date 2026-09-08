import { nanoid } from 'nanoid';
import { CONFIG_SIZE_MAP, TYPE_WIDGET_MAP } from './base-config';
import {
  PLATFORM_GROUP_STYLE,
  ROOT_GROUP_STYLE,
} from '../util/groupNodeStyle';
// import { WIDGET_BORDER_RADIUS } from '@/editor-core/WidgetBaseNode';
export type ImageSize = {
  width: number;
  height: number;
};

export const isAndroidWidgetNode = (parentId?: unknown): boolean =>
  typeof parentId === 'string' && parentId.endsWith('android');

export const resolveWidgetFontFamily = (
  parentId: unknown,
  fontFamily?: string,
): string | undefined => (isAndroidWidgetNode(parentId) ? 'Roboto-Regular' : fontFamily);

/**
 * 把十六进制颜色和 0~1 的透明度合成 8 位十六进制色值（#RRGGBBAA）。
 * 传入色值已经带 alpha（9 位）时先截回 6 位再重新拼接，避免叠加两次；
 * 透明度不是有效数字时按不透明处理，超出范围会被夹到 0~1。
 */
export const resolveHexColorWithAlpha = (
  hexColor?: unknown,
  alpha?: unknown,
): string => {
  const rawColor = String(hexColor ?? '#000000');
  const baseColor =
    rawColor.startsWith('#') && rawColor.length === 9
      ? rawColor.slice(0, 7)
      : rawColor;
  const numericAlpha = Number(alpha);
  const normalizedAlpha = Number.isFinite(numericAlpha)
    ? Math.max(0, Math.min(1, numericAlpha))
    : 1;
  const alphaHex = Math.round(normalizedAlpha * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return `${baseColor}${alphaHex}`;
};

/**
 * 动画层的停留时长。duration 为负时表示反向播放，这里只关心长度所以取绝对值，
 * 并兜底一个最小值避免填 0 造成定时器空转。
 */
export const resolveAnimationHoldMs = (duration: unknown): number =>
  Math.max(Math.abs(Number(duration)) || 0, 0.1) * 1000;

/**
 * 第三、第四个动画都配了图时两者交替显示，一轮周期为各自停留时长之和。
 * 不满足交替条件时返回 0。
 */
export const resolveAlternateAnimationCycleMs = (data: any): number => {
  const third = data?.thirdImageAnimation;
  const fourth = data?.fourthImageAnimation;
  if (!third?.source || !fourth?.source) return 0;
  return (
    resolveAnimationHoldMs(third.duration) +
    resolveAnimationHoldMs(fourth.duration)
  );
};

/** 主图与充电图交替显示时各自的停留时长 */
export const BACKGROUND_ALTERNATE_HOLD_MS = 2000;

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

export const getWidgetType = (type: number, layoutType?: number) => {
    let wt = TYPE_WIDGET_MAP[type];
    let lyt = layoutType || 0;
    return wt + '_' + lyt;
}
export const widgetConfig2Nodes: any = (config: any, element_key?: any) => {
  const gap = 50;
  const res:any = [];
  const { ios, android, common } = config;
  const rootGroupId = element_key || nanoid();
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

    let themekitType = '';
    sizes.forEach((item: any) => {
      const sizeConfig = CONFIG_SIZE_MAP[item.size] || CONFIG_SIZE_MAP[1];
      const { layoutType } = item;
      const { width, height } = sizeConfig;
      groupWidth = Math.max(groupWidth, width + gap * 2);
      // 添加默认的source 和 crop_props
      themekitType = getWidgetType(platformConfig.type, layoutType);
      widgetNodes.push({
        id: nanoid(),
        type: themekitType,
        metaable: true,
        data: { ...item, themekitSizewithTypes: themekitType+"_"+item.size, },
        cropable: true,
        position: { x: gap, y: startY },
        parentId: groupId,
        extent: 'parent',
        draggable: false,
        // selectable: false,
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
        themekitType: themekitType,
      },
      packable: true,
      parentId: rootGroupId,
      extent: 'parent',
      draggable: false,
    //   selectable: false,
      connectable: false,
      focusable: false,
      zIndex: 10,
      style: {
        width: groupWidth,
        height: groupHeight,
        ...PLATFORM_GROUP_STYLE.widget,
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
    data: {
      category: 'widget',
    },
    draggable: false,
    // selectable: false,
    connectable: false,
    focusable: false,
    zIndex: 1,
    style: {
      width: rootWidth,
      height: rootHeight,
      ...ROOT_GROUP_STYLE.widget,
    },
  }
  res.push(rootNode, ...platformNodes);
  return { nodes: res, rootNode }
};