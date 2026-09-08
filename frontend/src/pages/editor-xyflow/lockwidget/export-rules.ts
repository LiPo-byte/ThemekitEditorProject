/**
 * 锁屏组件导出规则表。
 *
 * 数据全部来自 widget/rule_ymal/resource-validation/ 下的 29 个 lock_screen_*.yml
 * 与 lockpack.yml，是那些校验规则的机读版本；归纳说明见同目录 EXPORT_RULES.md。
 * yml 改了要回来同步，两边不一致时以 yml 为准。
 *
 * key 就是 xyFlowTypeNodeType.ts 注册的节点 type（lockwidget/util.ts 的 getLockWidgetType 产物），
 * 29 个 yml 与 29 个节点 type 恰好一一对应，所以不用再按 type + size + layoutType 拼多层判断。
 *
 * 看表时注意几处不能按类型名反推的命名，都是 yml 里就这么定的：
 * - 1005 Dynamic 的 rect 预览叫 widgets_rectangle_static_*，只有 circle 用 dynamic；
 * - 1006 Static 的预览一律用 pattern 而不是 static；
 * - 1010 Launcher 的 circle 预览是 png，其余类型的 preview 都是 jpg；
 * - 1005 Dynamic 两张预览都是 gif，且多一个文件名随 spec 的 sizes[].fileName 变的 gif；
 * - 1009 Health 的 image_health.png 每个变体尺寸都不同；
 * - 1004 Weather 每个变体要的天气图标是 7 张里的不同子集，不能整套输出。
 */

export type LockExportFormat = 'png' | 'jpg' | 'gif';

/** asset = 用户上传的素材，preview = 组件预览图 */
export type LockExportFileKind = 'asset' | 'preview';

export type LockExportFileRule = {
  /**
   * zip 内文件名，取自 yml 的 required_files。
   *
   * 1005 Dynamic 的 gif 名字随主题变（yml 没写进 required_files，改用 file_references
   * 校验 sizes[].fileName + .gif），这种传函数按当前尺寸项现算；
   * 名字必须和 spec 里的 fileName 逐字一致，所以函数里不要做大小写 / 字符归一化。
   */
  name: string | ((sizeData: Record<string, any>) => string);
  kind: LockExportFileKind;
  expectedWidth: number;
  expectedHeight: number;
  format: LockExportFormat;
  /**
   * 文件内容取 sizes[] 当前项的这个字段（上传资源的 URL），原样透传不重编码。
   * kind 为 preview 时表示这张预览就是用户上传的原图、不截图
   * （1005 Dynamic 的透明底 gif 就是用户上传的那张）。
   */
  sourceField?: string;
  /**
   * 与同一条规则里的另一个文件是同一张图，只是 yml 要求两个文件名。
   * 填对方的 name，导出时直接复用对方那份 blob，不再单独截图 / 下载。
   * 对方没产出时回落到自己的常规来源（asset 回落到 sourceField）。
   */
  copyOf?: string;
  /** 透明底预览（previewTransParent） */
  transparent?: boolean;
};

export type LockExportRule = {
  /** config 顶层 type */
  type: number;
  /** sizes[].size：1001 circle / 1002 rect / 1003 inline */
  size: 1001 | 1002 | 1003;
  /** 变体判定字段，可用来校验节点 data 与规则是否对得上 */
  match: Record<string, number>;
  /** 必须产出的文件，不含 widgets_spec.json（每套都有） */
  files: LockExportFileRule[];
  /** widgets_spec.json 里 sizes[0] 的必填字段 */
  specFields: string[];
};

/** widgets_spec.json 顶层必填字段，所有规则一致 */
export const LOCK_SPEC_TOP_FIELDS = [
  'version',
  'isLockScreen',
  'type',
  'sizes',
];

/** LockPack 整包规则，来自 lockpack.yml */
export const LOCKPACK_EXPORT_RULES = {
  previews: [
    {
      name: 'preview_long.jpg',
      expectedWidth: 887,
      expectedHeight: 1920,
      format: 'jpg',
    },
    {
      name: 'preview_short.jpg',
      expectedWidth: 887,
      expectedHeight: 1578,
      format: 'jpg',
    },
    {
      name: 'list_view.jpg',
      expectedWidth: 492,
      expectedHeight: 1065,
      format: 'jpg',
    },
  ],
  /** LockPack 只允许单张手机壁纸，且不含 icon */
  wallpaper: {
    name: 'wallpaper.jpg',
    expectedWidth: 887,
    expectedHeight: 1920,
    format: 'jpg',
  },
  /**
   * 多套组件时资源名要带序号后缀：widgets_spec_1.json / image_cloud_1.png…
   * 单套不加后缀。
   */
  multipleSuffixFrom: 1,
} as const;

