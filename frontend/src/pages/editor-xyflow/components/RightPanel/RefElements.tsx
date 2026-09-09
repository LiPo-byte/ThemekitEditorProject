import { Col, Row, Space, Typography } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useEditorGetElementsConfigMap } from '../../context';
import AppIcon from '../../icon';
import {
  LOCK_CONFIG_SIZE_MAP,
  LOCK_TYPE_WIDGET_NAME_MAP,
} from '../../lockwidget/base-config';
import { getLockWidgetType } from '../../lockwidget/util';
import {
  CONFIG_SIZE_MAP,
  TYPE_WIDGET_MAP,
  TYPE_WIDGET_NAME_MAP,
} from '../../widget/base-config';
import { xyFlowTypeNodeType } from '../../xyFlowTypeNodeType';

/** 面板可用宽度，超出的预览按比例缩小（inline 形状原宽 244） */
const PREVIEW_MAX_WIDTH = 220;
const WALLPAPER_PREVIEW_HEIGHT = 100;
/** AppIcon 的画布原始尺寸，缩到 32 塞进图标网格 */
const APP_ICON_BASE_SIZE = 180;
const APP_ICON_SIZE = 32;

/** 多选到不同值时 PropForm 传下来的哨兵值 */
const MIXED_VALUE = '__MIXED__';

const useStyles = createStyles(({ token, css }) => ({
  empty: css`
    color: ${token.colorTextTertiary};
    font-size: 12px;
  `,
  cell: css`
    padding: 8px;
    border-radius: 8px;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorFillQuaternary};
    overflow: hidden;
  `,
  meta: css`
    font-size: 11px;
    color: ${token.colorTextTertiary};
    margin-top: 4px;
    white-space: nowrap;
  `,
}));

const asArray = <T,>(value: unknown): T[] =>
  (Array.isArray(value) ? value : []) as T[];

const LockWidgetCell: React.FC<{ elementKey: string; config: any }> = ({
  elementKey,
  config,
}) => {
  const { styles } = useStyles();
  const type = Number(config?.type);
  const label = LOCK_TYPE_WIDGET_NAME_MAP[type] || 'Lock Widget';
  const sizes = asArray<Record<string, any>>(config?.sizes);
  const sizeItem = sizes[0];

  if (!sizeItem) {
    return (
      <div className={styles.cell}>
        <div className={styles.empty}>组件已删除：{elementKey}</div>
      </div>
    );
  }

  const sizeConfig =
    LOCK_CONFIG_SIZE_MAP[sizeItem.size] || LOCK_CONFIG_SIZE_MAP[1002];
  const scale = Math.min(1, PREVIEW_MAX_WIDTH / sizeConfig.width);
  const nodeType = getLockWidgetType(type, sizeItem);
  const Comp = nodeType ? xyFlowTypeNodeType[nodeType] : null;

  return (
    <div className={styles.cell}>
      <div
        style={{
          width: sizeConfig.width * scale,
          height: sizeConfig.height * scale,
          overflow: 'hidden',
        }}
      >
        {Comp ? (
          <Comp data={sizeItem} scale={scale} />
        ) : (
          <div className={styles.empty}>暂无预览</div>
        )}
      </div>
      <div className={styles.meta}>
        {label}
        {sizes.length > 1 ? ` · ${sizes.length} sizes` : ''}
      </div>
    </div>
  );
};

/**
 * theme 的 widgets 存的是 `节点id,平台`，配置按平台分支，
 * 一套里可能同时有 small / medium / large，面板上只挑一个尺寸做缩略图。
 */
const WidgetCell: React.FC<{ elementKey: string; configMap: any }> = ({
  elementKey,
  configMap,
}) => {
  const { styles } = useStyles();
  const [nodeId, system = 'common'] = String(elementKey).split(',');
  const config = configMap?.[nodeId]?.[system];
  const sizes = asArray<Record<string, any>>(config?.sizes);
  // 小尺寸最省面板高度，没有 small 的组件退回第一个
  const sizeItem = sizes.find((item) => Number(item?.size) === 1) ?? sizes[0];

  if (!sizeItem) {
    return (
      <div className={styles.cell}>
        <div className={styles.empty}>组件已删除：{elementKey}</div>
      </div>
    );
  }

  const type = Number(config?.type);
  const label = TYPE_WIDGET_NAME_MAP[type] || 'Widget';
  const sizeConfig = CONFIG_SIZE_MAP[sizeItem.size] || CONFIG_SIZE_MAP[1];
  const scale = Math.min(1, PREVIEW_MAX_WIDTH / sizeConfig.width);
  const widgetType = TYPE_WIDGET_MAP[type];
  const nodeType = widgetType
    ? `${widgetType}_${Number(sizeItem?.layoutType) || 0}`
    : '';
  const Comp = nodeType ? xyFlowTypeNodeType[nodeType] : null;

  return (
    <div className={styles.cell}>
      <div
        style={{
          width: sizeConfig.width * scale,
          height: sizeConfig.height * scale,
          overflow: 'hidden',
        }}
      >
        {Comp ? (
          <Comp data={sizeItem} scale={scale} parentData={config} />
        ) : (
          <div className={styles.empty}>暂无预览</div>
        )}
      </div>
      <div className={styles.meta}>
        {label} · {system}
        {sizes.length > 1 ? ` · ${sizes.length} sizes` : ''}
      </div>
    </div>
  );
};

