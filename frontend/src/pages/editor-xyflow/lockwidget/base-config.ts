/**
 * 锁屏组件的尺寸 / 类型定义。
 * 取值来自 widget/rule_ymal/resource-validation/lock_screen_*.yml 的校验规则，
 * 与普通 widget 的 base-config 是两套独立的 ID 空间，不要混用。
 */

/**
 * 锁屏素材是 @3x 出的，而画布坐标系用的是 @1x 点（普通 widget 是 155/329 这种点值，
 * 素材则是 2x 的 310/658），所以凡是从素材像素量出来的尺寸都要除以这个比例，
 * 否则在 Retina 屏上会被放大采样而发虚，画布上也会比普通 widget 大一圈。
 */
export const LOCK_ASSET_SCALE = 3;

/** 画布尺寸 = 各规则里 preview 图的像素尺寸 ÷ LOCK_ASSET_SCALE */
export const LOCK_WIDGET_SIZE: any = {
  // 素材 186 x 186
  circle: {
    width: 62,
    height: 62,
  },
  // 素材 465 x 186
  rect: {
    width: 155,
    height: 62,
  },
  // 素材 732 x 69
  inline: {
    width: 244,
    height: 23,
  },
};

/** 卡片圆角24px */
export const LOCK_CARD_RADIUS = 24 / LOCK_ASSET_SCALE;

/**
 * 天气条件图标，顺序取自 lock_screen_weather_*.yml 的 required_files。
 * 各 weatherType 用到的张数不同（矩形没有 image_temp），组件里按这个顺序
 * 过滤掉配置中不存在的即可，不用各自维护一份。
 */
export const LOCK_WEATHER_ICON_KEYS = [
  'image_cloud',
  'image_rain',
  'image_snow',
  'image_sun',
  'image_temp',
  'image_thunder',
  'image_wind',
];

/**
 * 锁屏组件全部的图片位，右侧属性面板按这个清单渲染上传入口，
 * 顺序即面板里的排列顺序。新增组件时要把它的图片字段名加进来，否则面板上传不了图。
 *
 * 用显式清单而不是按 image_ 前缀匹配：前缀匹配会把以后任何叫 image_ 开头的字段
 * 都悄悄捡进面板，加字段的人不会意识到自己改了 UI，出问题也不好查。
 */
export const LOCK_IMAGE_FIELD_KEYS = [
  'image_battery_rectangle',
  'image_charging_icon_rectangle',
  'image_empty_ring_rectangle',
  'image_calendar_rectangle',
  'image_count_down_rectangular',
  'image_count_down_rectangular_customised',
  'image_dynamics_gif',
  'image_static_rectangle',
  'image_static_circular',
  'image_health',
  ...LOCK_WEATHER_ICON_KEYS,
];

export const LOCK_CONFIG_SIZE_MAP: any = {
  1001: LOCK_WIDGET_SIZE.circle,
  1002: LOCK_WIDGET_SIZE.rect,
  1003: LOCK_WIDGET_SIZE.inline,
};

export const LOCK_SIZE_LABEL_MAP: Record<number, 'circle' | 'rect' | 'inline'> =
  {
    1001: 'circle',
    1002: 'rect',
    1003: 'inline',
  };
export const LOCK_TYPE_WIDGET_MAP: any = {
  1001: 'battery',
  1002: 'calendar',
  1004: 'weather',
  1005: 'dynamic',
  1006: 'static',
  1007: 'countdown',
  1008: 'quotation',
  1009: 'health',
  1010: 'launcher',
  1011: 'custominline',
};

/**
 * 与 LOCK_TYPE_WIDGET_MAP 对应的展示名，供左侧组件菜单和节点标题使用。
 * 剩余组件补齐前暂时还没有引用方。
 */
export const LOCK_TYPE_WIDGET_NAME_MAP: any = {
  1001: 'Battery',
  1002: 'Calendar',
  1004: 'Weather',
  1005: 'Dynamic',
  1006: 'Static',
  1007: 'Count Down',
  1008: 'Quotation',
  1009: 'Health',
  1010: 'Launcher',
  1011: 'Custom InLine',
};
