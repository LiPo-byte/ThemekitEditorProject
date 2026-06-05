import { createStyles } from 'antd-style';
import React from 'react';
import FontSelect from './FontSelect';
import {
  useEditorCore,
  useEditorCoreLoading,
  useEditorRightPanlOpen,
  useEditorRightPanlOpenSetter,
} from '../context';
import Konva from 'konva';
import { useEnterAnimation } from '../hooks/useEnterAnimation';
import { Col, Input, Row, Divider, ColorPicker, Segmented, Switch, UploadProps, Button, Typography } from 'antd';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  AppleOutlined,
  AndroidOutlined,
  CloseOutlined
} from '@ant-design/icons';
import Dragger from 'antd/es/upload/Dragger';

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
    transition: transform 260ms ease, opacity 220ms ease;
  `,
  shellClosed: css`
    transform: translateX(24px);
    opacity: 0;
    pointer-events: none;
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

const AgentSegmented:React.FC = () => {
  return (
    <>
        <Row style={{marginBottom: '5px'}}>
            {/* <Col span={24}>
                <InputTitle label=""  />
            </Col> */}
        </Row>
        <Row>
          <Col span={24}>
            <Segmented
                value='ios'
                block
                onChange={(v: any) => {}}
                options={[
                    { value: 'ios', label: <AppleOutlined /> },
                    { value: 'android', label: <AndroidOutlined /> },
                ]}
            />
          </Col>
        </Row>
    </>
  )
}

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
                affectedLayers.forEach((layer) => {
                  layer.batchDraw();
                });
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
                    { value: 1, label: <AlignLeftOutlined />},
                    { value: 2, label: <AlignCenterOutlined />},
                    { value: 3, label: <AlignRightOutlined />},
                ]}
            />
          </Col>
        </Row>
    </>
  )
}

const NameInput:React.FC = () => {
  return (
    <>
        <Row style={{marginBottom: '5px'}}>
            <Col span={24}>
                <InputTitle label="Name"  />
            </Col>
        </Row>
        <Row>
          <Col span={24}>
              <Input size='small' value={"Pink_Love_Heart_Large"} placeholder="Filled" variant="filled" />
          </Col>
        </Row>
    </>
  )
}

const IsGIFInput:React.FC = () => {
  return (
    <>
        <Row style={{marginBottom: '5px'}}>
            <Col span={4}>
                <InputTitle label="IsGIF"  />
            </Col>
            <Col span={20}>
                <Switch size='small' defaultChecked onChange={(checked) => {}} />
            </Col>
        </Row>
    </>
  )
}

const FileUpload:React.FC = () => {
  const props: UploadProps = {
    name: 'file',
    multiple: true,
    action: '',
    onChange(info) {
      const { status } = info.file;
      if (status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };
  return (
    <>
        <Row style={{marginBottom: '5px'}}>
            <Col span={24}>
                <InputTitle label="Image/Video"  />
            </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Dragger {...props}>
                {/* <p className="ant-upload-drag-icon"> */}
                  {/* <InboxOutlined /> */}
                {/* </p> */}
                {/* <p className="ant-upload-text">Click or drag file to this area to upload</p> */}
                <p className="ant-upload-hint">
                  Support for a single or bulk upload. Strictly prohibited from uploading company data or other
                  banned files.
                </p>
              </Dragger>
          </Col>
        </Row>
    </>
  )
}


const RightPanel: React.FC = () => {
  const { styles } = useStyles();
  const coreLoading = useEditorCoreLoading();
  const open = useEditorRightPanlOpen();
  const setOpen = useEditorRightPanlOpenSetter()
  const playEnterAnimation = useEnterAnimation(coreLoading || open, { durationMs: 280 });
  return (
    <div className={`${styles.shell} ${!open ? styles.shellClosed : ''} ${playEnterAnimation && open ? styles.shellEnter : ''}`}>
      <div className={styles.wrap}>
        <Row>
          <Col span={20} >
            <Typography.Title level={5} style={{ margin: 0 }}>
                Props
            </Typography.Title>
          </Col>
          <Col span={4}>
              <Button type="text" onClick={() => {setOpen(false)}} icon={<CloseOutlined />} />
          </Col>
        </Row>
        <AgentSegmented/>
        <Divider size='small' />
        <NameInput />
        <Divider size='small' />
        <IsGIFInput />
        <Divider size='small' />
        <FontSizeInput />
        <Divider size='small' />
        <FontFamilyInput />
        <Divider size='small' />
        <FontColorInput />
        <Divider size='small' />
        <TextAlignment />
        <Divider size='small' />
        <FileUpload />
        <Divider size='small' />
      </div>
    </div>
  );
};

export default RightPanel;
