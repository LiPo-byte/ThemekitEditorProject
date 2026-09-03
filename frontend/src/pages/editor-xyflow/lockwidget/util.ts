import { nanoid } from 'nanoid';
import {
  LOCK_CONFIG_SIZE_MAP,
  LOCK_SIZE_LABEL_MAP,
  LOCK_TYPE_WIDGET_MAP,
} from './base-config';

const GAP = 50;

/**
 * 节点 type 命名：lock_{组件类型}_{形状}_{变体号}，例如 lock_weather_circle_3。
 * 形状由 size 推出（1001 circle / 1002 rect / 1003 inline）；
 * 变体号各类型取的字段不同：weather 用 weatherType，health / countdown 用 layoutType，其余恒为 0。
 */
const getLockWidgetType = (type: number, item: any) => {
  const name = LOCK_TYPE_WIDGET_MAP[type];
  const shape = LOCK_SIZE_LABEL_MAP[item?.size];
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
