/**
 * Control Center 资源规则表。
 *
 * 数据全部来自 widget/rule_ymal/resource-validation/control_center.yaml，
 * 是那份校验规则的机读版本。yaml 改了要回来同步，两边不一致时以 yaml 为准。
 *
 * 整包 74 个文件 = 73 个素材 + control_spec.json。yaml 的 required_files 与
 * file_rules 是一一对应的，没有「要求存在却没写尺寸」或反之的情况，
 * 所以这里把两张表合并成 CONTROL_CENTER_FILES 一张，顺序保持 yaml 原序。
 *
 * 本文件只做「文件清单 / 分组 / 配对 / 校验」，不依赖 xyflow、不产出节点，
 * 画布怎么摆由调用方决定。
 *
 * 两个派生维度都是从文件名推导出来的，不手工维护映射表：
 *
 * 1. 分组（resolveControlCenterGroup）——先剥掉 common_ 再取第一段。
 *    common_ 不是功能模块，是「该资源被多个界面复用」的标记，直接按原始前缀分
 *    会把界面上并排的东西拆开（common_control_ic_wifi 和 control_ic_hotspot
 *    是控制中心同一排的开关）。剥掉之后正好得到 control / home / light / music
 *    四组，加上整包封面 preview.jpg 单独成一组 root。
 *
 * 2. 配对（resolveControlCenterSlot）——按后缀把同一功能的多个文件归到一个槽位。
 *    73 个素材合成 44 个槽位，比如手电筒的 4 个文件
 *    (.png / _select.png / _open.pag / _close.pag) 是一个槽位。
 *    control_spec.json 不进槽位表，它是整包的配色配置，挂在根节点上。
 */

export type ControlCenterFormat = 'png' | 'jpg' | 'pag';

/** 剥掉 common_ 后的一级前缀；root 只有整包封面 preview.jpg */
export type ControlCenterGroup =
  | 'root'
  | 'control'
  | 'home'
  | 'light'
  | 'music';

/** 文件在所属槽位里扮演的角色 */
export type ControlCenterFileRole =
  | 'base' // 默认态 / 单图
  | 'select' // 选中态
  | 'open' // 开启动画（pag）
  | 'close' // 关闭动画（pag）
  | 'track' // 滑条空轨道
  | 'fill' // 滑条已填充部分
  | 'thumb' // 滑条可拖动的圆点
  | 'preview'; // 效果预览图，不参与端上渲染

/** 槽位类型，由槽位内出现的 role 推导，决定画布上这一格怎么渲染 */
export type ControlCenterSlotKind =
  | 'preview' // 单张整屏效果图
  | 'image' // 单图
  | 'toggle' // 双态：base + select
  | 'animated_toggle' // 双态 + 开关过渡动画：base + select + open + close
  | 'slider'; // 滑条：track + fill (+ thumb)

export type ControlCenterFileRule = {
  /** zip 内文件名，取自 yaml 的 required_files */
  name: string;
  /** pag 在 yaml 里只校验格式、没有尺寸要求，所以这两个字段可缺省 */
  expectedWidth?: number;
  expectedHeight?: number;
  format: ControlCenterFormat;
};

/** 配色与数值配置，不在 CONTROL_CENTER_FILES 里，单独处理 */
export const CONTROL_CENTER_SPEC_FILE = 'control_spec.json';

