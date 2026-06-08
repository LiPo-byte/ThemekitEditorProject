import React, { useEffect, useState } from 'react';
import FontSelect from '../FontSelect';
import { useEditorCore } from '../../context';
import {
  Col,
  Input,
  Row,
  Divider,
  ColorPicker,
  Segmented,
  Switch,
  type UploadProps,
  Flex,
  Tag,
} from 'antd';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  AppleOutlined,
  AndroidOutlined,
} from '@ant-design/icons';
import Dragger from 'antd/es/upload/Dragger';

const InputTitle: React.FC<{ label: string }> = ({ label }) => {
  return <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{label}</span>;
};

export const CanvasSettingsForm: React.FC = () => {
  const core = useEditorCore();
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [showBackgroundDecorations, setShowBackgroundDecorations] = useState(true);
  const [showAxis, setShowAxis] = useState(true);

  useEffect(() => {
    if (!core) return;
    setBackgroundColor(core.getBackgroundColor());
    setShowBackgroundDecorations(core.getShowBackgroundDecorations());
    setShowAxis(core.getShowAxis());
  }, [core]);

  return (
    <>
      <Row style={{ marginBottom: '8px' }}>
        <Col span={24}>
          <Flex justify="space-between" align="center">
            <InputTitle label="Background Color" />
            <div style={{ marginTop: 4 }}>
              <ColorPicker
                value={backgroundColor}
                size="small"
                showText
                onChange={(value) => {
                  const css = value.toHexString();
                  setBackgroundColor(css);
                  core?.setBackgroundColor(css);
                }}
              />
            </div>
          </Flex>
        </Col>
      </Row>
      <Divider size="small" />
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
          <Flex justify="space-between" align="center">
            <InputTitle label="Show Background Dots" />
            <Switch
              size="small"
              checked={showBackgroundDecorations}
              onChange={(checked) => {
                setShowBackgroundDecorations(checked);
                core?.setShowBackgroundDecorations(checked);
              }}
            />
          </Flex>
        </Col>
      </Row>
      <Divider size="small" />
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
          <Flex justify="space-between" align="center">
            <InputTitle label="Show Axis" />
            <Switch
              size="small"
              checked={showAxis}
              onChange={(checked) => {
                setShowAxis(checked);
                core?.setShowAxis(checked);
              }}
            />
          </Flex>
        </Col>
      </Row>
      <Divider size="small" />
    </>
  );
};

export const AgentTagsMultipleSelect: React.FC = () => {
  const [checked, setChecked] = useState([false, false]);
  const handleChange = (index: number, b: boolean) => {
    const temp = [...checked];
    temp[index] = b;
    setChecked(temp);
  }
  return (
    <Row style={{ marginBottom: '5px' }}>
      <Col span={24}>
        <Flex justify='space-between' align='center'>
            <InputTitle label="Sync Agent" />
            <div>
              <Tag.CheckableTag
                style={{ marginRight: 5 }}
                icon={<AppleOutlined />}
                checked={checked[0]}
                onChange={(checked) => handleChange(0, checked)}
              >
                Ios
              </Tag.CheckableTag>
              <Tag.CheckableTag
                icon={<AndroidOutlined />}
                checked={checked[1]}
                onChange={(checked) => handleChange(1, checked)}
              >
                Android
              </Tag.CheckableTag>
            </div>
        </Flex>
      </Col>
    </Row>
  )
}

const FontSizeInput: React.FC = () => {
  return (
    <>
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
          <InputTitle label="FontSize" />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Input size="small" value={12} placeholder="Filled" variant="filled" />
        </Col>
      </Row>
    </>
  );
};

const FontFamilyInput: React.FC = () => {
  return (
    <>
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
          <InputTitle label="Font" />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <FontSelect onChange={async () => {}} />
        </Col>
      </Row>
    </>
  );
};

const FontColorInput: React.FC = () => {
  return (
    <>
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
          <InputTitle label="FontColor" />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <ColorPicker defaultValue="#1677ff" size="small" showText />
        </Col>
      </Row>
    </>
  );
};

const TextAlignment: React.FC = () => {
  return (
    <>
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
          <InputTitle label="TextAlignment" />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Segmented
            value={1}
            block
            onChange={() => {}}
            options={[
              { value: 1, label: <AlignLeftOutlined /> },
              { value: 2, label: <AlignCenterOutlined /> },
              { value: 3, label: <AlignRightOutlined /> },
            ]}
          />
        </Col>
      </Row>
    </>
  );
};

const NameInput: React.FC = () => {
  return (
    <>
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
          <InputTitle label="Name" />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Input size="small" value="Pink_Love_Heart_Large" placeholder="Filled" variant="filled" />
        </Col>
      </Row>
    </>
  );
};

export const IsGIFInput: React.FC = () => {
  return (
    <Row style={{ marginBottom: '5px' }}>
      <Col span={4}>
        <InputTitle label="IsGIF" />
      </Col>
      <Col span={20}>
        <Switch size="small" defaultChecked onChange={() => {}} />
      </Col>
    </Row>
  );
};

const FileUpload: React.FC = () => {
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
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
          <InputTitle label="Image/Video" />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Dragger {...props}>
            <p className="ant-upload-hint">
              Support for a single or bulk upload. Strictly prohibited from uploading company data or
              other banned files.
            </p>
          </Dragger>
        </Col>
      </Row>
    </>
  );
};

export const SelectedNodePropForm: React.FC = () => {
  return (
    <>
      {/* <Space orientation="vertical" size="medium"> */}
        <AgentTagsMultipleSelect/>
        {/* <AgentSegmented /> */}
        <Divider size="small" />
        <NameInput />
        <Divider size="small" />
        <IsGIFInput />
        <Divider size="small" />
        <FontSizeInput />
        <Divider size="small" />
        <FontFamilyInput />
        <Divider size="small" />
        <FontColorInput />
        <Divider size="small" />
        <TextAlignment />
        <Divider size="small" />
        <FileUpload />
        <Divider size="small" />
      {/* </Space> */}
    </>
  );
};
