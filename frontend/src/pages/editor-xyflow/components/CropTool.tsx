import { Button, Flex, Slider, Typography } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import {
  useEditorCropDraftProps,
  useEditorCropDraftPropsSetter,
  useEditorCropToolOpen,
  useEditorCloseCropEditor,
  useEditorConfirmCropEditor,
} from '../context';
import { useEnterAnimation } from '../hooks/useEnterAnimation';

const useStyles = createStyles(({ token, css }) => ({
  toolbar: css`
    position: absolute;
    bottom: 0;
    left: 0px;
    right: 0px;
    margin: auto;
    overflow: hidden;
    box-shadow: ${token.boxShadowSecondary};
    background: ${token.colorBgElevated}f2;
    user-select: none;
    padding: 8px 12px;
    min-height: 56px;
    // display: flex;
    // align-items: center;
    // justify-content: center;
  `,
  barEnter: css`
    animation: toolbar-slide-up 260ms ease-out;
    @keyframes toolbar-slide-up {
      from {
        // transform: translateY(50px);
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  //   toolbarbody: css`
  //   `
}));

const DEFAULT_CROP_PROPS = {
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  translateX: 0,
  translateY: 0,
};

const CropTool: React.FC = () => {
  const { styles } = useStyles();
  const open = useEditorCropToolOpen();
  const closeCropEditor = useEditorCloseCropEditor();
  const confirmCropEditor = useEditorConfirmCropEditor();
  const cropDraftProps = useEditorCropDraftProps();
  const setCropDraftProps = useEditorCropDraftPropsSetter();
  const playEnterAnimation = useEnterAnimation(open, { durationMs: 260 });
  const activeCropProps = cropDraftProps ?? DEFAULT_CROP_PROPS;
  const activeScale = Math.max(0.2, Math.abs(activeCropProps.scaleX) || 1);

  const patchCropDraft = (patch: Partial<typeof DEFAULT_CROP_PROPS>) => {
    const base = cropDraftProps ?? DEFAULT_CROP_PROPS;
    setCropDraftProps({
      ...base,
      ...patch,
    });
  };

  if (!open) return null;
  return (
    <div
      className={`${styles.toolbar} ${playEnterAnimation ? styles.barEnter : ''}`}
    >
      <Flex
        gap="medium"
        align="center"
        justify="end"
        style={{ width: '100%', height: '100%', flexWrap: 'wrap' }}
      >
        <Flex align="center" gap={8} style={{ minWidth: 240 }}>
          <Typography.Text type="secondary">Scale</Typography.Text>
          <Slider
            min={0.2}
            max={3}
            step={0.01}
            value={activeScale}
            onChange={(value) => {
              const nextScale = Array.isArray(value) ? value[0] : value;
              const nextScaleXSign = activeCropProps.scaleX < 0 ? -1 : 1;
              const nextScaleYSign = activeCropProps.scaleY < 0 ? -1 : 1;
              patchCropDraft({
                scaleX: nextScale * nextScaleXSign,
                scaleY: nextScale * nextScaleYSign,
              });
            }}
            style={{ width: 180, margin: 0 }}
          />
        </Flex>
        <Flex align="center" gap={8} style={{ minWidth: 260 }}>
          <Typography.Text type="secondary">Rotate</Typography.Text>
          <Slider
            min={-180}
            max={180}
            step={1}
            value={activeCropProps.rotation}
            onChange={(value) => {
              patchCropDraft({ rotation: value });
            }}
            style={{ width: 200, margin: 0 }}
          />
        </Flex>
        <Button
          onClick={() => {
            const current = activeCropProps.scaleX === 0 ? 1 : activeCropProps.scaleX;
            patchCropDraft({ scaleX: -current });
          }}
        >
          Flip LR
        </Button>
        <Button
          onClick={() => {
            const current = activeCropProps.scaleY === 0 ? 1 : activeCropProps.scaleY;
            patchCropDraft({ scaleY: -current });
          }}
        >
          Flip UD
        </Button>
        <Button
          onClick={() => {
            setCropDraftProps({ ...DEFAULT_CROP_PROPS });
          }}
        >
          Reset
        </Button>
        <Button
          onClick={() => {
            closeCropEditor();
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            confirmCropEditor();
          }}
          type="primary"
        >
          Confirm
        </Button>
      </Flex>
    </div>
  );
};

export default CropTool;
