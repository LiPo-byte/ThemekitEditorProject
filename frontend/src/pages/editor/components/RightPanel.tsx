import { createStyles } from 'antd-style';
import React from 'react';
import FontSelect from './FontSelect';
import { useEditorCore, useEditorCoreLoading } from '../context';
import Konva from 'konva';
import { useEnterAnimation } from '../hooks/useEnterAnimation';
import { Col, Input, Row, Divider, ColorPicker, Segmented } from 'antd';

const useStyles = createStyles(({ token, css }) => ({
  shell: css`
    width: 280px;
    position: absolute;
    top: 80px;
    right: 12px;
    bottom: 62px;
    z-index: 20;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: ${token.boxShadowSecondary};
    background: ${token.colorBgElevated}f2;
    backdrop-filter: blur(14px);
  `,
  shellEnter: css`
    animation: right-panel-slide-in 360ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
    @keyframes right-panel-slide-in {
      from {
        transform: translateX(16px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `,
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

const InputTitle:React.FC<any> = ({ label }) => {
  return <span style={{fontSize: '10px', fontWeight: 'bold'}} >{label}</span>
};

const FontSizeInput:React.FC = () => {
  return (
    <>
        <Row style={{marginBottom: '5px'}}>
            <Col span={24}>
                <InputTitle label="FontSize"  />
            </Col>
        </Row>
        <Row>
          <Col span={24}>
              <Input size='small' value={12} placeholder="Filled" variant="filled" />
          </Col>
        </Row>
    </>
  )
}
const FontFamilyInput:React.FC = () => {
  const core = useEditorCore();
  return (
    <>
        <Row style={{marginBottom: '5px'}}>
            <Col span={24}>
                <InputTitle label="Font"  />
            </Col>
        </Row>
        <Row>
          <Col span={24}>
          <FontSelect
              onChange={async (v) => {
                if (!core) return;
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
          </Col>
        </Row>
    </>
  )
}
const FontColorInput:React.FC = () => {
  return (
    <>
        <Row style={{marginBottom: '5px'}}>
            <Col span={24}>
                <InputTitle label="FontColor"  />
            </Col>
        </Row>
        <Row>
          <Col span={24}>
              <ColorPicker defaultValue="#1677ff" size="small" showText />
          </Col>
        </Row>
    </>
  )
}

const TextAlignment:React.FC = () => {
  return (
    <>
        <Row style={{marginBottom: '5px'}}>
            <Col span={24}>
                <InputTitle label="TextAlignment"  />
            </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Segmented
                value={1}
                block
                onChange={(v: any) => {}}
                options={[
                    { value: 1, label: 'left'},
                    { value: 2, label: 'center'},
                    { value: 3, label: 'right'},
                ]}
            />
          </Col>
        </Row>
    </>
  )
}

const RightPanel: React.FC = () => {
  const { styles } = useStyles();
  const coreLoading = useEditorCoreLoading();
  const playEnterAnimation = useEnterAnimation(coreLoading, { durationMs: 280 });
  return (
    <div className={`${styles.shell} ${playEnterAnimation ? styles.shellEnter : ''}`}>
      <div className={styles.wrap}>
        <FontSizeInput />
        <Divider size='small' />
        <FontFamilyInput />
        <Divider size='small' />
        <FontColorInput />
        <Divider size='small' />
        <TextAlignment />
        <Divider size='small' />
      </div>
    </div>
  );
};

export default RightPanel;
