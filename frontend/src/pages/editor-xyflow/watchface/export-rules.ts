/**
 * 文件名、尺寸、config 字段以资源校验 yaml 为准，改前先看：
 * widget/rule_ymal/resource-validation/watch_face_photo_layout_1_static.yaml
 * widget/rule_ymal/resource-validation/watch_face_photo_layout_1_gif.yaml
 * widget/rule_ymal/resource-validation/watch_face_photo_layout_2.yaml
 * widget/rule_ymal/resource-validation/watch_face_Portraits.yaml
 *
 * 动态表盘画布 type 为 Photos17_dynamic，导出 config.json 的 type 写 Photos17（与 gif yaml 一致）。
 */

export const WATCH_FACE_EXPORT_WIDTH = 396;
export const WATCH_FACE_EXPORT_HEIGHT = 484;

export type WatchFaceExportVariant =
  | 'photo_layout_1_static'
  | 'photo_layout_1_dynamic'
  | 'photo_layout_2'
  | 'portraits';

export const resolveWatchFaceExportVariant = (
  type: string,
): WatchFaceExportVariant | null => {
  if (type === 'Photos17') return 'photo_layout_1_static';
  if (type === 'Photos17_dynamic') return 'photo_layout_1_dynamic';
  if (type === 'Photos18') return 'photo_layout_2';
  if (type === 'Portraits') return 'portraits';
  return null;
};

export const REQUIRED_FILES_BY_VARIANT: Record<
  WatchFaceExportVariant,
  readonly string[]
> = {
  photo_layout_1_static: ['config.json', 'watch.jpg', 'preview.jpg'],
  photo_layout_1_dynamic: ['config.json', 'watch.mov', 'preview.pag'],
  photo_layout_2: ['config.json', 'watch.jpg', 'preview.jpg'],
  portraits: [
    'config.json',
    'background.png',
    'content.png',
    'mask.png',
    'preview.png',
  ],
};

const EDITOR_ONLY_KEYS = new Set([
  'width',
  'height',
  'key',
  'label',
  'source',
  'movsource',
  'pagsource',
  'crop_props',
  'backgroundSource',
  'contentSource',
  'maskSource',
  "radius",
  "name"
]);

/** 导出 zip 内 config.json：不含 CDN 地址与编辑器内部字段 */
export const buildWatchFaceConfigJson = (
  data: Record<string, any>,
): Record<string, any> => {
  const rawType = String(data.type ?? '');
  const variant = resolveWatchFaceExportVariant(rawType);
  const configType =
    rawType === 'Photos17_dynamic' ? 'Photos17' : rawType;

  const pickExtras = (omitKeys: string[]) => {
    const omit = new Set(omitKeys);
    const extras: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (EDITOR_ONLY_KEYS.has(key)) continue;
      if (omit.has(key)) continue;
      if (value === undefined) continue;
      extras[key] = value;
    }
    return extras;
  };

  if (variant === 'photo_layout_1_static' || variant === 'photo_layout_1_dynamic') {
    return {
      type: configType,
      alignment: data.alignment ?? 'top',
      hasDate: Boolean(data.hasDate),
      ...pickExtras(['type', 'alignment', 'hasDate']),
    };
  }

  if (variant === 'photo_layout_2') {
    return {
      type: configType,
      font: String(data.font ?? ''),
      size: String(data.size ?? ''),
      textColor: String(data.textColor ?? ''),
      ...pickExtras(['type', 'font', 'size', 'textColor']),
    };
  }

  if (variant === 'portraits') {
    return {
      type: configType,
      alignment: data.alignment ?? 'top',
      hasDate: Boolean(data.hasDate),
      font: String(data.font ?? ''),
      ...pickExtras(['type', 'alignment', 'hasDate', 'font']),
    };
  }

  return {
    type: configType,
    ...pickExtras(['type']),
  };
};
