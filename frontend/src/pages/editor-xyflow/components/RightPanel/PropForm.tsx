import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  AndroidOutlined,
  AppleOutlined,
  // PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  Col,
  ColorPicker,
  Divider,
  Flex,
  type GetProp,
  Input,
  InputNumber,
  Row,
  Segmented,
  Switch,
  Tag,
  Upload,
  Button,
  // type UploadFile,
  type UploadProps,
  // Space,
  Typography,
  Slider,
  Space
} from 'antd';
// import type { ColorPickerProps } from 'antd';

import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import { useEditorCore } from '../../context';
import FontSelect from '../FontSelect';

const MIXED_VALUE = '__MIXED__';
// type Color = GetProp<ColorPickerProps, 'value'>;
// const { Paragraph, Text } = Typography;

const InputTitle: React.FC<{ label: string }> = ({ label }) => {
  return <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{label}</span>;
};

const useImageUploadStyles = createStyles(({ css }) => ({
  uploadButtonLabelMixed: css`
    margin-top: 0;
    padding: 2px 8px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    font-weight: 600;
  `,
  previewImage: css`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  formRow: css`
    margin-bottom: 5px;
  `,
  upload: css`
    width: 32px;
    height: 32px;
  `,
  deleteButton: css`
    // display: flex;
    // align-items: center;
    // justify-content: space-between;
  `,
  itemRow: css`
    width: 100%;
    margin-bottom: 5px;
  `,
  iconBox: css`
    width: 28px;
    height: 28px;
  `,
  itemText: css`
    width: 150px;
    text-align: left;
  `,
  previewImg: css`
    width: 20px;
    height: 20px;
    border-radius: 5px;
    object-fit: cover;
  `,
}));

export const CanvasSettingsForm: React.FC = () => {
  const core = useEditorCore();
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [showBackgroundDecorations, setShowBackgroundDecorations] =
    useState(true);
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
  };
  return (
    <Row style={{ marginBottom: '5px' }}>
      <Col span={24}>
        <Flex justify="space-between" align="center">
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
  );
};


const FontFamilyInput: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
}> = ({ value, onChange }) => {
  const isMixed = value === MIXED_VALUE;
  const fontValue = isMixed ? undefined : value;
  return (
    <>
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
          <Flex justify="space-between" align="center">
            <InputTitle label="Font" />
            <FontSelect
              value={fontValue}
              onChange={onChange}
              isMixed={isMixed}
            />
          </Flex>
        </Col>
      </Row>
    </>
  );
};

const FontColorInput: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
}> = ({ value, onChange }) => {
  const colorValue = value === MIXED_VALUE ? undefined : value;
  return (
    <>
      <Row>
        <Col span={24}>
          <Flex align='center' justify='space-between'>
            <InputTitle label="TextColor" />
            <ColorPicker
              value={colorValue}
              size="small"
              disabledAlpha
              showText={(color) => {
                if (colorValue) {
                  return <span>{color.toHexString()}</span>
                } else {
                  return <span>Multiple values</span>
                }
              }}
              onChangeComplete={(color: any) => {
                onChange?.(color.toHexString().toUpperCase());
              }}
            />
          </Flex>
        </Col>
      </Row>
    </>
  );
};

const TextAlignment: React.FC<{
  value?: number;
  onChange?: (value: number) => void;
}> = ({ value, onChange }) => {
  return (
    <>
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
        <Flex align='center' justify='space-between'>
          <InputTitle label="TextAlignment" />
          <Segmented
            value={value}
            block
            onChange={onChange}
            options={[
              { value: 1, label: <AlignLeftOutlined /> },
              { value: 2, label: <AlignCenterOutlined /> },
              { value: 3, label: <AlignRightOutlined /> },
            ]}
          />
        </Flex>
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

export const ImageUpload: React.FC<{
  value: any;
  onChange: (payload: { id: any; value: any, deletePath?: any }) => void;
}> = ({ value, onChange }) => {
  const { styles } = useImageUploadStyles();
  const handleChange =
    (id: any): UploadProps['onChange'] =>
    ({ fileList: nextFileList }) => {
      const singleList = nextFileList.slice(-1);
      const latestFile = singleList[0];
      if (!latestFile) {
        onChange({ id, value: '' });
        return;
      }
      if (latestFile.url) {
        onChange({ id, value: latestFile.url });
        return;
      }
      onChange({
        id,
        value: latestFile.originFileObj,
      });
    };
  const onDeleteSource = (id: any, deletePath: any) => {
    onChange({
      id: id,
      value: null,
      deletePath: deletePath,
    });
  }

  return (
    <>
      <Row className={styles.formRow}>
        <Col span={24}>
            <InputTitle label="Source" />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          {value.map((v: any) => {
            return (v.value ? (
                <Flex key={v.id} align='center' justify='space-between' style={{ marginBottom: '5px' }}>
                  <Button variant="filled" color="default" style={{ width: '80%' }} >
                    <img className={styles.previewImg} src={v.value} alt="" />
                    {v.name}
                  </Button>
                  <Button type="text" onClick={() => {onDeleteSource(v.id, v.value)}} icon={<DeleteOutlined />} />
                </Flex>
            ) : (
                <Upload
                  key={v.id}
                  accept="image/*"
                  maxCount={1}
                  fileList={[]}
                  beforeUpload={() => false}
                  onChange={handleChange(v.id)}
                >
                  <Button variant="filled" color="default" style={{ marginBottom: '5px'}}>
                      <UploadOutlined /> {v.name}
                  </Button>
                </Upload>
            ))})}
        </Col>
      </Row>
    </>
  );
};

export const AlphaSlider:React.FC<{
  value?: any;
  onChange?: (value: any) => void;
}> = ({ value, onChange }) => {
  const [alphaValue, setAlphaValue] = useState(0)
  useEffect(() => {
    setAlphaValue(value === MIXED_VALUE ? 0 : value * 100)
  }, [value])
  return (
    <Row>
      <Col span={24}>
        <Flex align='center' justify='space-between'>
          <InputTitle label="Alpha" />
          <Slider
            min={1}
            max={100}
            style={{
              width: '50%'
            }}
            styles={{
              rail: {
                height: 12,
                borderRadius: 6,
                backgroundImage: `
                  linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1)),
                  linear-gradient(45deg, #ccc 25%, transparent 25%),
                  linear-gradient(-45deg, #ccc 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #ccc 75%),
                  linear-gradient(-45deg, transparent 75%, #ccc 75%)
                `,
                backgroundSize: '100% 100%, 8px 8px, 8px 8px, 8px 8px, 8px 8px',
                backgroundPosition: '0 0, 0 0, 0 4px, 4px -4px, -4px 0',
                backgroundColor: '#fff',
                opacity: 1,
              },
              track: {
                height: 12,
                background: 'transparent',
              },
              handle: {
                marginTop: 4
              },
            }}
            tooltip={{
              formatter: (v: any) => {
                return <>{v}%</>
              }
            }}
            onChangeComplete={(v: any) => {
              onChange?.(v/100)
            }}

            onChange={setAlphaValue}
            value={alphaValue || 0}
          />
        </Flex>
      </Col>
    </Row>
  )
}

export const RadiusSlider:React.FC<{
  value?: any;
  onChange?: (value: any) => void;
}> = ({ value, onChange }) => {
  const [radiusValue, setRadiusValue] = useState(0)
  useEffect(() => {
    setRadiusValue(value === MIXED_VALUE ? 0 : value)
  }, [value])
  return (
    <Row>
      <Col span={24}>
        <Flex align='center' justify='space-between'>
          <InputTitle label="Radius" />
          <Slider
            min={0}
            max={200}
            onChangeComplete={onChange}
            onChange={setRadiusValue}
            value={radiusValue}
            style={{
              width: '50%'
            }}
          />
        </Flex>
      </Col>
    </Row>
  )
}

export const PropInput: React.FC<{
  LabelName: string;
  value?: any;
  type?: string;
  onChange?: (value: any) => void;
}> = ({ LabelName, value, onChange, type }) => {
  const isMixed = value === MIXED_VALUE;
  const inputValue = isMixed ? undefined : value;
  return (
    <>
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
          <Flex align='center' justify='space-between'>
            <InputTitle label={LabelName} />
            {type === 'number' ? (
              <InputNumber
                size="small"
                onChange={onChange}
                value={inputValue}
                placeholder={isMixed ? 'Multiple values' : 'Filled'}
                variant="filled"
                style={{
                  width: '50%'
                }}
              />
            ) : (
              <Input
                size="small"
                onChange={(event) => onChange?.(event.target.value)}
                value={inputValue}
                placeholder={isMixed ? 'Multiple values' : 'Filled'}
                variant="filled"
                style={{
                  width: '50%'
                }}
              />
            )}
          </Flex>
        </Col>
      </Row>
    </>
  );
};

export const BaseSelectedNodePropForm: React.FC<{
  editProps: Record<string, any>;
  onChange?: (key: string, value: any) => void;
  title?: string;
}> = ({ editProps, onChange, title }) => {
  const hasKey = (key: string) => Object.hasOwn(editProps, key);
  return (
    <>
      <Divider style={{
        width: '280px',
        marginLeft: '-16px',
      }} size="small"></Divider>
      <Space orientation="vertical" size="medium" style={{ display: 'flex' }}>
      <Typography.Title level={5} style={{ margin: 0 }}>
          {title}
      </Typography.Title>
      {hasKey('name') && (
        <>
          <PropInput
            LabelName="Name"
            value={editProps.name}
            onChange={(nextValue) => onChange?.('name', nextValue)}
          />
        </>
      )}
      {hasKey('radius') && (
        <>
          <RadiusSlider value={editProps.radius} onChange={(nextValue) => onChange?.('radius', nextValue)} />
        </>
      )}
      {hasKey('padding') && (
        <>
          <PropInput
            LabelName="Padding"
            value={editProps.padding}
            type="number"
            onChange={(nextValue) => onChange?.('padding', nextValue)}
          />
        </>
      )}
      {hasKey('isGIF') && (
        <>
          <IsGIFInput />
        </>
      )}
      {hasKey('isLockScreen') && (
        <>
          <Row style={{ marginBottom: '5px' }}>
            <Col span={24}>
              <Flex align='center' justify='space-between'>
                  <InputTitle label="LockScreen" />
                  <Switch
                      size="small"
                      checked={editProps.isLockScreen}
                      onChange={(nextValue) => onChange?.('isLockScreen', nextValue)}
                    />
              </Flex>
            </Col>
          </Row>
        </>
      )}
      {hasKey('textSize') && (
        <>
          <PropInput
            LabelName="TextSize"
            value={editProps.textSize}
            type="number"
            onChange={(nextValue) => onChange?.('textSize', nextValue)}
          />
        </>
      )}
      {hasKey('font') && (
        <>
          <FontFamilyInput
            value={editProps.font}
            onChange={(nextValue) => onChange?.('font', nextValue)}
          />
        </>
      )}
      {hasKey('textAlignment') && (
        <>
          <TextAlignment
            value={editProps.textAlignment}
            onChange={(nextValue) => onChange?.('textAlignment', nextValue)}
          />
        </>
      )}
      {hasKey('alpha') && (
        <>
          <AlphaSlider value={editProps.alpha} onChange={(nextValue) => onChange?.('alpha', nextValue)} />
        </>
      )}
      {hasKey('textHeight') && (
        <>
          <PropInput
            LabelName="TextHeight"
            value={editProps.textHeight}
            type="number"
            onChange={(nextValue) => onChange?.('textHeight', nextValue)}
          />
        </>
      )}
      {hasKey('topSpacing') && (
        <>
          <PropInput
            LabelName="TopSpacing"
            value={editProps.topSpacing}
            type="number"
            onChange={(nextValue) => onChange?.('topSpacing', nextValue)}
          />
        </>
      )}
      {hasKey('bottomSpacing') && (
        <>
          <PropInput
            LabelName="BottomSpacing"
            value={editProps.bottomSpacing}
            type="number"
            onChange={(nextValue) => onChange?.('bottomSpacing', nextValue)}
          />
        </>
      )}
      {hasKey('textColor') && (
        <>
          <FontColorInput
            value={editProps.textColor}
            onChange={(nextValue) => onChange?.('textColor', nextValue)}
          />
        </>
      )}
      {hasKey('source') && (
        <>
          <ImageUpload
            value={editProps.source}
            onChange={(nextValue) => onChange?.('source', nextValue)}
          />
        </>
      )}
      </Space>
    </>
  );
};

export const SelectedNodePropForm: React.FC<{
  editProps: Record<string, any>;
  onChange?: (key: string, value: any, keyClass?: string) => void;
}> = ({ editProps, onChange }) => {
  const hasKey = (key: string) => Object.hasOwn(editProps, key);
  return (
    <>
      <BaseSelectedNodePropForm editProps={editProps} onChange={onChange} />
      {hasKey('time') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.time} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'time');
          }} title="Time"/>
        </>
      )}
      {hasKey('date') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.date} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'date');
          }} title="Date"/>
        </>
      )}
      {hasKey('day') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.day} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'day');
          }} title="Day"/>
        </>
      )}
    </>
  );
};

