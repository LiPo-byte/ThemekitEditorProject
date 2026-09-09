/**
 * 画布上「外层 group」与「内层 platform_group」的容器样式，按元素分类区分色相。
 *
 * 两层的明暗关系是刻意的：外层填充比内层更浅、彩度更低，但边框比内层更深、更饱和，
 * 这样才读得出「外框套内卡」的嵌套层次。五个分类只换色相，亮度和彩度四组共用：
 *   外层  背景 L .977 C .011   边框 L .821 C .090
 *   内层  背景 L .960 C .021   边框 L .899 C .050
 *
 * 要调色请按上面的坐标在 OKLCH 里重算，不要只手改某一组 hex。用 HSL 或者肉眼配的话，
 * 同一个亮度下暖色（橙、黄）会比冷色（蓝、紫）明显显亮一截，五个分类摆在一起就花了。
 */

export type GroupNodeCategory =
  | 'iconpack'
  | 'widget'
  | 'lockwidget'
  | 'theme'
  | 'wallpaper'
  | 'lockpack';

type GroupNodeStyle = {
  background: string;
  border: string;
  borderRadius: number;
  boxShadow?: string;
};

export const ROOT_GROUP_STYLE: Record<GroupNodeCategory, GroupNodeStyle> = {
  iconpack: {
    background: '#fdf6f0',
    border: '1px solid #edb986',
    borderRadius: 16,
  },
  widget: {
    background: '#f3f8ff',
    border: '1px solid #a0c7ff',
    borderRadius: 16,
  },
  lockwidget: {
    background: '#faf5fd',
    border: '1px solid #dbb3ed',
    borderRadius: 16,
  },
  theme: {
    background: '#f2faf4',
    border: '1px solid #95d6ab',
    borderRadius: 16,
  },
  wallpaper: {
    background: '#fff5f5',
    border: '1px solid #f9adb2',
    borderRadius: 16,
  },
  /** 色相 210，落在绿（155）与蓝（257）中间的空档 */
  lockpack: {
    background: '#f0fafc',
    border: '1px solid #79d5e5',
    borderRadius: 16,
  },
};

export const PLATFORM_GROUP_STYLE: Record<GroupNodeCategory, GroupNodeStyle> = {
  iconpack: {
    background: '#ffefde',
    border: '1px solid #f8d7b9',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(174, 87, 0, 0.06)',
  },
  /** 蓝色沿用改动前的色系，桌面组件数量最多，保持眼熟 */
  widget: {
    background: '#e6f4ff',
    border: '1px solid #c8e0ff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(45, 111, 205, 0.06)',
  },
  lockwidget: {
    background: '#faedff',
    border: '1px solid #ecd4f8',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(148, 79, 176, 0.06)',
  },
  theme: {
    background: '#e4f9ea',
    border: '1px solid #c2e9ce',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0, 139, 69, 0.06)',
  },
  wallpaper: {
    background: '#ffebec',
    border: '1px solid #ffd0d2',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(188, 63, 83, 0.06)',
  },
  lockpack: {
    background: '#e3f6fa',
    border: '1px solid #b8e7f0',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0, 130, 149, 0.06)',
  },
};
