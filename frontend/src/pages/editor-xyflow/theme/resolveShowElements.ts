/** 将 showElements 按 key 回源组件 config，拿到最新 data */

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const normalizeApps = (apps: unknown): Array<Record<string, any>> => {
  if (Array.isArray(apps)) {
    return apps.map((app, index) => {
      const item = (app ?? {}) as Record<string, any>;
      return {
        key: String(item?.key ?? item?.name ?? index),
        name: String(item?.name ?? item?.key ?? index),
        source: String(item?.source ?? item?.previewsource ?? ''),
        ...item,
      };
    });
  }
  return Object.entries((apps as Record<string, any>) || {}).map(([key, value]) => {
    if (value && typeof value === 'object') {
      const app = value as Record<string, any>;
      return {
        key,
        name: String(app.name ?? key),
        source: String(app.source ?? app.previewsource ?? ''),
        ...app,
      };
    }
    return {
      key,
      name: key,
      source: String(value ?? ''),
    };
  });
};

const resolveIconpackData = (
  itemKey: string,
  configMap: Record<string, any>,
): Record<string, any> | null => {
  let best: Record<string, any> | null = null;
  let bestKeyLen = -1;

  Object.entries(configMap || {}).forEach(([elementKey, config]) => {
    if (!config?.apps) return;
    const prefix = `${elementKey}_`;
    if (!itemKey.startsWith(prefix)) return;
    const label = itemKey.slice(prefix.length);
    if (!label) return;
    const app = normalizeApps(config.apps).find(
      (entry) => String(entry.name) === label || String(entry.key) === label,
    );
    if (app && elementKey.length > bestKeyLen) {
      best = { ...app };
      bestKeyLen = elementKey.length;
    }
  });

  return best;
};

const resolveWidgetData = (
  itemKey: string,
  configMap: Record<string, any>,
): Record<string, any> | null => {
  const matched = itemKey.match(/^(.*)_size_(\d+)$/);
  if (!matched) return null;
  const selectionKey = matched[1];
  const size = Number(matched[2]);
  if (!selectionKey || !Number.isFinite(size)) return null;

  const [elementKeyRaw, systemRaw] = selectionKey.split(',');
  const elementKey = String(elementKeyRaw || '').trim();
  const system = String(systemRaw || 'common').trim() || 'common';
  if (!elementKey) return null;

  const platformConfig = configMap?.[elementKey]?.[system];
  if (!platformConfig || typeof platformConfig !== 'object') return null;

  const sizeItem = asArray<Record<string, any>>(platformConfig.sizes).find(
    (entry) => Number(entry?.size) === size,
  );
  if (!sizeItem) return null;

  return {
    ...platformConfig,
    sizes: [{ ...sizeItem }],
  };
};

const resolveWallpaperData = (
  itemKey: string,
  configMap: Record<string, any>,
): Record<string, any> | null => {
  // AddThemeModal / ImportModal: `${wallpaperRootId}_wallpaper`
  if (itemKey.endsWith('_wallpaper')) {
    const elementKey = itemKey.slice(0, -'_wallpaper'.length);
    const wallpaper = configMap?.[elementKey]?.wallpaper;
    if (wallpaper && typeof wallpaper === 'object') {
      return { ...wallpaper };
    }
  }

  // SelectElements: `${wallpaperRootId}_${item.name}`
  let best: Record<string, any> | null = null;
  let bestKeyLen = -1;

  Object.entries(configMap || {}).forEach(([elementKey, config]) => {
    if (!config || typeof config !== 'object') return;
    const prefix = `${elementKey}_`;
    if (!itemKey.startsWith(prefix)) return;
    const label = itemKey.slice(prefix.length);
    if (!label) return;

    for (const field of ['wallpaper', 'wallpaper_ipad'] as const) {
      const item = config[field];
      if (!item || typeof item !== 'object') continue;
      if (String(item.name ?? '') !== label && field !== label) continue;
      if (elementKey.length > bestKeyLen) {
        best = { ...item };
        bestKeyLen = elementKey.length;
      }
    }
  });

  return best;
};

/**
 * 锁屏组件整套回源：LockPack 导出的 widgets_spec.json 是整套（含全部 sizes），
 * 所以 showElements 里也存整套 config，key 形如 `${lockWidgetRootId}_lockwidget`。
 */
const resolveLockWidgetData = (
  itemKey: string,
  configMap: Record<string, any>,
): Record<string, any> | null => {
  const suffix = '_lockwidget';
  if (!itemKey.endsWith(suffix)) return null;
  const elementKey = itemKey.slice(0, -suffix.length);
  if (!elementKey) return null;

  const config = configMap?.[elementKey];
  if (!config || typeof config !== 'object') return null;
  const sizes = asArray<Record<string, any>>(config.sizes);
  if (!sizes.length) return null;

  return {
    ...config,
    sizes: sizes.map((item) => ({ ...item })),
  };
};

/** 单条：解析成功返回最新 data，失败返回 null（调用方回退旧快照） */
export const resolveShowElementData = (
  item: any,
  configMap: Record<string, any> | null | undefined,
): Record<string, any> | null => {
  if (!item || !configMap) return null;
  const key = String(item.key ?? '');
  if (!key) return null;

  const category = String(item.category ?? '');
  if (category === 'iconpack') return resolveIconpackData(key, configMap);
  if (category === 'widget') return resolveWidgetData(key, configMap);
  if (category === 'lockwidget') return resolveLockWidgetData(key, configMap);
  if (category === 'wallpaper') return resolveWallpaperData(key, configMap);
  return null;
};

/** 批量：能 resolve 的覆盖 data，否则保留原项 */
export const resolveShowElements = (
  showElements: any[] | null | undefined,
  configMap: Record<string, any> | null | undefined,
): any[] => {
  const list = Array.isArray(showElements) ? showElements : [];
  if (!configMap) return list;

  return list.map((item) => {
    const nextData = resolveShowElementData(item, configMap);
    if (!nextData) return item;
    return {
      ...item,
      data: nextData,
    };
  });
};