/** iconpack 一套三十来个图标，这里铺成小图网格，只为确认是哪一套 */
const IconPackCell: React.FC<{ elementKey: string; config: any }> = ({
  elementKey,
  config,
}) => {
  const { styles } = useStyles();
  const apps = config?.apps;
  const appList = Array.isArray(apps)
    ? apps
    : Object.entries(apps || {}).map(([key, value]) =>
        value && typeof value === 'object'
          ? { key, name: key, ...(value as Record<string, any>) }
          : { key, name: key, source: String(value ?? '') },
      );

  if (!appList.length) {
    return (
      <div className={styles.cell}>
        <div className={styles.empty}>图标包已删除：{elementKey}</div>
      </div>
    );
  }

  return (
    <div className={styles.cell}>
      <Row gutter={[4, 4]}>
        {appList.map((app: any, index: number) => (
          <Col key={String(app?.key ?? app?.name ?? index)}>
            <div style={{ width: APP_ICON_SIZE, height: APP_ICON_SIZE }}>
              <AppIcon
                data={app}
                scale={APP_ICON_SIZE / APP_ICON_BASE_SIZE}
                showName={false}
              />
            </div>
          </Col>
        ))}
      </Row>
      <div className={styles.meta}>IconPack · {appList.length} apps</div>
    </div>
  );
};

const WallpaperCell: React.FC<{ elementKey: string; config: any }> = ({
  elementKey,
  config,
}) => {
  const { styles } = useStyles();
  const wallpaper = config?.wallpaper;

  if (!wallpaper?.source) {
    return (
      <div className={styles.cell}>
        <div className={styles.empty}>壁纸已删除：{elementKey}</div>
      </div>
    );
  }

  return (
    <div className={styles.cell}>
      <img
        src={wallpaper.source}
        alt=""
        style={{
          height: WALLPAPER_PREVIEW_HEIGHT,
          objectFit: 'cover',
          display: 'block',
        }}
      />
      <div className={styles.meta}>{String(wallpaper.name || 'Wallpaper')}</div>
    </div>
  );
};

const Section: React.FC<{
  title: string;
  emptyText: string;
  keys: string[];
  renderCell: (elementKey: string) => React.ReactNode;
}> = ({ title, emptyText, keys, renderCell }) => {
  const { styles } = useStyles();
  return (
    <Space orientation="vertical" size={8} style={{ display: 'flex' }}>
      <Typography.Text strong style={{ fontSize: 12 }}>
        {title}（{keys.length}）
      </Typography.Text>
      {keys.length === 0 ? (
        <div className={styles.empty}>{emptyText}</div>
      ) : (
        keys.map((elementKey) => renderCell(elementKey))
      )}
    </Space>
  );
};

/**
 * 引用清单（只读）：把 selectElements 里引用的元素列出来，
 * 让人不用点开画布就知道这个包里装了什么。
 *
 * theme 和 lockpack 共用：按 selectElements 里出现了哪些字段决定渲染哪些分区
 * （theme 是 apps / widgets / wallpaper，lockpack 是 lockwidgets / wallpaper）。
 * 要改引用请回对应的 Add 面板重建。
 */
export const RefElements: React.FC<{
  selectElements?: any;
  title?: string;
}> = ({ selectElements, title = 'Elements' }) => {
  const { styles } = useStyles();
  const getElementsConfigMap = useEditorGetElementsConfigMap();
  const configMap = getElementsConfigMap();

  if (
    selectElements === MIXED_VALUE ||
    !selectElements ||
    typeof selectElements !== 'object' ||
    Array.isArray(selectElements)
  ) {
    return <div className={styles.empty}>Multiple Values</div>;
  }

  const apps = asArray<string>(selectElements.apps);
  const widgets = asArray<string>(selectElements.widgets);
  const lockwidgets = asArray<string>(selectElements.lockwidgets);
  const wallpaper = asArray<string>(selectElements.wallpaper);

  return (
    <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
      <Typography.Title level={5} style={{ margin: 0 }}>
        {title}
      </Typography.Title>

      {Array.isArray(selectElements.apps) && (
        <Section
          title="IconPack"
          emptyText="暂无图标包"
          keys={apps}
          renderCell={(elementKey) => (
            <IconPackCell
              key={elementKey}
              elementKey={elementKey}
              config={configMap?.[elementKey] ?? null}
            />
          )}
        />
      )}

      {Array.isArray(selectElements.widgets) && (
        <Section
          title="Widgets"
          emptyText="暂无组件"
          keys={widgets}
          renderCell={(elementKey) => (
            <WidgetCell
              key={elementKey}
              elementKey={elementKey}
              configMap={configMap}
            />
          )}
        />
      )}

      {Array.isArray(selectElements.lockwidgets) && (
        <Section
          title="Lock Widgets"
          emptyText="暂无锁屏组件"
          keys={lockwidgets}
          renderCell={(elementKey) => (
            <LockWidgetCell
              key={elementKey}
              elementKey={elementKey}
              config={configMap?.[elementKey] ?? null}
            />
          )}
        />
      )}

      {Array.isArray(selectElements.wallpaper) && (
        <Section
          title="Wallpaper"
          emptyText="暂无壁纸"
          keys={wallpaper}
          renderCell={(elementKey) => (
            <WallpaperCell
              key={elementKey}
              elementKey={elementKey}
              config={configMap?.[elementKey] ?? null}
            />
          )}
        />
      )}
    </Space>
  );
};

export default RefElements;
