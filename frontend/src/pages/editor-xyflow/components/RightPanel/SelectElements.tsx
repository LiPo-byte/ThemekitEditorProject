import { Col, Divider, Row, Space, Typography } from 'antd';
import { createStyles } from 'antd-style';
import React, { useMemo } from 'react';
import { useEditorGetElementsConfigMap } from '../../context';
import { CONFIG_SIZE_MAP } from '../../widget/base-config';
import AppIcon from '../../icon';
import PureImage from '../../widget/pureimage-layout_0';
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
    font-size: 10px;
    color: #8c8c8c;
    margin-top: 2px;
  `,
}));

const asArray = <T,>(value: unknown): T[] =>
  (Array.isArray(value) ? value : []) as T[];

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

const collectWidgetSizes = (config: Record<string, any>) => {
  const platforms = ['ios', 'android', 'common'] as const;
  const sizes: Array<Record<string, any> & { platform: string }> = [];
  platforms.forEach((platform) => {
    const platformConfig = config?.[platform];
    const list = Array.isArray(platformConfig?.sizes) ? platformConfig.sizes : [];
    list.forEach((item: any) => {
      sizes.push({
        platform,
        ...item,
      });
    });
  });
  return sizes;
};

const AppCells: React.FC<{
  apps: any;
  elementKey: any;
  desketopShow: any;
  onChange: any;
}> = ({ apps, desketopShow, elementKey, onChange }) => {
  const { styles } = useStyles();
  const appList = asArray<Record<string, any>>(apps);
  const showList = asArray<Record<string, any>>(desketopShow);
  if (!appList.length) {
    return <div className={styles.empty}>暂无 apps</div>;
  }
  return (
    <Row gutter={[8, 8]}>
      {appList.map((app: any) => {
        const label = String(app.name ?? app.key);
        const fi: number = showList.findIndex((i: any) => {
          if (i.element_key !== elementKey + '_app_' + app.key) {
            return false;
          }
          if (!i.app) return false;
          if (i.app.key === app.key) {
            return true;
          }
          return false;
        });
        const selected: boolean = fi >= 0;
        return (
          <Col key={String(app.key ?? label)} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            border: `2px solid ${selected ? '#000000' : 'transparent'}`,
            margin: 10,
            cursor: 'pointer',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
          }} span={6} onClick={() => {
            const temp = [...showList];
            if (selected) {
              temp.splice(fi, 1);
              onChange?.('desketopShow', temp);
            } else {
              temp.push({
                element_key: elementKey + '_app_' + app.key,
                xyflowType: 'icon',
                app: {
                  key: app.key,
                  ...app,
                }
              })
              onChange?.('desketopShow', temp);
            }
          }} >
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

const PureImageCells: React.FC<{ sizes: any[] }> = ({ sizes }) => {
  const { styles } = useStyles();
  const sizeList = asArray<Record<string, any>>(sizes);
  if (!sizeList.length) {
    return <div className={styles.empty}>暂无 pureImage</div>;
  }
  return (
    <Row gutter={[8, 8]}>
      {sizeList.map((item, index) => {
        const label = String(item?.name ?? `size_${item?.size ?? index}`);
        const imageUrl = String(item?.source ?? '');
        return (
          <Col key={`${label}-${index}`} span={8}>
            <div className={styles.widgetCell}>
              {imageUrl ? (
                <img className={styles.widgetImg} src={imageUrl} alt={label} />
              ) : (
                label
              )}
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

const WidgetSizeCells: React.FC<{
  config: any;
  elementKey: any;
  desketopShow: any;
  onChange: any;
}> = ({
  config,
  elementKey,
  desketopShow,
  onChange
}) => {
  const { styles } = useStyles();
  const sizeList = asArray<Record<string, any>>(config?.sizes);
  const showList = asArray<Record<string, any>>(desketopShow);
  if (!sizeList.length) {
    return <div className={styles.empty}>暂无 widget sizes</div>;
  }

  const orderedSizes = [3, 2, 1]
    .map((size) => sizeList.find((item: any) => Number(item.size) === size))
    .filter(Boolean) as Array<Record<string, any>>;

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
        const fi: number = showList.findIndex(
          (i: any) => i.element_key === elementKey + '_pureimage_0_' + item.size,
        );
        const selected: boolean = fi >= 0;
        return (
          <div key={label} style={{
            cursor: 'pointer',
            padding: 10,
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(1, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
            border: `2px solid ${selected ? '#000000' : 'transparent'}`
          }} onClick={() => {
            const temp = [...showList];
            if (selected) {
              temp.splice(fi, 1);
              onChange?.('desketopShow', temp);
            } else {
              temp.push({
                element_key: elementKey + '_pureimage_0_' + item.size,
                xyflowType: 'pureimage_0',
                config: {
                  ...(config ?? {}),
                  sizes: [{ ...item }],
                }
              })
              onChange?.('desketopShow', temp);
            }
          }}>
            <div
              style={{
                width,
                height,
                overflow: 'hidden',
              }}
            >
              <PureImage data={item} scale={WIDGET_PREVIEW_SCALE} />
            </div>
            <div className={styles.meta}>{label}</div>
          </div>
        );
      })}
    </div>
  );
};

const ElementConfigView: React.FC<{
  elementKey: string;
  config: Record<string, any> | null;
  onChange: any;
  desketopShow: any;
}> = ({ elementKey, config, desketopShow, onChange }) => {
  const { styles } = useStyles();
  const apps = useMemo(() => normalizeApps(config?.apps), [config?.apps]);
  const pureImageSizes = Array.isArray(config?.pureImage?.sizes)
    ? config.pureImage.sizes
    : [];
  const widgetSizes = useMemo(
    () => (config ? collectWidgetSizes(config) : []),
    [config],
  );
  const hasApps = Boolean(config?.apps);
  const hasPureImage = pureImageSizes.length > 0;
  const hasWidgetSizes = !hasApps && !hasPureImage && widgetSizes.length > 0;

  return (
    <div className={styles.section}>
      {!config && <div className={styles.empty}>未找到对应 config</div>}
      {hasApps && (
        <Space orientation="vertical" size={4} style={{ display: 'flex', marginTop: 8 }}>
          <Typography.Text strong style={{ fontSize: 12 }}>
            Apps_{elementKey}
          </Typography.Text>
          <AppCells elementKey={elementKey} apps={apps} desketopShow={desketopShow} onChange={onChange}  />
        </Space>
      )}
      {hasPureImage && (
        <Space orientation="vertical" size={4} style={{ display: 'flex', marginTop: 12 }}>
          <Typography.Text strong style={{ fontSize: 12 }}>
            PureImage
          </Typography.Text>
          <WidgetSizeCells config={config?.pureImage} elementKey={elementKey} desketopShow={desketopShow} onChange={onChange} />
        </Space>
      )}
      {/* {hasWidgetSizes && (
        <Space orientation="vertical" size={4} style={{ display: 'flex', marginTop: 8 }}>
          <Typography.Text strong style={{ fontSize: 12 }}>
            Widget
          </Typography.Text>
          <WidgetSizeCells sizes={widgetSizes} />
        </Space>
      )} */}
      {config && !hasApps && !hasPureImage && !hasWidgetSizes && (
        <pre
          style={{
            marginTop: 8,
            maxHeight: 180,
            overflow: 'auto',
            fontSize: 10,
            background: '#fafafa',
            padding: 8,
            borderRadius: 6,
          }}
        >
          {JSON.stringify(config, null, 2)}
        </pre>
      )}
    </div>
  );
};

export const SelectElements: React.FC<{
  targetElementKeys?: string[];
  desketopShow?: any;
  onChange?: any;
}> = ({ targetElementKeys, desketopShow, onChange }) => {
  const getElementsConfigMap = useEditorGetElementsConfigMap();
  const configMap = getElementsConfigMap();
  const keys = asArray<string>(targetElementKeys);
  const showList = asArray<Record<string, any>>(desketopShow);
  if (!keys.length) {
    return (
      <>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          暂无 TargetElementKeys
        </Typography.Text>
      </>
    );
  }

  return (
    <>
      <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Preview Select
        </Typography.Title>
        {keys.map((elementKey) => (
          <ElementConfigView
            key={String(elementKey)}
            elementKey={String(elementKey)}
            desketopShow={showList}
            onChange={onChange}
            config={(configMap?.[elementKey] as Record<string, any> | undefined) ?? null}
          />
        ))}
      </Space>
    </>
  );
};

export default SelectElements;
