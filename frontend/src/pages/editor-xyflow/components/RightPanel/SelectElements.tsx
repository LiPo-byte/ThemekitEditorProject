import { Col, Divider, Row, Space, Typography } from 'antd';
import { createStyles } from 'antd-style';
import React, { useMemo } from 'react';
import { useEditorGetElementsConfigMap } from '../../context';
import { CONFIG_SIZE_MAP, TYPE_WIDGET_MAP, TYPE_WIDGET_NAME_MAP } from '../../widget/base-config';
import AppIcon from '../../icon';
import { xyFlowTypeNodeType } from '@/pages/editor-xyflow/xyFlowTypeNodeType';
const useStyles = createStyles(({ css }) => ({
  section: css`
    width: 100%;
  `,
  empty: css`
    color: #8c8c8c;
    font-size: 12px;
  `,
  cell: css`
    width: 100%;
    height: 100%;
    aspect-ratio: 1;
    border-radius: 8px;
    background: #f3f3f3;
    border: 2px solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-sizing: border-box;
    user-select: none;
  `,
  cellImg: css`
    width: 100%;
    height: 100%;
    object-fit: cover;
  `,
  widgetCell: css`
    width: 100%;
    min-height: 48px;
    border-radius: 8px;
    background: #f3f3f3;
    border: 1px solid #e8e8e8;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 4px;
    box-sizing: border-box;
  `,
  widgetImg: css`
    max-width: 100%;
    max-height: 64px;
    object-fit: contain;
  `,
  meta: css`
    font-size: 7px;
    color: #8c8c8c;
    margin-top: 2px;
    white-space: nowrap;
  `,
}));

const MIXED_VALUE = '__MIXED__';

const asArray = <T,>(value: unknown): T[] =>
  (Array.isArray(value) ? value : []) as T[];

const isMixedValue = (value: unknown) => value === MIXED_VALUE;

/** showElements 仅在为数组时可用；MIXED / 空 / 非法一律当 [] */
const normalizeShowElements = (value: unknown): any[] =>
  isMixedValue(value) ? [] : asArray<any>(value);

const normalizeSelectElements = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || isMixedValue(value)) {
    return { apps: [] as any[], widgets: [] as any[], wallpaper: [] as any[] };
  }
  const source = value as Record<string, any>;
  return {
    apps: asArray<any>(source.apps),
    widgets: asArray<any>(source.widgets),
    wallpaper: asArray<any>(source.wallpaper),
  };
};

