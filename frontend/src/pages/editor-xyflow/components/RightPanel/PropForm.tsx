import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  AndroidOutlined,
  AppleOutlined,
  // PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SyncOutlined,
  LineOutlined,
  StopOutlined,
  // <LineOutlined />
  // <SyncOutlined />
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
  Select,
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
import { APP_LINK_OPTIONS } from '../../widget/base-config';
import {
  useEditorBackgroundColor,
  useEditorBackgroundColorSetter,
  useEditorBackgroundVariant,
  useEditorBackgroundVariantSetter,
  useEditorShowAxis,
  useEditorShowAxisSetter,
} from '../../context';
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
  const backgroundColor = useEditorBackgroundColor();
  const setBackgroundColor = useEditorBackgroundColorSetter();
  const backgroundVariant = useEditorBackgroundVariant();
  const setBackgroundVariant = useEditorBackgroundVariantSetter();
  const showAxis = useEditorShowAxis();
  const setShowAxis = useEditorShowAxisSetter();

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
            <InputTitle label="Background Variant" />
            <Select
              size="small"
              value={backgroundVariant}
              style={{ width: 120 }}
              options={[
                { label: 'Lines', value: 'lines' },
                { label: 'Dots', value: 'dots' },
                { label: 'Cross', value: 'cross' },
              ]}
              onChange={(value) => {
                setBackgroundVariant(value as 'lines' | 'dots' | 'cross');
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
  title?: string
  value?: string;
  onChange?: (value: string) => void;
}> = ({ value, onChange, title }) => {
  const colorValue = value === MIXED_VALUE ? undefined : value;
  return (
    <>
      <Row>
        <Col span={24}>
          <Flex align='center' justify='space-between'>
            <InputTitle label={title || "TextColor"} />
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
const BackgroundColorInput: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
}> = ({ value, onChange }) => {
  const colorValue = value === MIXED_VALUE ? undefined : value;
  return (
    <>
      <Row>
        <Col span={24}>
          <Flex align='center' justify='space-between'>
            <InputTitle label="BackgroundColor" />
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

const AnimationType: React.FC<{
  value?: number;
  onChange?: (value: number) => void;
}> = ({ value, onChange }) => {
  return (
    <>
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
        <Flex align='center' justify='space-between'>
          <InputTitle label="AnimationType" />
          <Segmented
            value={value}
            block
            onChange={onChange}
            options={[
              { value: 0, label: <ArrowDownOutlined /> },
              { value: 1, label: <ArrowUpOutlined /> },
              { value: 2, label: <ArrowRightOutlined /> },
              { value: 3, label: <ArrowLeftOutlined /> },
            ]}
          />
        </Flex>
        </Col>
      </Row>
    </>
  );
};
const AnimationCategory: React.FC<{
  value?: number;
  onChange?: (value: number) => void;
}> = ({ value, onChange }) => {
  return (
    <>
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
        <Flex align='center' justify='space-between'>
          <InputTitle label="AnimationCategory" />
          <Segmented
            value={value}
            block
            onChange={onChange}
            options={[
              { value: 0, label: <LineOutlined /> },
              { value: 1, label: <SyncOutlined /> },
              { value: 2, label: <StopOutlined /> },
            ]}
          />
        </Flex>
        </Col>
      </Row>
    </>
  );
};

export const IsGIFInput: React.FC<{
  value?: boolean;
  onChange?: (value: boolean) => void;
}> = ({
  value,
  onChange
}) => {
  return (
    <Row style={{ marginBottom: '5px' }}>
      <Col span={24}>
        <Flex align='center' justify='space-between'>
          <InputTitle label="IsGIF" />
          <Switch size="small" checked={value} onChange={onChange} />
        </Flex>
      </Col>
    </Row>
  );
};

export const ImageUpload: React.FC<{
  value: any;
  onChange: (payload: { id: any; value: any; path?: string; deletePath?: any }) => void;
  title: any;
  width?: number;
  marginBottom?: number;
}> = ({ value, onChange, title, width, marginBottom }) => {
  const { styles } = useImageUploadStyles();
  const handleChange =
    (id: any, path?: string): UploadProps['onChange'] =>
    ({ fileList: nextFileList }) => {
      const singleList = nextFileList.slice(-1);
      const latestFile = singleList[0];
      if (!latestFile) {
        onChange({ id, path, value: '' });
        return;
      }
      if (latestFile.url) {
        onChange({ id, path, value: latestFile.url });
        return;
      }
      onChange({
        id,
        path,
        value: latestFile.originFileObj,
      });
    };
  const onDeleteSource = (id: any, path: string | undefined, deletePath: any) => {
    onChange({
      id: id,
      path,
      value: null,
      deletePath: deletePath,
    });
  }

  return (
    <>
      <Row className={styles.formRow}>
        {title !== null ? (
          <Col span={24}>
              <InputTitle label="Source" />
          </Col>
        ) : null}
      </Row>
      <Row>
        <Col span={24}>
          {value.map((v: any) => {
            return (v.value ? (
                <Flex key={v.id} align='center' justify='space-between' style={{ marginBottom: marginBottom || '5px' }}>
                  <Button variant="filled" color="default" style={{ width: '80%' }} >
                    <img className={styles.previewImg} src={v.value} alt="" />
                    <Typography.Text
                      style={{ width: width || 200 }}
                      ellipsis={{ tooltip: v.name }}
                    >
                      {v.name}
                    </Typography.Text>
                  </Button>
                  <Button type="text" onClick={() => {onDeleteSource(v.id, v.path, v.value)}} icon={<DeleteOutlined />} />
                </Flex>
            ) : (
                <Upload
                  key={v.id}
                  accept="image/*"
                  maxCount={1}
                  fileList={[]}
                  beforeUpload={() => false}
                  onChange={handleChange(v.id, v.path)}
                >
                  <Button variant="filled" color="default" style={{ marginBottom: marginBottom || '5px'}}>
                      <UploadOutlined />
                      <Typography.Text
                        style={{ width: width || 200 }}
                        ellipsis={{ tooltip: v.name }}
                      >
                        {v.name}
                      </Typography.Text>
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
      {hasKey('festivalName') && (
        <>
          <PropInput
            LabelName="FestivalName"
            value={editProps.festivalName}
            onChange={(nextValue) => onChange?.('festivalName', nextValue)}
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
      {hasKey('crossPadding') && (
        <>
          <PropInput
            LabelName="CrossPadding"
            value={editProps.crossPadding}
            type="number"
            onChange={(nextValue) => onChange?.('crossPadding', nextValue)}
          />
        </>
      )}
      {hasKey('isGif') && (
        <>
          <IsGIFInput
            value={editProps.isGif}
            onChange={(nextValue) => onChange?.('isGif', nextValue)}
          />
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
      {hasKey('appLinks') && (
        <>
          { editProps.appLinks === '__MIXED__' ? null : (
            <Row>
              <Col>
                  <InputTitle label="AppLinks" />
              </Col>
              {editProps.appLinks.map((link: string | number, index: number) => {
                const appLinkSource = Array.isArray(editProps.appLinksSource)
                  ? editProps.appLinksSource[index]
                  : undefined;
                return (
                  <Col key={index} span={24}>
                    <Flex align='center'>
                        <Select
                          value={link}
                          style={{ width: 100, marginRight: 5, marginBottom: 5 }}
                          onChange={(val) => {
                            const temp = [...editProps.appLinks];
                            temp[index] = val;
                            onChange?.('appLinks', temp);
                          }}
                          options={[{ value: '', label: 'UnSelect' }, ...APP_LINK_OPTIONS]}
                        />
                        {appLinkSource && (
                          <ImageUpload
                              value={[{
                                value: appLinkSource?.source ?? '',
                                name: '序列-' + (index + 1),
                                id: index,
                              }]}
                              onChange={(payload: any) => {
                                const { value } = payload;
                                const sourceList = Array.isArray(editProps.appLinksSource)
                                  ? editProps.appLinksSource
                                  : [];
                                const temp = [...sourceList.map((ele: any) => ({ ...ele }))];
                                if (!temp[index] || typeof temp[index] !== 'object') {
                                  temp[index] = {};
                                }
                                temp[index] = {
                                  ...temp[index],
                                  source: value,
                                };
                                onChange?.('appLinksSource', temp);
                              }}
                              title={null}
                              width={50}
                              marginBottom={0}
                            />
                        )}
                    </Flex>
                  </Col>
                )
              })}
            </Row>
          ) }
          
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
      {hasKey('bgColor_now') && (
        <>
          <FontColorInput
            title="BgColorNow"
            value={editProps.bgColor_now}
            onChange={(nextValue) => onChange?.('bgColor_now', nextValue)}
          />
        </>
      )}
      {hasKey('textColor_future') && (
        <>
          <FontColorInput
            title="TextColorFuture"
            value={editProps.textColor_future}
            onChange={(nextValue) => onChange?.('textColor_future', nextValue)}
          />
        </>
      )}
      {hasKey('textColor_now') && (
        <>
          <FontColorInput
            title="TextColorNow"
            value={editProps.textColor_now}
            onChange={(nextValue) => onChange?.('textColor_now', nextValue)}
          />
        </>
      )}
      {hasKey('textColor_past') && (
        <>
          <FontColorInput
            title="TextColorPast"
            value={editProps.textColor_past}
            onChange={(nextValue) => onChange?.('textColor_past', nextValue)}
          />
        </>
      )}
      {hasKey('textColor_capital_day') && (
        <>
          <FontColorInput
            title="textColorCapitalDay"
            value={editProps.textColor_capital_day}
            onChange={(nextValue) => onChange?.('textColor_capital_day', nextValue)}
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
      {hasKey('content') && (
        <>
          <PropInput
            LabelName="Content"
            value={editProps.content}
            onChange={(nextValue) => onChange?.('content', nextValue)}
          />
        </>
      )}
      {hasKey('backgroundColor') && (
        <>
          <BackgroundColorInput
            value={editProps.backgroundColor}
            onChange={(nextValue) => onChange?.('backgroundColor', nextValue)}
          />
        </>
      )}
      {hasKey('animationCategory') && (
        <>
          <AnimationCategory
            value={editProps.animationCategory}
            onChange={(nextValue) => onChange?.('animationCategory', nextValue)}
          />
        </>
      )}
      {hasKey('animationType') && (
        <>
          <AnimationType
            value={editProps.animationType}
            onChange={(nextValue) => onChange?.('animationType', nextValue)}
          />
        </>
      )}
      {hasKey('distance') && (
        <>
          <PropInput
            LabelName="Distance"
            value={editProps.distance}
            type="number"
            onChange={(nextValue) => onChange?.('distance', nextValue)}
          />
        </>
      )}
      {hasKey('duration') && (
        <>
          <PropInput
            LabelName="Duration"
            value={editProps.duration}
            type="number"
            onChange={(nextValue) => onChange?.('duration', nextValue)}
          />
        </>
      )}
      {hasKey('imageWidth') && (
        <>
          <PropInput
            LabelName="ImageWidth"
            value={editProps.imageWidth}
            type="number"
            onChange={(nextValue) => onChange?.('imageWidth', nextValue)}
          />
        </>
      )}
      {hasKey('imageHeight') && (
        <>
          <PropInput
            LabelName="ImageHeight"
            value={editProps.imageHeight}
            type="number"
            onChange={(nextValue) => onChange?.('imageHeight', nextValue)}
          />
        </>
      )}
      {hasKey('source') && (
        <>
          <ImageUpload
            value={editProps.source}
            onChange={(nextValue) => onChange?.('source', nextValue)}
            title="Source"
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
      {hasKey('battery') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.battery} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'battery');
          }} title="Battery"/>
        </>
      )}
      {hasKey('time') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.time} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'time');
          }} title="Time"/>
        </>
      )}
      {hasKey('day') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.day} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'day');
          }} title="Day"/>
        </>
      )}
      {hasKey('date') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.date} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'date');
          }} title="Date"/>
        </>
      )}
      {hasKey('other') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.other} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'other');
          }} title="Other"/>
        </>
      )}
      {hasKey('month') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.month} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'month');
          }} title="Month"/>
        </>
      )}
      {hasKey('calendar') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.calendar} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'calendar');
          }} title="Calendar"/>
        </>
      )}
      {hasKey('firstImageAnimation') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.firstImageAnimation} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'firstImageAnimation');
          }} title="FirstImageAnimation"/>
        </>
      )}
      {hasKey('secondImageAnimation') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.secondImageAnimation} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'secondImageAnimation');
          }} title="SecondImageAnimation"/>
        </>
      )}
      {hasKey('thirdImageAnimation') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.thirdImageAnimation} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'thirdImageAnimation');
          }} title="ThirdImageAnimation"/>
        </>
      )}
      {hasKey('fourthImageAnimation') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.fourthImageAnimation} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'fourthImageAnimation');
          }} title="FourthImageAnimation"/>
        </>
      )}
      {hasKey('battery_20') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.battery_20} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'battery_20');
          }} title="Battery_20"/>
        </>
      )}
      {hasKey('battery_40') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.battery_40} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'battery_40');
          }} title="Battery_40"/>
        </>
      )}
      {hasKey('battery_60') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.battery_60} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'battery_60');
          }} title="Battery_60"/>
        </>
      )}
      {hasKey('battery_80') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.battery_80} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'battery_80');
          }} title="Battery_80"/>
        </>
      )}
      {hasKey('battery_100') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.battery_100} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'battery_100');
          }} title="Battery_100"/>
        </>
      )}
      {hasKey('quote') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.quote} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'quote');
          }} title="Quote"/>
        </>
      )}
      {hasKey('year') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.year} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'year');
          }} title="Year"/>
        </>
      )}
      {hasKey('days') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.days} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'days');
          }} title="Days"/>
        </>
      )}
      {hasKey('remainDays') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.remainDays} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'remainDays');
          }} title="RemainDays"/>
        </>
      )}
      {hasKey('title') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.title} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'title');
          }} title="Title"/>
        </>
      )}
    </>
  );
};

