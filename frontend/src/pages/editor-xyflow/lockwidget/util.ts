import { nanoid } from 'nanoid';
import {
  LOCK_CONFIG_SIZE_MAP,
  LOCK_SIZE_LABEL_MAP,
  LOCK_TYPE_WIDGET_MAP,
} from './base-config';

const GAP = 50;

/**
 * 图片资源都是透明底 + 纯白图形，用 alpha 通道当遮罩、由 background 上色，
 * 抗锯齿边缘会按 alpha 比例着色所以不会有锯齿。
 * background 传纯色或渐变都可以，传渐变就能只让图形的一部分着色。
 * 导出走 html-to-image，它会把 mask-image 的 url 一并内联成 data URI，这套写法在导出时同样成立。
 */
export const getLockMaskStyle = (src: string, background: string) => ({
  background,
  maskImage: `url(${src})`,
  WebkitMaskImage: `url(${src})`,
  maskSize: 'contain' as const,
  WebkitMaskSize: 'contain' as const,
  maskRepeat: 'no-repeat' as const,
  WebkitMaskRepeat: 'no-repeat' as const,
  maskPosition: 'center' as const,
  WebkitMaskPosition: 'center' as const,
});

export const getLockTextStyle = (textData?: any) => ({
  fontFamily: textData?.font,
  fontSize: textData?.textSize ?? 12,
  lineHeight: textData?.textHeight ? `${textData.textHeight}px` : 1,
  whiteSpace: 'nowrap' as const,
});

/** textAlignment 取值与普通 widget 一致：1 左 / 2 居中 / 3 右 */
export const getLockTextJustify = (textAlignment?: number) => {
  if (textAlignment === 1) return 'flex-start';
  if (textAlignment === 3) return 'flex-end';
  return 'center';
};

/**
 * 节点 type 命名：lock_{组件类型}_{形状}_{变体号}，例如 lock_weather_circle_3。
 * 形状由 size 推出（1001 circle / 1002 rect / 1003 inline）；
 * 变体号各类型取的字段不同：weather 用 weatherType，health / countdown 用 layoutType，其余恒为 0。
 */
const getLockWidgetType = (type: number, item: any) => {
  const name = LOCK_TYPE_WIDGET_MAP[type];
  const shape = LOCK_SIZE_LABEL_MAP[item?.size];
  /**
   * 倒数日的 DIY 与非 DIY 是两套排版，但区分它们的是 canBeCustomised 而不是 layoutType
   * （见 lock_screen_countdown_layout_0_diy / _nodiy.yml 的判定条件），两边的 layoutType
   * 都可以是 0，只按变体号会算出同一个节点类型，所以单独给 1007 拼上 diy / nodiy。
   *
   * 只对 1007 这么做：Quotation 的 canBeCustomised 也是 1，
   * 把它掺进所有类型的变体号会把 Quotation 的节点类型也一起改掉。
   */
  if (type === 1007) {
    const customisable = item?.canBeCustomised === 1 ? 'diy' : 'nodiy';
    return `lock_${name}_${shape}_${customisable}_${item?.layoutType ?? 0}`;
  }
  const variant = item?.layoutType ?? item?.weatherType ?? 0;
  return `lock_${name}_${shape}_${variant}`;
};

/**
 * 锁屏组件 config -> xyflow nodes。
 *
 * 与 widget/util.ts 的 widgetConfig2Nodes 分开维护：锁屏组件只有 iOS 一个平台，
 * config 顶层直接是 version / type / sizes，不再按 ios / android / common 分组。
 */
export const lockWidgetConfig2Nodes: any = (config: any, element_key?: any) => {
  if (!config) {
    return { nodes: [], rootNode: null };
  }

  const rootGroupId = element_key || nanoid();
  const platformGroupId = `${nanoid()}_ios`;
  const childNodes: any[] = [];

  let groupWidth = GAP;
  let groupHeight = GAP;
  let startY = GAP;
  let themekitType = '';

  const sizes = Array.isArray(config.sizes) ? [...config.sizes].reverse() : [];
  sizes.forEach((item: any) => {
    const sizeConfig =
      LOCK_CONFIG_SIZE_MAP[item.size] || LOCK_CONFIG_SIZE_MAP[1002];
    const { width, height } = sizeConfig;
    themekitType = getLockWidgetType(config.type, item);
    groupWidth = Math.max(groupWidth, width + GAP * 2);

    childNodes.push({
      id: nanoid(),
      type: themekitType,
      metaable: true,
      data: { ...item },
      cropable: true,
      position: { x: GAP, y: startY },
      parentId: platformGroupId,
      extent: 'parent',
      draggable: false,
      connectable: false,
      focusable: false,
      selectable: false,
      style: {
        border: '2px solid transparent',
      },
    });

    startY += height + GAP;
    groupHeight += height + GAP;
  });

  const platformNode = {
    id: platformGroupId,
    type: 'platform_group',
    className: 'widget-group-node',
    position: { x: GAP, y: GAP },
    data: {
      ...config,
      label: 'ios',
      themekitType,
    },
    packable: true,
    parentId: rootGroupId,
    extent: 'parent',
    draggable: false,
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
  };

  const rootNode = {
    id: rootGroupId,
    type: 'group',
    className: 'widget-group-node',
    deleteable: true,
    position: { x: 0, y: 0 },
    data: {
      category: 'lockwidget',
    },
    draggable: false,
    connectable: false,
    focusable: false,
    zIndex: 1,
    style: {
      width: groupWidth + GAP * 2,
      height: groupHeight + GAP * 2,
      background: '#f5f7ff',
      border: '1px solid #b4c0ff',
      borderRadius: 16,
    },
  };

  return { nodes: [rootNode, platformNode, ...childNodes], rootNode };
};