const normalizeApps = (apps: any): Array<Record<string, any>> => {
  if (Array.isArray(apps)) {
    return apps.map((app, index) => ({
      key: String(app?.key ?? app?.name ?? index),
      name: String(app?.name ?? app?.key ?? index),
      source: String(app?.source ?? app?.previewsource ?? ''),
      ...app,
    }));
  }
  return Object.entries(apps || {}).map(([key, value]) => {
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

const AppCells: React.FC<{
  apps: any;
  elementKey: any;
  showElements: any;
  onChange: any;
}> = ({ apps, showElements, elementKey, onChange }) => {
  const { styles } = useStyles();
  const appList = asArray<Record<string, any>>(apps);
  const showList = normalizeShowElements(showElements);
  if (!appList.length) {
    return <div className={styles.empty}>暂无 apps</div>;
  }
  return (
    <Row gutter={[8, 8]}>
      {appList.map((app: any) => {
        const label = String(app.name ?? app.key);
        const currenrtkey = elementKey + '_' + label
        const index = showList.findIndex((i: any) => i.key === currenrtkey);
        const selected = index >= 0;

        const onClick = () => {
          if (isMixedValue(showElements) || !onChange) return;
          const temp = [...showList];
          if (selected) {
            temp.splice(index, 1);
          } else {
            temp.push({
              key: currenrtkey,
              category: 'iconpack',
              data: {
                ...app,
              }
            })
          }
          onChange('showElements', temp);
        }

        return (
          <Col key={String(app.key ?? label)} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            padding: '5px',
            border: `2px solid ${selected ? '#000000' : 'transparent'}`,
            margin: 10,
            cursor: 'pointer',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
          }} span={6} onClick={onClick}>
            <div style={{
              width: '45px',
              height: '45px',
              transformOrigin: '0 0',
            }}>
              <AppIcon data={app} scale={45/180} />
            </div>
            <div className={styles.meta}>{label}</div>
          </Col>
        );
      })}
    </Row>
  );
};

const WIDGET_PREVIEW_WIDTH = 124;
const WIDGET_BASE_WIDTH = CONFIG_SIZE_MAP[3].width; // 329
const WIDGET_PREVIEW_SCALE = WIDGET_PREVIEW_WIDTH / WIDGET_BASE_WIDTH;

const resolveWidgetXyflowType = (type: number, layoutType?: number) => {
  const wt = TYPE_WIDGET_MAP[type];
  if (!wt) return '';
  return `${wt}_${layoutType || 0}`;
};

const WidgetSizeCells: React.FC<{
  config: any;
  elementKey: any;
  showElements: any;
  onChange: any;
}> = ({
  config,
  elementKey,
  showElements,
  onChange
}) => {
  const { styles } = useStyles();
  const sizeList = asArray<Record<string, any>>(config?.sizes);
  if (!sizeList.length) {
    return <div className={styles.empty}>暂无 widget sizes</div>;
  }

  const orderedSizes = [3, 2, 1]
    .map((size) => sizeList.find((item: any) => Number(item.size) === size))
    .filter(Boolean) as Array<Record<string, any>>;
  const widgetType = Number(config?.type);
  const showList = normalizeShowElements(showElements);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {orderedSizes.map((item) => {
        const sizeConfig = CONFIG_SIZE_MAP[item.size] || CONFIG_SIZE_MAP[1];
        const width = sizeConfig.width * WIDGET_PREVIEW_SCALE;
        const height = sizeConfig.height * WIDGET_PREVIEW_SCALE;
        const label = String(item?.name ?? `size_${item?.size}`);
        const xyflowType = resolveWidgetXyflowType(widgetType, Number(item?.layoutType) || 0);
        const Comp = xyflowType ? xyFlowTypeNodeType[xyflowType] : null;

        const currenrtkey = elementKey + '_size_' + item?.size;
        const index = showList.findIndex((i: any) => i.key === currenrtkey);
        const selected = index >= 0;

        const onClick = () => {
          if (isMixedValue(showElements) || !onChange) return;
          const temp = [...showList];
          if (selected) {
            temp.splice(index, 1);
          } else {
            temp.push({
              key: currenrtkey,
              category: 'widget',
              data: {
                ...config,
                sizes: [{...item}],
              }
            })
          }
          onChange('showElements', temp);
        }
        return (
          <div key={`${xyflowType || 'unknown'}_${item.size}_${label}`} style={{
            cursor: 'pointer',
            padding: 10,
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(1, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
            border: `2px solid ${selected ? '#000000' : 'transparent'}`
          }} onClick={onClick}>
            <div
              style={{
                width,
                height,
                overflow: 'hidden',
              }}
            >
              {Comp ? (
                <Comp
                  data={item}
                  scale={WIDGET_PREVIEW_SCALE}
                  parentData={config}
                />
              ) : (
                <div className={styles.empty}>{xyflowType || label}</div>
              )}
            </div>
            <div className={styles.meta}>{label}</div>
          </div>
        );
      })}
    </div>
  );
};

const WallpaperCells: React.FC<{
  config: any;
  elementKey: any;
  showElements: any;
  onChange: any;
}> = ({
  config,
  elementKey,
  showElements,
  onChange
}) => {
  const { styles } = useStyles();
  const wallpaper = config?.wallpaper;
  const wallpaper_ipad = config?.wallpaper_ipad;
  const showList = normalizeShowElements(showElements);
  if (!wallpaper && !wallpaper_ipad) {
    return <div className={styles.empty}>暂无组件</div>;
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {[wallpaper, wallpaper_ipad].map((item, i: number) => {
        const label = String(item?.name);
        if (!item) return null;
        const currenrtkey = elementKey + '_' + label;
        const index = showList.findIndex((entry: any) => entry.key === currenrtkey);
        const selected = index >= 0;

        const onClick = () => {
          if (isMixedValue(showElements) || !onChange) return;
          const temp = [...showList];
          if (selected) {
            temp.splice(index, 1);
          } else {
            temp.push({
              key: currenrtkey,
              category: 'wallpaper',
              data: {
                ...item,
              }
            })
          }
          onChange('showElements', temp);
        }
        return (
          <div key={i} style={{
            cursor: 'pointer',
            padding: 10,
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(1, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
            border: `2px solid ${selected ? '#000000' : 'transparent'}`
          }} onClick={onClick}>
            <div
              style={{
                height: 100,
                overflow: 'hidden',
                objectFit: 'cover'
              }}
            >
              <img style={{ height: '100%' }} src={item.source} alt="" />
            </div>
            <div className={styles.meta}>{label}</div>
          </div>
        );
      })}
    </div>
  );
};

const ElementConfigViewApps: React.FC<{
  elementKey: string;
  config: Record<string, any> | null;
  onChange: any;
  showElements: any;
}> = ({ elementKey, config, showElements , onChange }) => {
  const { styles } = useStyles();
  const apps = useMemo(() => normalizeApps(config?.apps), [config?.apps]);
  const hasApps = Boolean(config?.apps);
  return (
    <div className={styles.section}>
      {!config && <div className={styles.empty}>未找到对应 组件</div>}
      {hasApps && (
        <Space orientation="vertical" size={4} style={{ display: 'flex', marginTop: 8 }}>
          <Typography.Text strong style={{ fontSize: 12 }}>
            Apps Icon
          </Typography.Text>
          {isMixedValue(showElements) ? (
            <div className={styles.empty}>Multiple Values</div>
          ) : (
            <AppCells elementKey={elementKey} apps={apps} showElements={showElements} onChange={onChange} />
          )}
        </Space>
      )}
    </div>
  );
};
const ElementConfigViewWidgets: React.FC<{
  elementKey: string;
  config: Record<string, any> | null;
  onChange: any;
  showElements: any;
  system?: any;
}> = ({ elementKey, config, showElements, onChange, system }) => {
  const { styles } = useStyles();
  let sys = system || 'common';
  return (
    <div className={styles.section}>
      {!config && <div className={styles.empty}>未找到对应 组件</div>}
      {config && config[sys] && (
        <Space orientation="vertical" size={4} style={{ display: 'flex', marginTop: 12 }}>
          <Typography.Text strong style={{ fontSize: 12 }}>
            {TYPE_WIDGET_NAME_MAP[config[sys].type]}
          </Typography.Text>
          {isMixedValue(showElements) ? (
            <div className={styles.empty}>Multiple Values</div>
          ) : (
            <WidgetSizeCells config={config[sys]} elementKey={elementKey} showElements={showElements} onChange={onChange} />
          )}
        </Space>
      )}
    </div>
  );
};
const ElementConfigViewWallpaper: React.FC<{
  elementKey: string;
  config: any;
  onChange: any;
  showElements: any;
  system?: any;
}> = ({ elementKey, config, showElements, onChange }) => {
  const { styles } = useStyles();
  return (
    <div className={styles.section}>
      {!config && <div className={styles.empty}>未找到对应 组件</div>}
      {config && (
        <Space orientation="vertical" size={4} style={{ display: 'flex', marginTop: 12 }}>
          <Typography.Text strong style={{ fontSize: 12 }}>
            Wallpaper
          </Typography.Text>
          {isMixedValue(showElements) ? (
            <div className={styles.empty}>Multiple Values</div>
          ) : (
            <WallpaperCells config={config} elementKey={elementKey} showElements={showElements} onChange={onChange} />
          )}
        </Space>
      )}
    </div>
  );
};

export const SelectElements: React.FC<{
  selectElements?: any;
  showElements?: any;
  onChange?: any;
}> = ({ selectElements, showElements, onChange }) => {
  const { styles } = useStyles();
  const getElementsConfigMap = useEditorGetElementsConfigMap();
  const configMap = getElementsConfigMap();

  if (isMixedValue(selectElements)) {
    return <div className={styles.empty}>Multiple Values</div>;
  }

  const { apps, widgets, wallpaper } = normalizeSelectElements(selectElements);
  const hasCandidates = apps.length > 0 || widgets.length > 0 || wallpaper.length > 0;

  return (
    <>
      <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Select Preview
        </Typography.Title>
        {!hasCandidates && (
          <div className={styles.empty}>暂无 selectElements</div>
        )}
        {apps.map((appkey: any) => {
          return (
            <ElementConfigViewApps
              key={String(appkey)}
              elementKey={String(appkey)}
              showElements={showElements}
              onChange={onChange}
              config={(configMap?.[appkey] as Record<string, any> | undefined) ?? null}
            />
          )
        })}
        {widgets.map((elementKey: any) => {
          const [key, system] = String(elementKey).split(',');
          return (
            <ElementConfigViewWidgets
              key={String(elementKey)}
              elementKey={String(elementKey)}
              showElements={showElements}
              onChange={onChange}
              system={system}
              config={(configMap?.[key] as Record<string, any> | undefined) ?? null}
            />
          )
        })}
        {wallpaper.map((elementKey: any) => {
          return (
            <ElementConfigViewWallpaper
              key={String(elementKey)}
              elementKey={String(elementKey)}
              showElements={showElements}
              onChange={onChange}
              config={(configMap?.[elementKey] as Record<string, any> | undefined) ?? null}
            />
          )
        })}
      </Space>
    </>
  );
};

export default SelectElements;