// biome-ignore format: 一行一个文件，方便和 control_center.yaml 的 required_files 逐行对照
export const CONTROL_CENTER_FILES: readonly ControlCenterFileRule[] = [
  { name: 'common_control_ic_airplane.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  { name: 'common_control_ic_airplane_select.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  { name: 'common_control_ic_bluetooth.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  { name: 'common_control_ic_bluetooth_select.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  { name: 'common_control_ic_data.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  { name: 'common_control_ic_data_select.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  // 同组另外 3 个开关都是 common_control_ic_*，只有 wifi 少个 ic_，yaml 就这么写的
  { name: 'common_control_wifi.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  { name: 'common_control_wifi_select.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  { name: 'common_home_sound_bg.png', expectedWidth: 195, expectedHeight: 432, format: 'png' },
  { name: 'common_home_sound_big.png', expectedWidth: 105, expectedHeight: 105, format: 'png' },
  { name: 'common_home_sound_mute.png', expectedWidth: 105, expectedHeight: 105, format: 'png' },
  { name: 'common_home_sound_slide.png', expectedWidth: 195, expectedHeight: 432, format: 'png' },
  { name: 'common_light_bg.png', expectedWidth: 381, expectedHeight: 984, format: 'png' },
  { name: 'common_light_slide.png', expectedWidth: 381, expectedHeight: 984, format: 'png' },
  { name: 'common_music_ic_next.png', expectedWidth: 90, expectedHeight: 90, format: 'png' },
  { name: 'common_music_ic_pause.png', expectedWidth: 90, expectedHeight: 90, format: 'png' },
  { name: 'common_music_ic_play.png', expectedWidth: 90, expectedHeight: 90, format: 'png' },
  { name: 'common_music_ic_previous.png', expectedWidth: 90, expectedHeight: 90, format: 'png' },
  { name: 'control_bg.png', expectedWidth: 906, expectedHeight: 1197, format: 'png' },
  { name: 'control_ic_hotspot.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  { name: 'control_ic_hotspot_select.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  { name: 'control_ic_sync.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  { name: 'control_ic_sync_select.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  { name: 'control_preview.jpg', expectedWidth: 1080, expectedHeight: 2338, format: 'jpg' },
  // 叫 bg 不叫 preview，是真参与渲染的整屏背景
  { name: 'home_bg.jpg', expectedWidth: 1080, expectedHeight: 2338, format: 'jpg' },
  { name: 'home_bottom_diy_bg.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'home_bottom_ic_battery.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'home_bottom_ic_calculator.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'home_bottom_ic_camera.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'home_bottom_ic_flashlight.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'home_bottom_ic_flashlight_close.pag', format: 'pag' },
  { name: 'home_bottom_ic_flashlight_open.pag', format: 'pag' },
  { name: 'home_bottom_ic_flashlight_select.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'home_bottom_ic_record.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'home_bottom_ic_record_close.pag', format: 'pag' },
  { name: 'home_bottom_ic_record_open.pag', format: 'pag' },
  { name: 'home_bottom_ic_record_select.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  // 录音机，和上面的 record（录屏）是两个独立功能，不是它的第三态，
  // 所以没有 _select 和 pag，单图自成一个槽位
  { name: 'home_bottom_ic_recording.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'home_bottom_ic_screenshot.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'home_bottom_ic_setup.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'home_bottom_ic_timing.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'home_control_bg.png', expectedWidth: 432, expectedHeight: 432, format: 'png' },
  { name: 'home_light_icon.png', expectedWidth: 105, expectedHeight: 105, format: 'png' },
  { name: 'home_music_bg.png', expectedWidth: 432, expectedHeight: 432, format: 'png' },
  // 同组其余 second 图标都是 195x195，只有 focus 是双倍宽，占两格
  { name: 'home_second_ic_focus.png', expectedWidth: 432, expectedHeight: 195, format: 'png' },
  { name: 'home_second_ic_focus_close.pag', format: 'pag' },
  { name: 'home_second_ic_focus_open.pag', format: 'pag' },
  { name: 'home_second_ic_focus_select.png', expectedWidth: 432, expectedHeight: 195, format: 'png' },
  { name: 'home_second_ic_locking.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'home_second_ic_locking_close.pag', format: 'pag' },
  { name: 'home_second_ic_locking_open.pag', format: 'pag' },
  { name: 'home_second_ic_locking_select.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'home_second_ic_ring.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'home_second_ic_ring_close.pag', format: 'pag' },
  { name: 'home_second_ic_ring_open.pag', format: 'pag' },
  { name: 'home_second_ic_ring_select.png', expectedWidth: 195, expectedHeight: 195, format: 'png' },
  { name: 'light_empty_preview.jpg', expectedWidth: 1080, expectedHeight: 2338, format: 'jpg' },
  { name: 'light_full_preview.jpg', expectedWidth: 1080, expectedHeight: 2338, format: 'jpg' },
  { name: 'light_ic_auto_bright.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  { name: 'light_ic_auto_bright_select.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  // 同组另两个 light_ic_* 都是 153x153，只有这张 150x150
  { name: 'light_ic_light.png', expectedWidth: 150, expectedHeight: 150, format: 'png' },
  { name: 'light_ic_night_shift.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  { name: 'light_ic_night_shift_select.png', expectedWidth: 153, expectedHeight: 153, format: 'png' },
  { name: 'music_bg.png', expectedWidth: 894, expectedHeight: 1512, format: 'png' },
  { name: 'music_bg_music_progress.png', expectedWidth: 774, expectedHeight: 24, format: 'png' },
  { name: 'music_bg_sound_progress.png', expectedWidth: 612, expectedHeight: 24, format: 'png' },
  { name: 'music_ic_music_progress.png', expectedWidth: 36, expectedHeight: 36, format: 'png' },
  { name: 'music_ic_sound_progress.png', expectedWidth: 66, expectedHeight: 66, format: 'png' },
  // 带 im_ 但不是进度条填充层，是无封面时的默认专辑图，见 resolveControlCenterSlot
  { name: 'music_im_default.png', expectedWidth: 774, expectedHeight: 762, format: 'png' },
  { name: 'music_im_music_progress.png', expectedWidth: 774, expectedHeight: 24, format: 'png' },
  { name: 'music_im_sound_progress.png', expectedWidth: 612, expectedHeight: 24, format: 'png' },
  { name: 'music_preview.jpg', expectedWidth: 1080, expectedHeight: 2338, format: 'jpg' },
  { name: 'preview.jpg', expectedWidth: 1080, expectedHeight: 2338, format: 'jpg' },
];

/** 整包必须存在的文件，含 control_spec.json；顺序与 yaml 的 required_files 一致 */
export const CONTROL_CENTER_REQUIRED_FILES: readonly string[] = [
  CONTROL_CENTER_SPEC_FILE,
  ...CONTROL_CENTER_FILES.map((file) => file.name),
];

const FILE_RULE_BY_NAME = new Map(
  CONTROL_CENTER_FILES.map((file) => [file.name, file]),
);

export const getControlCenterFileRule = (
  name: string,
): ControlCenterFileRule | undefined => FILE_RULE_BY_NAME.get(name);

/**
 * config 的 assets 用不带后缀的素材名当 key（73 个文件去掉后缀后没有重名），
 * 后缀存在条目自己的 ext 字段里，导出时用 `${key}.${ext}` 拼回包内文件名。
 */
export const toControlCenterAssetKey = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, '');

// ---------------------------------------------------------------------------
// control_spec.json
// ---------------------------------------------------------------------------

export type ControlCenterSpecFieldKind = 'color' | 'alpha' | 'integer';

/** yaml 的 json_value_checks 只用到这 3 条正则，按 kind 复用而不是逐字段重复 */
export const CONTROL_CENTER_SPEC_PATTERNS: Record<
  ControlCenterSpecFieldKind,
  RegExp
> = {
  color: /^#[0-9A-Fa-f]{6}$/,
  alpha: /^(0(\.\d+)?|1(\.0+)?)$/,
  integer: /^(0|[1-9]\d*)$/,
};

export type ControlCenterSpecField = {
  key: string;
  kind: ControlCenterSpecFieldKind;
};

/**
 * json_template.fields 与 json_value_checks 在 yaml 里覆盖的是同一批 21 个字段，
 * 全部 required，所以这里不再单独标 required。
 */
export const CONTROL_CENTER_SPEC_FIELDS: readonly ControlCenterSpecField[] = [
  { key: 'pullBarColor', kind: 'color' },
  { key: 'pullBarAlpha', kind: 'alpha' },
  { key: 'controlTextColor', kind: 'color' },
  { key: 'controlTextAlpha', kind: 'alpha' },
  { key: 'volumeTextColor', kind: 'color' },
  { key: 'volumeTextAlpha', kind: 'alpha' },
  { key: 'brightnessTextColor', kind: 'color' },
  { key: 'brightnessTextAlpha', kind: 'alpha' },
  { key: 'musicKnownTitleColor', kind: 'color' },
  { key: 'musicKnownTitleAlpha', kind: 'alpha' },
  { key: 'musicKnownSingerColor', kind: 'color' },
  { key: 'musicKnownSingerAlpha', kind: 'alpha' },
  { key: 'musicUnknownTitleColor', kind: 'color' },
  { key: 'musicUnknownTitleAlpha', kind: 'alpha' },
  { key: 'musicUnknownSingerColor', kind: 'color' },
  { key: 'musicUnknownSingerAlpha', kind: 'alpha' },
  { key: 'musicTimeColor', kind: 'color' },
  { key: 'musicTimeAlpha', kind: 'alpha' },
  { key: 'musicAlbumCorner', kind: 'integer' },
  { key: 'homeControlDiyCorner', kind: 'integer' },
  { key: 'homeControlDiySize', kind: 'integer' },
];

const SPEC_FIELD_BY_KEY = new Map(
  CONTROL_CENTER_SPEC_FIELDS.map((field) => [field.key, field]),
);

/**
 * yaml 的 pattern 是按值的字符串形式写的，但 alpha / corner 在 json 里通常是数字，
 * 所以这里统一转成字符串再匹配。
 *
 * yaml 里 allow_extra_fields 为 true，未登记的字段一律放行。
 */
export const validateControlCenterSpecValue = (
  key: string,
  value: unknown,
): boolean => {
  const field = SPEC_FIELD_BY_KEY.get(key);
  if (!field) return true;
  return CONTROL_CENTER_SPEC_PATTERNS[field.kind].test(String(value));
};

/** 返回 control_spec.json 里缺失或不合规的字段 key */
export const listControlCenterSpecIssues = (
  spec: Record<string, unknown> | null | undefined,
): Array<{ key: string; reason: 'missing' | 'pattern' }> => {
  const source = spec ?? {};
  const issues: Array<{ key: string; reason: 'missing' | 'pattern' }> = [];
  CONTROL_CENTER_SPEC_FIELDS.forEach((field) => {
    const value = source[field.key];
    if (value === undefined || value === null || value === '') {
      issues.push({ key: field.key, reason: 'missing' });
      return;
    }
    if (!validateControlCenterSpecValue(field.key, value)) {
      issues.push({ key: field.key, reason: 'pattern' });
    }
  });
  return issues;
};

// ---------------------------------------------------------------------------
// 分组与槽位推导
// ---------------------------------------------------------------------------

const GROUPS = new Set<ControlCenterGroup>([
  'control',
  'home',
  'light',
  'music',
]);

/**
 * 先剥掉 common_ 再取第一段。common_ 表示「被多个界面复用」，不是功能模块，
 * 直接按原始前缀分会多出一个 18 个文件的 common 杂物堆，且把同一排的开关拆开。
 *
 * 剥掉之后 common_home_sound_*（音量条）会落到 home 组，但控制中心其实也在用它，
 * 这是剥 common_ 丢掉的唯一信息。只做槽位网格不受影响，将来要按真实布局还原
 * control 面时，需要跨组引用 home 组的音量条素材。
 */
export const resolveControlCenterGroup = (
  fileName: string,
): ControlCenterGroup | null => {
  if (fileName === 'preview.jpg') return 'root';
  const withoutCommon = fileName.startsWith('common_')
    ? fileName.slice('common_'.length)
    : fileName;
  const head = withoutCommon.split('_')[0].replace(/\.[^.]+$/, '');
  return GROUPS.has(head as ControlCenterGroup)
    ? (head as ControlCenterGroup)
    : null;
};

/**
 * 竖向滑条只有音量和亮度两条，用白名单而不是「_bg 结尾即轨道」来判定，
 * 否则 home_bottom_diy_bg.png（底部 DIY 按钮的底图）会被误判成轨道。
 */
const SLIDER_TRACK_BASES = new Set(['common_home_sound_bg', 'common_light_bg']);

const PROGRESS_ROLE_BY_TAG: Record<string, ControlCenterFileRole> = {
  bg: 'track',
  im: 'fill',
  ic: 'thumb',
};

/**
 * 把文件名拆成「槽位 key + 该文件在槽位里的角色」。
 * 同一槽位的文件共用一个 key，画布上就是一格，右侧面板里是一组上传框。
 */
export const resolveControlCenterSlot = (
  fileName: string,
): { slot: string; role: ControlCenterFileRole } => {
  const base = fileName.replace(/\.[^.]+$/, '');

  if (base === 'preview' || base.endsWith('_preview')) {
    return { slot: base, role: 'preview' };
  }
  if (base.endsWith('_select')) {
    return { slot: base.slice(0, -'_select'.length), role: 'select' };
  }
  if (base.endsWith('_open')) {
    return { slot: base.slice(0, -'_open'.length), role: 'open' };
  }
  if (base.endsWith('_close')) {
    return { slot: base.slice(0, -'_close'.length), role: 'close' };
  }

  // 横向进度条三件套：music_{bg|im|ic}_{music|sound}_progress。
  // 必须以 _progress 结尾才算，否则 music_im_default.png 会被当成填充层。
  const progress = /^(.+?)_(bg|im|ic)_(.+_progress)$/.exec(base);
  if (progress) {
    return {
      slot: `${progress[1]}_${progress[3]}`,
      role: PROGRESS_ROLE_BY_TAG[progress[2]],
    };
  }

  if (SLIDER_TRACK_BASES.has(base)) {
    return { slot: base.slice(0, -'_bg'.length), role: 'track' };
  }
  if (base.endsWith('_slide')) {
    return { slot: base.slice(0, -'_slide'.length), role: 'fill' };
  }

  return { slot: base, role: 'base' };
};

export type ControlCenterSlot = {
  key: string;
  group: ControlCenterGroup;
  kind: ControlCenterSlotKind;
  /** 同一槽位内 role 不重复，缺的 role 表示这个槽位没有那种文件 */
  files: Partial<Record<ControlCenterFileRole, ControlCenterFileRule>>;
};

const resolveSlotKind = (
  roles: Set<ControlCenterFileRole>,
): ControlCenterSlotKind => {
  if (roles.has('preview')) return 'preview';
  if (roles.has('track')) return 'slider';
  if (roles.has('open') || roles.has('close')) return 'animated_toggle';
  if (roles.has('select')) return 'toggle';
  return 'image';
};

const buildSlots = (): ControlCenterSlot[] => {
  const byKey = new Map<string, ControlCenterSlot>();
  CONTROL_CENTER_FILES.forEach((file) => {
    const group = resolveControlCenterGroup(file.name);
    if (!group) return;
    const { slot, role } = resolveControlCenterSlot(file.name);
    const existing = byKey.get(slot);
    if (existing) {
      existing.files[role] = file;
      return;
    }
    byKey.set(slot, {
      key: slot,
      group,
      kind: 'image',
      files: { [role]: file },
    });
  });
  return [...byKey.values()].map((slot) => ({
    ...slot,
    kind: resolveSlotKind(
      new Set(Object.keys(slot.files) as ControlCenterFileRole[]),
    ),
  }));
};

/** 73 个素材合并成 44 个槽位，顺序跟随 CONTROL_CENTER_FILES */
export const CONTROL_CENTER_SLOTS: readonly ControlCenterSlot[] = buildSlots();

const SLOT_BY_KEY = new Map(
  CONTROL_CENTER_SLOTS.map((slot) => [slot.key, slot]),
);

export const getControlCenterSlot = (
  key: string,
): ControlCenterSlot | undefined => SLOT_BY_KEY.get(key);

export const listControlCenterSlotsByGroup = (
  group: ControlCenterGroup,
): ControlCenterSlot[] =>
  CONTROL_CENTER_SLOTS.filter((slot) => slot.group === group);

/** 画布上从左到右的分组顺序：整包封面打头，其余按界面层级 */
export const CONTROL_CENTER_GROUP_ORDER: readonly ControlCenterGroup[] = [
  'root',
  'home',
  'control',
  'light',
  'music',
];

export const CONTROL_CENTER_GROUP_LABELS: Record<ControlCenterGroup, string> = {
  root: '整包封面',
  home: '主页',
  control: '控制中心',
  light: '亮度',
  music: '音乐',
};

// ---------------------------------------------------------------------------
// 下拉选项
// ---------------------------------------------------------------------------

/**
 * 下拉里用的分类，比 ControlCenterGroup 细一级。
 * home 一组占了 36 个文件，平铺出来翻不动，按效果图上的区域再拆成 4 块；
 * 其余三个界面本来就只有 9~14 个，不用拆。拆完最大的一组是 16 个。
 */
export type ControlCenterSection =
  | 'cover'
  | 'home_bg'
  | 'home_second'
  | 'home_bottom'
  | 'home_slider'
  | 'control'
  | 'light'
  | 'music';

/** 下拉里的分组顺序，按用户在手机上从上往下看到的顺序排 */
export const CONTROL_CENTER_SECTION_ORDER: readonly ControlCenterSection[] = [
  'cover',
  'home_bg',
  'home_second',
  'home_bottom',
  'home_slider',
  'control',
  'light',
  'music',
];

export const CONTROL_CENTER_SECTION_LABELS: Record<
  ControlCenterSection,
  string
> = {
  cover: '整包封面',
  home_bg: '主面板 · 背景与入口卡片',
  home_second: '主面板 · 快捷开关',
  home_bottom: '主面板 · 底部按钮',
  home_slider: '主面板 · 音量条与图标',
  control: '控制开关面板',
  light: '亮度面板',
  music: '音乐面板',
};

export const resolveControlCenterSection = (
  fileName: string,
): ControlCenterSection | null => {
  const group = resolveControlCenterGroup(fileName);
  if (!group) return null;
  if (group === 'root') return 'cover';
  if (group !== 'home') return group;
  if (fileName.startsWith('home_bottom_')) return 'home_bottom';
  if (fileName.startsWith('home_second_')) return 'home_second';
  // 音量条挂在 home 组但控制中心也在用，亮度入口图标同样摆在主面板上，归一处
  if (
    fileName.startsWith('common_home_sound') ||
    fileName === 'home_light_icon.png'
  ) {
    return 'home_slider';
  }
  return 'home_bg';
};

/**
 * 槽位的中文名，下拉 label 用。44 个槽位一一对应。
 *
 * 名字按效果图上肉眼认得出的功能写，不是文件名直译：
 * ic_recording 画的是录音机不是录屏第三态，ic_locking 是屏幕旋转锁定不是锁屏，
 * ic_focus 是勿扰模式。这是全文件唯一需要手工维护的映射，加素材记得补一条，
 * 漏了会退回槽位 key 显示，不会崩但很难认。
 */
export const CONTROL_CENTER_SLOT_LABELS: Record<string, string> = {
  preview: '整包封面',

  home_bg: '主面板背景',
  home_control_bg: '控制入口卡片底',
  home_music_bg: '音乐入口卡片底',

  home_second_ic_locking: '屏幕旋转锁定',
  home_second_ic_ring: '响铃静音',
  home_second_ic_focus: '勿扰模式',

  home_bottom_ic_flashlight: '手电筒',
  home_bottom_ic_record: '录屏',
  home_bottom_ic_recording: '录音机',
  home_bottom_ic_screenshot: '截屏',
  home_bottom_ic_battery: '电池',
  home_bottom_ic_calculator: '计算器',
  home_bottom_ic_camera: '相机',
  home_bottom_ic_setup: '设置',
  home_bottom_ic_timing: '秒表',
  home_bottom_diy_bg: '自定义按钮底',

  common_home_sound: '音量条',
  common_home_sound_big: '音量图标',
  common_home_sound_mute: '静音图标',
  home_light_icon: '亮度入口图标',

  control_bg: '控制面板底',
  common_control_wifi: 'WLAN',
  common_control_ic_bluetooth: '蓝牙',
  common_control_ic_data: '移动数据',
  common_control_ic_airplane: '飞行模式',
  control_ic_hotspot: '个人热点',
  control_ic_sync: '同步',
  control_preview: '效果图 · 控制面板',

  common_light: '亮度条',
  light_ic_light: '亮度图标',
  light_ic_auto_bright: '自动亮度',
  light_ic_night_shift: '护眼模式',
  light_empty_preview: '效果图 · 亮度最低',
  light_full_preview: '效果图 · 亮度最高',

  music_bg: '音乐面板底',
  music_im_default: '默认专辑封面',
  common_music_ic_play: '播放',
  common_music_ic_pause: '暂停',
  common_music_ic_previous: '上一首',
  common_music_ic_next: '下一首',
  music_music_progress: '播放进度条',
  music_sound_progress: '音量进度条',
  music_preview: '效果图 · 音乐面板',
};

const ROLE_SUFFIX: Record<ControlCenterFileRole, string> = {
  base: '',
  select: ' · 开启态',
  open: ' · 开启动画',
  close: ' · 关闭动画',
  track: ' · 底图',
  fill: ' · 填充',
  thumb: ' · 圆点',
  preview: '',
};

/**
 * 单图槽位的 base 不加后缀；双态槽位的 base 是关闭态，
 * 不写出来的话跟 select 摆在一起分不清哪个是哪个。
 */
const resolveRoleSuffix = (
  kind: ControlCenterSlotKind,
  role: ControlCenterFileRole,
): string => {
  if (role === 'base') {
    return kind === 'toggle' || kind === 'animated_toggle' ? ' · 关闭态' : '';
  }
  return ROLE_SUFFIX[role];
};

export type ControlCenterFileOption = {
  /** 包内真实文件名，写进表单的就是它，label 只是给人看的 */
  value: string;
  /** 中文名 + 状态后缀 */
  label: string;
  /** 所属分组的中文名，按尺寸重排后选项会离开原分组，靠它标出出处 */
  section: string;
  /** 期望尺寸，形如 195x195；pag 没有尺寸要求 */
  dimension?: string;
  /** 搜索用，中英文都能命中，已转小写 */
  keywords: string;
};

export type ControlCenterFileOptionGroup = {
  label: string;
  options: ControlCenterFileOption[];
};

const buildFileOption = (
  file: ControlCenterFileRule,
  section: string,
): ControlCenterFileOption => {
  const { slot, role } = resolveControlCenterSlot(file.name);
  const kind = getControlCenterSlot(slot)?.kind ?? 'image';
  const label = `${CONTROL_CENTER_SLOT_LABELS[slot] ?? slot}${resolveRoleSuffix(kind, role)}`;
  return {
    value: file.name,
    label,
    section,
    dimension:
      file.expectedWidth && file.expectedHeight
        ? `${file.expectedWidth}x${file.expectedHeight}`
        : undefined,
    keywords: `${label} ${file.name}`.toLowerCase(),
  };
};

/** antd Select 的分组选项，组内顺序跟随 CONTROL_CENTER_FILES */
export const CONTROL_CENTER_FILE_OPTIONS: readonly ControlCenterFileOptionGroup[] =
  CONTROL_CENTER_SECTION_ORDER.map((section) => {
    const label = CONTROL_CENTER_SECTION_LABELS[section];
    return {
      label,
      options: CONTROL_CENTER_FILES.filter(
        (file) => resolveControlCenterSection(file.name) === section,
      ).map((file) => buildFileOption(file, label)),
    };
  }).filter((group) => group.options.length > 0);

// ---------------------------------------------------------------------------
// 文件校验
// ---------------------------------------------------------------------------

export type ControlCenterFileIssue = {
  name: string;
  reason: 'unknown' | 'format' | 'size';
  expected?: string;
  actual?: string;
};

/**
 * 校验单个文件是否符合 yaml 的 file_rules。
 * pag 没有尺寸要求，传了宽高也不比对。合规返回 null。
 */
export const validateControlCenterFile = (
  name: string,
  meta: { width?: number; height?: number; format?: string },
): ControlCenterFileIssue | null => {
  const rule = getControlCenterFileRule(name);
  if (!rule) return { name, reason: 'unknown' };

  if (meta.format && meta.format.toLowerCase() !== rule.format) {
    return {
      name,
      reason: 'format',
      expected: rule.format,
      actual: meta.format.toLowerCase(),
    };
  }

  if (rule.expectedWidth === undefined || rule.expectedHeight === undefined) {
    return null;
  }
  if (meta.width === undefined || meta.height === undefined) return null;
  if (
    meta.width === rule.expectedWidth &&
    meta.height === rule.expectedHeight
  ) {
    return null;
  }
  return {
    name,
    reason: 'size',
    expected: `${rule.expectedWidth}x${rule.expectedHeight}`,
    actual: `${meta.width}x${meta.height}`,
  };
};

/** 对照 required_files 找出还缺哪些，顺序与 yaml 一致 */
export const listMissingControlCenterFiles = (
  presentNames: Iterable<string>,
): string[] => {
  const present = new Set(presentNames);
  return CONTROL_CENTER_REQUIRED_FILES.filter((name) => !present.has(name));
};
