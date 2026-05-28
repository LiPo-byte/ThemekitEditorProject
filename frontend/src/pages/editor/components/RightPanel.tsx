import { createStyles } from 'antd-style';
import React from 'react';
import FontSelect from './FontSelect';
import { useEditorCore } from '../context';
import Konva from 'konva';

const useStyles = createStyles(({ token, css }) => ({
  wrap: css`
    padding: 12px 16px;
  `,
  title: css`
    font-size: 12px;
    font-weight: 600;
    color: ${token.colorTextTertiary};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
  `,
  placeholder: css`
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${token.colorTextQuaternary};
    font-size: 12px;
    border: 1px dashed ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
}));

const RightPanel: React.FC = () => {
  const { styles } = useStyles();
  const core = useEditorCore();
  if (!core) {
    return null;
  }
  return (
    <div className={styles.wrap}>
      <div className={styles.title}>属性面板</div>
      <div className={styles.placeholder}>预留区域</div>
      <FontSelect
        onChange={async (v) => {
          const selectNodes = core.getSelectedNodes();
          const affectedLayers = new Set<Konva.Layer>();
          let changed = false;
          selectNodes.forEach((node) => {
            if (!(node instanceof Konva.Text)) return;
            node.fontFamily(v);
            const layer = node.getLayer();
            if (layer) affectedLayers.add(layer);
            changed = true;
          });
          if (!changed) return;
          affectedLayers.forEach((layer) => layer.batchDraw());
          core.refreshSelectionLayout();
        }}
      />
    </div>
  );
};

export default RightPanel;