export const LOCK_EXPORT_RULES: Record<string, LockExportRule> = {
  // Lockscreen Battery - Rect Layout0 校验规则
  lock_battery_rect_0: {
    type: 1001,
    size: 1002,
    match: {},
    files: [
      {
        name: 'image_battery_rectangle.png',
        kind: 'asset',
        expectedWidth: 36,
        expectedHeight: 36,
        format: 'png',
        sourceField: 'image_battery_rectangle',
      },
      {
        name: 'image_charging_icon_rectangle.png',
        kind: 'asset',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        sourceField: 'image_charging_icon_rectangle',
      },
      {
        name: 'image_empty_ring_rectangle.png',
        kind: 'asset',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        sourceField: 'image_empty_ring_rectangle',
      },
      {
        name: 'widgets_rectangle_battery_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_battery_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'name', 'title', 'percent', 'isCharging', 'mode'],
  },
  // Lockscreen Calendar - Rect Layout0 校验规则
  lock_calendar_rect_0: {
    type: 1002,
    size: 1002,
    match: {},
    files: [
      {
        name: 'image_calendar_rectangle.png',
        kind: 'asset',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        sourceField: 'image_calendar_rectangle',
      },
      {
        name: 'widgets_rectangle_calendar_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_calendar_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'name', 'title', 'date', 'weekday', 'calendar'],
  },
  // Lockscreen Weather - Rect weather1 校验规则
  lock_weather_rect_1: {
    type: 1004,
    size: 1002,
    match: { weatherType: 1 },
    files: [
      {
        name: 'image_cloud.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_cloud',
      },
      {
        name: 'image_rain.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_rain',
      },
      {
        name: 'image_snow.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_snow',
      },
      {
        name: 'image_sun.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_sun',
      },
      {
        name: 'image_thunder.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_thunder',
      },
      {
        name: 'image_wind.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_wind',
      },
      {
        name: 'widgets_rectangle_weather_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_weather_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'weatherType', 'name', 'topInfo', 'bottomInfo'],
  },
  // Lockscreen Weather - Rect weather2 校验规则
  lock_weather_rect_2: {
    type: 1004,
    size: 1002,
    match: { weatherType: 2 },
    files: [
      {
        name: 'image_cloud.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_cloud',
      },
      {
        name: 'image_rain.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_rain',
      },
      {
        name: 'image_snow.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_snow',
      },
      {
        name: 'image_sun.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_sun',
      },
      {
        name: 'image_temp.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_temp',
      },
      {
        name: 'image_thunder.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_thunder',
      },
      {
        name: 'widgets_rectangle_weather_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_weather_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'weatherType', 'name', 'topInfo', 'bottomInfo'],
  },
  // Lockscreen Weather - Rect weather3 校验规则
  lock_weather_rect_3: {
    type: 1004,
    size: 1002,
    match: { weatherType: 3 },
    files: [
      {
        name: 'image_cloud.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_cloud',
      },
      {
        name: 'image_rain.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_rain',
      },
      {
        name: 'image_snow.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_snow',
      },
      {
        name: 'image_sun.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_sun',
      },
      {
        name: 'image_thunder.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_thunder',
      },
      {
        name: 'image_wind.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_wind',
      },
      {
        name: 'widgets_rectangle_weather_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_weather_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'weatherType', 'name', 'topInfo', 'bottomInfo'],
  },
  // Lockscreen Weather - Rect weather4 校验规则
  lock_weather_rect_4: {
    type: 1004,
    size: 1002,
    match: { weatherType: 4 },
    files: [
      {
        name: 'image_cloud.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_cloud',
      },
      {
        name: 'image_rain.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_rain',
      },
      {
        name: 'image_snow.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_snow',
      },
      {
        name: 'image_sun.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_sun',
      },
      {
        name: 'image_thunder.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_thunder',
      },
      {
        name: 'image_wind.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_wind',
      },
      {
        name: 'widgets_rectangle_weather_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_weather_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'weatherType', 'name', 'topInfo', 'bottomInfo'],
  },
  // Lockscreen Weather - Rect weather5 校验规则
  lock_weather_rect_5: {
    type: 1004,
    size: 1002,
    match: { weatherType: 5 },
    files: [
      {
        name: 'widgets_rectangle_weather_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_weather_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'weatherType', 'name', 'topInfo', 'bottomInfo'],
  },
  // Lockscreen Weather - Rect weather6 校验规则
  lock_weather_rect_6: {
    type: 1004,
    size: 1002,
    match: { weatherType: 6 },
    files: [
      {
        name: 'widgets_rectangle_weather_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_weather_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'weatherType', 'name', 'topInfo', 'bottomInfo'],
  },
  // Lockscreen Weather - Circle weather1 校验规则
  lock_weather_circle_1: {
    type: 1004,
    size: 1001,
    match: { weatherType: 1 },
    files: [
      {
        name: 'image_cloud.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_cloud',
      },
      {
        name: 'image_rain.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_rain',
      },
      {
        name: 'image_snow.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_snow',
      },
      {
        name: 'image_sun.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_sun',
      },
      {
        name: 'image_temp.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_temp',
      },
      {
        name: 'image_thunder.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_thunder',
      },
      {
        name: 'image_wind.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_wind',
      },
      {
        name: 'widgets_circular_weather_preview.jpg',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_circular_weather_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'weatherType', 'name', 'bottomInfo'],
  },
  // Lockscreen Weather - Circle weather2 校验规则
  lock_weather_circle_2: {
    type: 1004,
    size: 1001,
    match: { weatherType: 2 },
    files: [
      {
        name: 'image_cloud.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_cloud',
      },
      {
        name: 'image_rain.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_rain',
      },
      {
        name: 'image_snow.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_snow',
      },
      {
        name: 'image_sun.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_sun',
      },
      {
        name: 'image_thunder.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_thunder',
      },
      {
        name: 'image_wind.png',
        kind: 'asset',
        expectedWidth: 42,
        expectedHeight: 42,
        format: 'png',
        sourceField: 'image_wind',
      },
      {
        name: 'widgets_circular_weather_preview.jpg',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_circular_weather_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'weatherType', 'name', 'bottomInfo'],
  },
  // Lockscreen Weather - Circle weather3 校验规则
  lock_weather_circle_3: {
    type: 1004,
    size: 1001,
    match: { weatherType: 3 },
    files: [
      {
        name: 'widgets_circular_weather_preview.jpg',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_circular_weather_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'weatherType', 'name', 'bottomInfo'],
  },
  // Lockscreen Weather - Circle weather4 校验规则
  lock_weather_circle_4: {
    type: 1004,
    size: 1001,
    match: { weatherType: 4 },
    files: [
      {
        name: 'widgets_circular_weather_preview.jpg',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_circular_weather_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'weatherType', 'name', 'bottomInfo'],
  },
  // Lockscreen Dynamic - Rect Layout0 校验规则
  lock_dynamic_rect_0: {
    type: 1005,
    size: 1002,
    match: {},
    files: [
      {
        name: 'widgets_rectangle_static_preview.gif',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'gif',
      },
      {
        name: 'widgets_rectangle_static_previewTransParent.gif',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'gif',
        transparent: true,
        sourceField: 'image_dynamics_gif',
      },
      {
        name: (sizeData) => {
          const fileName = String(sizeData.fileName ?? '').trim();
          return fileName ? `${fileName}.gif` : '';
        },
        kind: 'asset',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'gif',
        sourceField: 'image_dynamics_gif',
        copyOf: 'widgets_rectangle_static_previewTransParent.gif',
      },
    ],
    specFields: ['size', 'name', 'fileName'],
  },
  // Lockscreen Dynamic - Circle Layout0 校验规则
  lock_dynamic_circle_0: {
    type: 1005,
    size: 1001,
    match: {},
    files: [
      {
        name: 'widgets_circular_dynamic_preview.gif',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'gif',
      },
      {
        name: 'widgets_circular_dynamic_previewTransParent.gif',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'gif',
        transparent: true,
        sourceField: 'image_dynamics_gif',
      },
      {
        name: (sizeData) => {
          const fileName = String(sizeData.fileName ?? '').trim();
          return fileName ? `${fileName}.gif` : '';
        },
        kind: 'asset',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'gif',
        sourceField: 'image_dynamics_gif',
        copyOf: 'widgets_circular_dynamic_previewTransParent.gif',
      },
    ],
    specFields: ['size', 'name', 'fileName'],
  },
  // Lockscreen Static - Rect Layout0 校验规则
  lock_static_rect_0: {
    type: 1006,
    size: 1002,
    match: {},
    files: [
      {
        name: 'image_static_rectangle.png',
        kind: 'asset',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        sourceField: 'image_static_rectangle',
      },
      {
        name: 'widgets_rectangle_pattern_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_pattern_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'name'],
  },
  // Lockscreen Static - Circle Layout0 校验规则
  lock_static_circle_0: {
    type: 1006,
    size: 1001,
    match: {},
    files: [
      {
        name: 'image_static_circular.png',
        kind: 'asset',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        sourceField: 'image_static_circular',
      },
      {
        name: 'widgets_circular_pattern_preview.jpg',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_circular_pattern_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'name'],
  },
  // Lockscreen Quotation - Rect Layout0 校验规则
  lock_quotation_rect_0: {
    type: 1008,
    size: 1002,
    match: {},
    files: [
      {
        name: 'widgets_rectangle_quotation_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_quotation_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'name', 'canBeCustomised', 'numberOfLines', 'title'],
  },
  // Lockscreen CountDown - Rect Layout0 NoDIY 校验规则
  lock_countdown_rect_nodiy_0: {
    type: 1007,
    size: 1002,
    match: { canBeCustomised: 0 },
    files: [
      {
        name: 'image_count_down_rectangular.png',
        kind: 'asset',
        expectedWidth: 129,
        expectedHeight: 126,
        format: 'png',
        sourceField: 'image_count_down_rectangular',
      },
      {
        name: 'widgets_rectangle_count_down_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_count_down_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: [
      'size',
      'name',
      'canBeCustomised',
      'festivalName',
      'title',
      'days',
      'remainDays',
    ],
  },
  // Lockscreen CountDown - Rect Layout0 DIY 校验规则
  lock_countdown_rect_diy_0: {
    type: 1007,
    size: 1002,
    match: { canBeCustomised: 1, layoutType: 0 },
    files: [
      {
        name: 'widgets_rectangle_count_down_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_count_down_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: [
      'size',
      'name',
      'canBeCustomised',
      'layoutType',
      'title',
      'remainDays',
    ],
  },
  // Lockscreen CountDown - Rect Layout1 DIY 校验规则
  lock_countdown_rect_diy_1: {
    type: 1007,
    size: 1002,
    match: { canBeCustomised: 1, layoutType: 1 },
    files: [
      {
        name: 'widgets_rectangle_count_down_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_count_down_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: [
      'size',
      'name',
      'canBeCustomised',
      'layoutType',
      'title',
      'remainDays',
    ],
  },
  // Lockscreen Health - Rect Layout0 校验规则
  lock_health_rect_0: {
    type: 1009,
    size: 1002,
    match: { layoutType: 0 },
    files: [
      {
        name: 'image_health.png',
        kind: 'asset',
        expectedWidth: 24,
        expectedHeight: 48,
        format: 'png',
        sourceField: 'image_health',
      },
      {
        // 就是那张透明底预览，客户端要两个文件名；用户没上传底图也照样有
        name: 'image_static_rectangle.png',
        kind: 'asset',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        sourceField: 'image_static_rectangle',
        copyOf: 'widgets_rectangle_health_previewTransParent.png',
      },
      {
        name: 'widgets_rectangle_health_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_health_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'name', 'layoutType'],
  },
  // Lockscreen Health - Rect Layout1 校验规则
  lock_health_rect_1: {
    type: 1009,
    size: 1002,
    match: { layoutType: 1 },
    files: [
      {
        name: 'image_health.png',
        kind: 'asset',
        expectedWidth: 78,
        expectedHeight: 72,
        format: 'png',
        sourceField: 'image_health',
      },
      {
        // 就是那张透明底预览，客户端要两个文件名；用户没上传底图也照样有
        name: 'image_static_rectangle.png',
        kind: 'asset',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        sourceField: 'image_static_rectangle',
        copyOf: 'widgets_rectangle_health_previewTransParent.png',
      },
      {
        name: 'widgets_rectangle_health_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_health_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'name', 'layoutType'],
  },
  // Lockscreen Health - Circle Layout0 校验规则
  lock_health_circle_0: {
    type: 1009,
    size: 1001,
    match: { layoutType: 0 },
    files: [
      {
        name: 'image_health.png',
        kind: 'asset',
        expectedWidth: 60,
        expectedHeight: 69,
        format: 'png',
        sourceField: 'image_health',
      },
      {
        // 就是那张透明底预览，客户端要两个文件名；用户没上传底图也照样有
        name: 'image_static_circular.png',
        kind: 'asset',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        sourceField: 'image_static_circular',
        copyOf: 'widgets_circular_health_previewTransParent.png',
      },
      {
        name: 'widgets_circular_health_preview.jpg',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_circular_health_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'name', 'layoutType'],
  },
  // Lockscreen Health - Circle Layout1 校验规则
  lock_health_circle_1: {
    type: 1009,
    size: 1001,
    match: { layoutType: 1 },
    files: [
      {
        name: 'image_health.png',
        kind: 'asset',
        expectedWidth: 60,
        expectedHeight: 60,
        format: 'png',
        sourceField: 'image_health',
      },
      {
        // 就是那张透明底预览，客户端要两个文件名；用户没上传底图也照样有
        name: 'image_static_circular.png',
        kind: 'asset',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        sourceField: 'image_static_circular',
        copyOf: 'widgets_circular_health_previewTransParent.png',
      },
      {
        name: 'widgets_circular_health_preview.jpg',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_circular_health_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'name', 'layoutType'],
  },
  // Lockscreen Health - Circle Layout2 校验规则
  lock_health_circle_2: {
    type: 1009,
    size: 1001,
    match: { layoutType: 2 },
    files: [
      {
        name: 'image_health.png',
        kind: 'asset',
        expectedWidth: 60,
        expectedHeight: 60,
        format: 'png',
        sourceField: 'image_health',
      },
      {
        // 就是那张透明底预览，客户端要两个文件名；用户没上传底图也照样有
        name: 'image_static_circular.png',
        kind: 'asset',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        sourceField: 'image_static_circular',
        copyOf: 'widgets_circular_health_previewTransParent.png',
      },
      {
        name: 'widgets_circular_health_preview.jpg',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_circular_health_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'name', 'layoutType'],
  },
  // Lockscreen Health - Inline Layout0 校验规则
  lock_health_inline_0: {
    type: 1009,
    size: 1003,
    match: { layoutType: 0 },
    files: [
      {
        name: 'image_health.png',
        kind: 'asset',
        expectedWidth: 51,
        expectedHeight: 45,
        format: 'png',
        sourceField: 'image_health',
      },
      {
        // 就是那张透明底预览，客户端要两个文件名；用户没上传底图也照样有
        name: 'image_static_inline.png',
        kind: 'asset',
        expectedWidth: 732,
        expectedHeight: 69,
        format: 'png',
        sourceField: 'image_static_inline',
        copyOf: 'widgets_inline_health_previewTransParent.png',
      },
      {
        name: 'widgets_inline_health_preview.jpg',
        kind: 'preview',
        expectedWidth: 732,
        expectedHeight: 69,
        format: 'jpg',
      },
      {
        name: 'widgets_inline_health_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 732,
        expectedHeight: 69,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'name', 'layoutType'],
  },
  // Lockscreen Launcher - Rect Layout0 校验规则
  lock_launcher_rect_0: {
    type: 1010,
    size: 1002,
    match: {},
    files: [
      {
        name: 'image_launcher_rectangle.png',
        kind: 'asset',
        expectedWidth: 102,
        expectedHeight: 102,
        format: 'png',
        sourceField: 'image_launcher_rectangle',
      },
      {
        name: 'widgets_rectangle_launcher_preview.jpg',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'jpg',
      },
      {
        name: 'widgets_rectangle_launcher_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 465,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'name', 'title', 'appLinks'],
  },
  // Lockscreen Launcher - Circle Layout0 校验规则
  lock_launcher_circle_0: {
    type: 1010,
    size: 1001,
    match: {},
    files: [
      {
        name: 'image_launcher_circular.png',
        kind: 'asset',
        expectedWidth: 108,
        expectedHeight: 108,
        format: 'png',
        sourceField: 'image_launcher_circular',
      },
      {
        name: 'widgets_circular_launcher_preview.png',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
      },
      {
        name: 'widgets_circular_launcher_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 186,
        expectedHeight: 186,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'name', 'appLinks'],
  },
  // Lockscreen Custom - Inline Layout0 校验规则
  lock_custominline_inline_0: {
    type: 1011,
    size: 1003,
    match: { layoutType: 0, numberOfLines: 1 },
    files: [
      {
        name: 'widgets_inline_customtext_preview.jpg',
        kind: 'preview',
        expectedWidth: 732,
        expectedHeight: 69,
        format: 'jpg',
      },
      {
        name: 'widgets_inline_customtext_previewTransParent.png',
        kind: 'preview',
        expectedWidth: 732,
        expectedHeight: 69,
        format: 'png',
        transparent: true,
      },
    ],
    specFields: ['size', 'name', 'layoutType', 'numberOfLines', 'title'],
  },
};

/** 按节点 type 取导出规则，未登记的返回 undefined */
export const getLockExportRule = (
  nodeType?: string,
): LockExportRule | undefined =>
  nodeType ? LOCK_EXPORT_RULES[nodeType] : undefined;

/** 当前已登记规则的节点 type 列表 */
export const listLockExportRuleKeys = () => Object.keys(LOCK_EXPORT_RULES);
