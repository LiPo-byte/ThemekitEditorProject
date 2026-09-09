import { Space, Typography } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useEditorGetElementsConfigMap } from '../../context';
import {
  LOCK_CONFIG_SIZE_MAP,
  LOCK_TYPE_WIDGET_NAME_MAP,
} from '../../lockwidget/base-config';
import { getLockWidgetType } from '../../lockwidget/util';
import { xyFlowTypeNodeType } from '../../xyFlowTypeNodeType';

/** 面板可用宽度，超出的预览按比例缩小（inline 形状原宽 244） */
const PREVIEW_MAX_WIDTH = 220;
const WALLPAPER_PREVIEW_HEIGHT = 100;

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

/**
 * LockPack 引用清单（只读）：把 selectElements 里的锁屏组件和壁纸列出来，
 * 让人不用点开画布就知道这个包里装了什么。要改引用请回 Add Lock Pack 面板重建。
 */
export const LockpackElements: React.FC<{ selectElements?: any }> = ({
  selectElements,
}) => {
  const { styles } = useStyles();
  const getElementsConfigMap = useEditorGetElementsConfigMap();
  const configMap = getElementsConfigMap();

  const lockwidgets = asArray<string>(selectElements?.lockwidgets);
  const wallpaper = asArray<string>(selectElements?.wallpaper);

  return (
    <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
      <Typography.Title level={5} style={{ margin: 0 }}>
        Pack Elements
      </Typography.Title>

      <Space orientation="vertical" size={8} style={{ display: 'flex' }}>
        <Typography.Text strong style={{ fontSize: 12 }}>
          Lock Widgets（{lockwidgets.length}）
        </Typography.Text>
        {lockwidgets.length === 0 ? (
          <div className={styles.empty}>暂无锁屏组件</div>
        ) : (
          lockwidgets.map((elementKey) => (
            <LockWidgetCell
              key={elementKey}
              elementKey={elementKey}
              config={configMap?.[elementKey] ?? null}
            />
          ))
        )}
      </Space>

      <Space orientation="vertical" size={8} style={{ display: 'flex' }}>
        <Typography.Text strong style={{ fontSize: 12 }}>
          Wallpaper
        </Typography.Text>
        {wallpaper.length === 0 ? (
          <div className={styles.empty}>暂无壁纸</div>
        ) : (
          wallpaper.map((elementKey) => (
            <WallpaperCell
              key={elementKey}
              elementKey={elementKey}
              config={configMap?.[elementKey] ?? null}
            />
          ))
        )}
      </Space>
    </Space>
  );
};

export default LockpackElements;
