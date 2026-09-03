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
  FileOutlined,
  // <LineOutlined />
  // <SyncOutlined />
} from '@ant-design/icons';
import { MovSvg, Mp4Svg } from '@/icons';
import {
  App,
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
import SelectElements from './SelectElements';
// import type { ColorPickerProps } from 'antd';

import { createStyles } from 'antd-style';
import React, { useEffect, useRef, useState } from 'react';
import { LOCK_IMAGE_FIELD_KEYS } from '../../lockwidget/base-config';
import { APP_LINK_OPTIONS } from '../../widget/base-config';
import {
  useEditorBackgroundColor,
  useEditorBackgroundColorSetter,
  useEditorBackgroundVariant,
  useEditorBackgroundVariantSetter,
  useEditorShowAxis,
  useEditorShowAxisSetter,
  useEditorGetElementsConfigMap,
  useEditorProjectId,
} from '../../context';
import { uploadProjectFile, uploadProjectLottie } from '../../service';
import FontSelect from '../FontSelect';

const MIXED_VALUE = '__MIXED__';
// type Color = GetProp<ColorPickerProps, 'value'>;
// const { Paragraph, Text } = Typography;

const InputTitle: React.FC<{ label: string }> = ({ label }) => {
  return <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{label}</span>;
};

const useImageUploadStyles = createStyles(({ token, css }) => ({
  uploadButtonLabelMixed: css`
    margin-top: 0;
    padding: 2px 8px;
    border-radius: 6px;
    background: ${token.colorBgMask};
    color: ${token.colorTextLightSolid};
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
  appCell: css`
    width: 100%;
    aspect-ratio: 1;
    border-radius: 8px;
    background: ${token.colorFillTertiary};
    border: 2px solid var(--editor-panel-border, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: pointer;
    font-size: 8px;
    font-weight: 600;
    text-align: center;
    box-sizing: border-box;
    color: ${token.colorTextSecondary};
    word-break: break-word;
    user-select: none;
    font-family: AvenirNext-HeavyItalic;
  `,
  appCellSelected: css`
    border-color: ${token.colorPrimary};
    // background: #1677ff;
  `,
  appCellImg: css`
    width: 100%;
    height: 100%;
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
  title?: string,
}> = ({ value, onChange, title }) => {
  const isMixed = value === MIXED_VALUE;
  const fontValue = isMixed ? undefined : value;
  return (
    <>
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
          <Flex justify="space-between" align="center">
            <InputTitle label={title || 'Font'} />
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

const CALENDAR_CENTER_ONLY = new Set(['calendar_1_1', 'calendar_1_2', 'calendar_1_3']);
const TIME_NO_CENTER = new Set(['time_1_1', 'time_1_3']);

const TextAlignment: React.FC<{
  value?: number;
  onChange?: (value: number) => void;
  title?: string,
  themekitSizewithTypes?: string[],
}> = ({ value, onChange, title, themekitSizewithTypes }) => {
  const types = themekitSizewithTypes ?? [];
  const centerOnly = types.some((t) => CALENDAR_CENTER_ONLY.has(t));
  const noCenter = types.some((t) => TIME_NO_CENTER.has(t));
  return (
    <>
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
        <Flex align='center' justify='space-between'>
          <InputTitle label={title || "TextAlignment"} />
          <Segmented
            value={value}
            block
            onChange={onChange}
            options={[
              { value: 1, label: <AlignLeftOutlined />, disabled: centerOnly },
              { value: 2, label: <AlignCenterOutlined />, disabled: noCenter },
              { value: 3, label: <AlignRightOutlined />, disabled: centerOnly },
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

  // 只有被 walkNodeData 聚合过的 source 类字段才是数组，其余情况兜底成空列表避免整个面板崩掉
  const sourceList = Array.isArray(value) ? value : [];

  return (
    <>
      <Row className={styles.formRow}>
        {title !== null ? (
          <Col span={24}>
              <InputTitle label={title ?? 'Source'} />
          </Col>
        ) : null}
      </Row>
      <Row>
        <Col span={24}>
          {sourceList.map((v: any) => {
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

export const FileUpload: React.FC<{
  value?: any;
  onChange?: (value: any) => void;
  title?: string;
}> = ({ value, onChange, title }) => {
  const { message } = App.useApp();
  const projectId = useEditorProjectId();
  const [uploading, setUploading] = useState(false);

  // 后端存的是 assets/{uuid}.{ext}，拿不到原始文件名，只能用路径末段展示
  const uploadedName =
    typeof value === 'string' && value && value !== MIXED_VALUE
      ? decodeURIComponent(value.split('/').pop() || '')
      : '';
  const isMp4 = uploadedName.toLowerCase().endsWith('.mp4');

  // 多选时各节点的文件不一样，没法合并成一个上传态，直接不展示
  if (value === MIXED_VALUE) return null;

  const onFileChangeHandler: UploadProps['onChange'] = async ({ fileList }) => {
    const rawFile = fileList.slice(-1)[0]?.originFileObj;
    if (!rawFile) return;
    if (!projectId) {
      message.error('项目未初始化，无法上传');
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadProjectFile(projectId, rawFile as File);
      onChange?.(url);
    } catch {
      message.error('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Row>
        {title !== null ? (
          <Col span={24}>
              <InputTitle label={title || 'File'} />
          </Col>
        ) : null}
      </Row>
      <Row>
        <Col span={24}>
          {uploadedName ? (
            <Flex align="center" justify="space-between">
              <Button variant="filled" color="default" style={{ width: '80%' }}>
                {isMp4 ? <Mp4Svg /> : <MovSvg />}
                {isMp4 ? 'Mp4' : 'Mov'}
              </Button>
              <Button
                type="text"
                onClick={() => onChange?.('')}
                icon={<DeleteOutlined />}
              />
            </Flex>
          ) : (
            <Upload
              accept=".mov,.mp4,.mp3,.m4a,.wav"
              maxCount={1}
              fileList={[]}
              beforeUpload={() => false}
              onChange={onFileChangeHandler}
            >
                <Button variant="filled" color="default" loading={uploading}>
                    <UploadOutlined />
                    <Typography.Text
                      style={{ width: 200 }}
                      ellipsis={{ tooltip: title }}
                    >
                      {title}
                    </Typography.Text>
                </Button>
            </Upload>
          )}
        </Col>
      </Row>
    </>
  )
}

export const LottieUpload: React.FC<{
  value?: any;
  onChange?: (value: any) => void;
  title?: string;
}> = ({ value, onChange, title }) => {
  const { message } = App.useApp();
  const projectId = useEditorProjectId();
  const [uploading, setUploading] = useState(false);

  // 后端存的是 assets/{uuid}.{ext}，拿不到原始文件名，只能用路径末段展示
  const uploadedName =
    typeof value === 'string' && value && value !== MIXED_VALUE
      ? decodeURIComponent(value.split('/').pop() || '')
      : '';
  const isDotLottie = uploadedName.toLowerCase().endsWith('.lottie');

  // 多选时各节点的文件不一样，没法合并成一个上传态，直接不展示
  if (value === MIXED_VALUE) return null;

  const onFileChangeHandler: UploadProps['onChange'] = async ({ fileList }) => {
    const rawFile = fileList.slice(-1)[0]?.originFileObj;
    if (!rawFile) return;
    if (!projectId) {
      message.error('项目未初始化，无法上传');
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadProjectLottie(projectId, rawFile as File);
      onChange?.(url);
    } catch {
      message.error('上传失败，请确认是有效的 .lottie 或 .json 文件');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Row>
        {title !== null ? (
          <Col span={24}>
              <InputTitle label={title || 'Lottie'} />
          </Col>
        ) : null}
      </Row>
      <Row>
        <Col span={24}>
          {uploadedName ? (
            <Flex align="center" justify="space-between">
              <Button variant="filled" color="default" style={{ width: '80%' }}>
                <FileOutlined />
                {isDotLottie ? 'Lottie' : 'Json'}
              </Button>
              <Button
                type="text"
                onClick={() => onChange?.('')}
                icon={<DeleteOutlined />}
              />
            </Flex>
          ) : (
            <Upload
              accept=".lottie,.json"
              maxCount={1}
              fileList={[]}
              beforeUpload={() => false}
              onChange={onFileChangeHandler}
            >
                <Button variant="filled" color="default" loading={uploading}>
                    <UploadOutlined />
                    <Typography.Text
                      style={{ width: 200 }}
                      ellipsis={{ tooltip: title }}
                    >
                      {title}
                    </Typography.Text>
                </Button>
            </Upload>
          )}
        </Col>
      </Row>
    </>
  )
}

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
  const committed = isMixed ? undefined : value;
  const [draft, setDraft] = useState(committed);
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current) return;
    setDraft(committed);
  }, [committed]);

  // 输入中只更新本地 draft，失焦/回车才向上提交：commitNodes 每次调用都会全量 clone
  // nodes 并压入撤销栈，逐字符提交会让一次编辑产生几十条历史。
  const commitDraft = () => {
    if (draft !== committed) {
      onChange?.(draft);
    }
  };

  const handleFocus = () => {
    focusedRef.current = true;
  };

  const handleBlur = () => {
    focusedRef.current = false;
    commitDraft();
  };

  return (
    <>
      <Row style={{ marginBottom: '5px' }}>
        <Col span={24}>
          <Flex align='center' justify='space-between'>
            <InputTitle label={LabelName} />
            {type === 'number' ? (
              <InputNumber
                size="small"
                onChange={setDraft}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onPressEnter={commitDraft}
                value={draft}
                placeholder={isMixed ? 'Multiple values' : 'Filled'}
                variant="filled"
                style={{
                  width: '50%'
                }}
              />
            ) : (
              <Input
                size="small"
                onChange={(event) => setDraft(event.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onPressEnter={commitDraft}
                value={draft}
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

const ContentTextAreaInput: React.FC<{
  value?: any;
  onChange?: (value: string) => void;
}> = ({ value, onChange }) => {
  const isMixed = value === MIXED_VALUE;
  const committed = isMixed ? '' : String(value ?? '');
  const [draft, setDraft] = useState(committed);
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current) return;
    setDraft(committed);
  }, [committed]);

  return (
    <Row style={{ marginBottom: '5px' }}>
      <Col span={24}>
        <Flex vertical gap={4}>
          <InputTitle label="Content" />
          <Input.TextArea
            size="small"
            value={draft}
            placeholder={isMixed ? 'Multiple values' : 'Filled'}
            variant="filled"
            autoSize={{ minRows: 3, maxRows: 8 }}
            onFocus={() => {
              focusedRef.current = true;
            }}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              focusedRef.current = false;
              if (draft !== committed) {
                onChange?.(draft);
              }
            }}
          />
        </Flex>
      </Col>
    </Row>
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
      {hasKey('show') && (
        <>
          <Row>
            <Col span={24}>
              <Flex align='center' justify='space-between'>
                <InputTitle label="Show" />
                <Switch checked={editProps.show} onChange={(nextValue) => onChange?.('show', nextValue)} />
              </Flex>
            </Col>
          </Row>
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
      {hasKey('font_heavy') && (
        <>
          <FontFamilyInput
            title="FontHeavy"
            value={editProps.font_heavy}
            onChange={(nextValue) => onChange?.('font_heavy', nextValue)}
          />
        </>
      )}
      {hasKey('commonField') && (
        <>
          <FontFamilyInput
            title="CommonField"
            value={editProps.commonField}
            onChange={(nextValue) => onChange?.('commonField', nextValue)}
          />
        </>
      )}
      {hasKey('textAlignment') && (
        <>
          <TextAlignment
            value={editProps.textAlignment}
            themekitSizewithTypes={editProps.themekitSizewithTypes || []}
            onChange={(nextValue) => onChange?.('textAlignment', nextValue)}
          />
        </>
      )}
      {hasKey('topTextAlignment') && (
        <>
          <TextAlignment
            title="TopTextAlignment"
            value={editProps.topTextAlignment}
            onChange={(nextValue) => onChange?.('topTextAlignment', nextValue)}
          />
        </>
      )}
      {hasKey('bottomTextAlignment') && (
        <>
          <TextAlignment
            title="BottomTextAlignment"
            value={editProps.bottomTextAlignment}
            onChange={(nextValue) => onChange?.('bottomTextAlignment', nextValue)}
          />
        </>
      )}
      {hasKey('clockPadding') && (
        <>
          <PropInput
            LabelName="ClockPadding"
            value={editProps.clockPadding}
            type="number"
            onChange={(nextValue) => onChange?.('clockPadding', nextValue)}
          />
        </>
      )}
      {hasKey('textPadding') && (
        <>
          <PropInput
            LabelName="TextPadding"
            value={editProps.textPadding}
            type="number"
            onChange={(nextValue) => onChange?.('textPadding', nextValue)}
          />
        </>
      )}
      {hasKey('itemSpacing') && (
        <>
          <PropInput
            LabelName="ItemSpacing"
            value={editProps.itemSpacing}
            type="number"
            onChange={(nextValue) => onChange?.('itemSpacing', nextValue)}
          />
        </>
      )}
      {hasKey('lineSpacing') && (
        <>
          <PropInput
            LabelName="LineSpacing"
            value={editProps.lineSpacing}
            type="number"
            onChange={(nextValue) => onChange?.('lineSpacing', nextValue)}
          />
        </>
      )}
      {hasKey('singer') && (
        <>
          <PropInput
            LabelName="Singer"
            value={editProps.singer}
            type="text"
            onChange={(nextValue) => onChange?.('singer', nextValue)}
          />
        </>
      )}
      {hasKey('songName') && (
        <>
          <PropInput
            LabelName="SongName"
            value={editProps.songName}
            type="text"
            onChange={(nextValue) => onChange?.('songName', nextValue)}
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
          )}
        </>
      )}
      {hasKey('alpha') && (
        <>
          <AlphaSlider value={editProps.alpha} onChange={(nextValue) => onChange?.('alpha', nextValue)} />
        </>
      )}
      {hasKey('separateLineAlpha') && (
        <>
          <AlphaSlider value={editProps.separateLineAlpha} onChange={(nextValue) => onChange?.('separateLineAlpha', nextValue)} />
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
      {hasKey('borderColor') && (
        <>
          <FontColorInput
            title="BorderColor"
            value={editProps.borderColor}
            onChange={(nextValue) => onChange?.('borderColor', nextValue)}
          />
        </>
      )}
      {hasKey('selectedBgColor') && (
        <>
          <FontColorInput
            title="SelectedBgColor"
            value={editProps.selectedBgColor}
            onChange={(nextValue) => onChange?.('selectedBgColor', nextValue)}
          />
        </>
      )}
      {hasKey('selectedTextColor') && (
        <>
          <FontColorInput
            title="SelectedTextColor"
            value={editProps.selectedTextColor}
            onChange={(nextValue) => onChange?.('selectedTextColor', nextValue)}
          />
        </>
      )}
      {hasKey('unSelectedTextColor') && (
        <>
          <FontColorInput
            title="UnSelectedTextColor"
            value={editProps.unSelectedTextColor}
            onChange={(nextValue) => onChange?.('unSelectedTextColor', nextValue)}
          />
        </>
      )}
      {hasKey('separateLineColor') && (
        <>
          <FontColorInput
            title="SeparateLineColor"
            value={editProps.separateLineColor}
            onChange={(nextValue) => onChange?.('separateLineColor', nextValue)}
          />
        </>
      )}
      {hasKey('focusColor') && (
        <>
          <FontColorInput
            title="FocusColor"
            value={editProps.focusColor}
            onChange={(nextValue) => onChange?.('focusColor', nextValue)}
          />
        </>
      )}
      {hasKey('content') && (
        <ContentTextAreaInput
          value={editProps.content}
          onChange={(nextValue) => onChange?.('content', nextValue)}
        />
      )}
      {hasKey('backgroundColor') && (
        <>
          <BackgroundColorInput
            value={editProps.backgroundColor}
            onChange={(nextValue) => onChange?.('backgroundColor', nextValue)}
          />
        </>
      )}
      {hasKey('containerColor') && (
        <>
          <FontColorInput
            title="ContainerColor"
            value={editProps.containerColor}
            onChange={(nextValue) => onChange?.('containerColor', nextValue)}
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
      {hasKey('intCommonField') && (
        <>
          <PropInput
            LabelName="IntCommonField"
            value={editProps.intCommonField}
            type="number"
            onChange={(nextValue) => onChange?.('intCommonField', nextValue)}
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
      {hasKey('charge_source') && (
        <>
          <ImageUpload
            value={editProps.charge_source}
            onChange={(nextValue) => onChange?.('charge_source', nextValue)}
            title="ChargeSource"
          />
        </>
      )}
      {hasKey('movsource') && (
        <>
          <FileUpload
            value={editProps.movsource}
            onChange={(nextValue) => onChange?.('movsource', nextValue)}
            title="MovSource"
          />
        </>
      )}
      {hasKey('mp4source') && (
        <>
          <FileUpload
            value={editProps.mp4source}
            onChange={(nextValue) => onChange?.('mp4source', nextValue)}
            title="Mp4Source"
          />
        </>
      )}
      {hasKey('lottieSource') && (
        <>
          <LottieUpload
            value={editProps.lottieSource}
            onChange={(nextValue) => onChange?.('lottieSource', nextValue)}
            title="LottieSource"
          />
        </>
      )}
      </Space>
    </>
  );
};

// const AppsGridForm: React.FC<{
//   apps: Record<string, any>;
//   desketopShow: any;
//   onChange?: (key: string, value: any, keyClass?: string) => void;
// }> = ({ apps, onChange, desketopShow }) => {
//   const { styles } = useImageUploadStyles();
//   const appList = Array.isArray(apps) ? apps : [];
//   const showList = Array.isArray(desketopShow) ? desketopShow : [];

//   const toggleSelect = (appName: string, selected: boolean, index: number) => {
//     const temp = [...showList];
//     if (!selected) {
//       onChange?.('desketopShow', temp.filter((i: any) => (i.type === 'icon') && i.name !== appName));
//     } else {
//       temp.push({
//         type: 'icon',
//         ...appList[index],
//       })
//       onChange?.('desketopShow', temp);
//     }
//   };

//   return (
//     <Row gutter={[8, 8]}>
//       {appList.map((app: any, index: number) => {
//         // const app = (appValue ?? {}) as Record<string, any>;
//         const imageUrl = app.previewsource || '';
//         const label = String(app.name);
//         const selected = (showList.findIndex((i: any) => (i.type === 'icon' && i.name === label))) >= 0;

//         return (
//           <Col key={label} span={6}>
//             <div
//               className={`${styles.appCell}${selected ? ` ${styles.appCellSelected}` : ''}`}
//               onClick={() => toggleSelect(app.name, !selected, index)}
//             >
//               {imageUrl ? (
//                 <img className={styles.appCellImg} src={imageUrl} alt={label} />
//               ) : (
//                 label
//               )}
//             </div>
//           </Col>
//         );
//       })}
//     </Row>
//   );
// };

/** image_charging_icon_rectangle -> Image Charging Icon Rectangle */
const formatImageFieldTitle = (key: string) =>
  key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

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
          <BaseSelectedNodePropForm editProps={{...editProps.time, themekitSizewithTypes: editProps.themekitSizewithTypes || [] }} onChange={(key: string, value: any) => {
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
          <BaseSelectedNodePropForm editProps={{...editProps.month, themekitSizewithTypes: editProps.themekitSizewithTypes || [] }} onChange={(key: string, value: any) => {
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
      {hasKey('weatherDate') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.weatherDate} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'weatherDate');
          }} title="WeatherDate"/>
        </>
      )}
      {hasKey('weatherWeekday') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.weatherWeekday} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'weatherWeekday');
          }} title="WeatherWeekday"/>
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
      {hasKey('clock') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.clock} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'clock');
          }} title="Clock"/>
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
      {hasKey('minuteClock') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.minuteClock} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'minuteClock');
          }} title="MinuteClock"/>
        </>
      )}
      {hasKey('hourClock') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.hourClock} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'hourClock');
          }} title="HourClock"/>
        </>
      )}
      {hasKey('dotClock') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.dotClock} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'dotClock');
          }} title="DotClock"/>
        </>
      )}
      {hasKey('dialLargeClock') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.dialLargeClock} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'dialLargeClock');
          }} title="DialLargeClock"/>
        </>
      )}
      {hasKey('dialSmallClock') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.dialSmallClock} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'dialSmallClock');
          }} title="DialSmallClock"/>
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
      {hasKey('weekday') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.weekday} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'weekday');
          }} title="Weekday"/>
        </>
      )}
      {hasKey('AmAndPm') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.AmAndPm} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'AmAndPm');
          }} title="AmAndPm"/>
        </>
      )}
      {hasKey('weatherMain') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.weatherMain} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'weatherMain');
          }} title="WeatherMain"/>
        </>
      )}
      {hasKey('weatherSub') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.weatherSub} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'weatherSub');
          }} title="WeatherSub"/>
        </>
      )}
      {hasKey('imageCloud') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.imageCloud} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'imageCloud');
          }} title="ImageCloud"/>
        </>
      )}
      {hasKey('imageSun') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.imageSun} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'imageSun');
          }} title="ImageSun"/>
        </>
      )}
      {hasKey('imageRain') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.imageRain} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'imageRain');
          }} title="ImageRain"/>
        </>
      )}
      {hasKey('imageSnow') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.imageSnow} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'imageSnow');
          }} title="ImageSnow"/>
        </>
      )}
      {hasKey('imageThunder') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.imageThunder} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'imageThunder');
          }} title="ImageThunder"/>
        </>
      )}
      {hasKey('imageWind') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.imageWind} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'imageWind');
          }} title="ImageWind"/>
        </>
      )}
      {hasKey('player') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.player} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'player');
          }} title="Player"/>
        </>
      )}
      {/* {hasKey('apps') && (
        <>
          <Divider style={{
            width: '280px',
            marginLeft: '-16px',
          }} size="small"></Divider>
          <Space orientation="vertical" size="medium" style={{ display: 'flex' }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Apps
            </Typography.Title>
            <AppsGridForm apps={editProps.apps} desketopShow={editProps.desketopShow} onChange={onChange} />
          </Space>
        </>
      )} */}
      {/* {hasKey('selectElements') && (
        <>
          <Divider style={{
            width: '280px',
            marginLeft: '-16px',
          }} size="small"></Divider>
          <Space orientation="vertical" size="medium" style={{ display: 'flex' }}>
            <SelectElements selectElements={editProps.selectElements} showElements={editProps.showElements} onChange={onChange} />
          </Space>
        </>
      )} */}
      {hasKey('music') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.music} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'music');
          }} title="Music"/>
        </>
      )}
      {hasKey('percent') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.percent} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'percent');
          }} title="Percent"/>
        </>
      )}
      {hasKey('isCharging') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.isCharging} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'isCharging');
          }} title="IsCharging"/>
        </>
      )}
      {hasKey('mode') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.mode} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'mode');
          }} title="Mode"/>
        </>
      )}
      {hasKey('topInfo') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.topInfo} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'topInfo');
          }} title="TopInfo"/>
        </>
      )}
      {hasKey('bottomInfo') && (
        <>
          <BaseSelectedNodePropForm editProps={editProps.bottomInfo} onChange={(key: string, value: any) => {
            onChange && onChange(key, value, 'bottomInfo');
          }} title="BottomInfo"/>
        </>
      )}
      {/* 锁屏组件的图片位，清单见 lockwidget/base-config 的 LOCK_IMAGE_FIELD_KEYS */}
      {LOCK_IMAGE_FIELD_KEYS.filter((key) => hasKey(key)).map((imageKey) => (
        <BaseSelectedNodePropForm
          key={imageKey}
          editProps={editProps[imageKey]}
          onChange={(key: string, value: any) => {
            onChange && onChange(key, value, imageKey);
          }}
          title={formatImageFieldTitle(imageKey)}
        />
      ))}
    </>
  );
};

