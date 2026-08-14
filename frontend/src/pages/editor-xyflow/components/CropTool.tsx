import { Button, Flex, InputNumber, Slider, Typography } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import {
  useEditorCropEditingNodeId,
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

const getEditingImageMetrics = (cropEditingNodeId: string) => {
  const imageEl = document.querySelector(
    `[data-crop-node-id="${cropEditingNodeId}"]`,
  ) as HTMLImageElement | null;
  const containerEl = imageEl?.parentElement;
  if (!imageEl || !containerEl) return null;
  const containerWidth = containerEl.clientWidth;
  const containerHeight = containerEl.clientHeight;
  const imageWidth = imageEl.naturalWidth || imageEl.clientWidth;
  const imageHeight = imageEl.naturalHeight || imageEl.clientHeight;
  if (!containerWidth || !containerHeight || !imageWidth || !imageHeight) return null;
  return {
    containerWidth,
    containerHeight,
    imageWidth,
    imageHeight,
  };
};

const computeTransformedCenter = ({
  imageWidth,
  imageHeight,
  scaleX,
  scaleY,
  rotation,
}: {
  imageWidth: number;
  imageHeight: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}) => {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const transformPoint = (x: number, y: number) => {
    const scaledX = x * scaleX;
    const scaledY = y * scaleY;
    return {
      x: scaledX * cos - scaledY * sin,
      y: scaledX * sin + scaledY * cos,
    };
  };
  const points = [
    transformPoint(0, 0),
    transformPoint(imageWidth, 0),
    transformPoint(0, imageHeight),
    transformPoint(imageWidth, imageHeight),
  ];
  const xList = points.map((point) => point.x);
  const yList = points.map((point) => point.y);
  return {
    x: (Math.min(...xList) + Math.max(...xList)) / 2,
    y: (Math.min(...yList) + Math.max(...yList)) / 2,
  };
};

const computeCenterTranslate = ({
  containerWidth,
  containerHeight,
  imageWidth,
  imageHeight,
  scaleX,
  scaleY,
  rotation,
}: {
  containerWidth: number;
  containerHeight: number;
  imageWidth: number;
  imageHeight: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}) => {
  const transformedCenter = computeTransformedCenter({
    imageWidth,
    imageHeight,
    scaleX,
    scaleY,
    rotation,
  });
  return {
    translateX: containerWidth / 2 - transformedCenter.x,
    translateY: containerHeight / 2 - transformedCenter.y,
  };
};

const CropTool: React.FC = () => {
  const { styles } = useStyles();
  const open = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
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

  const applyScale = (nextScale: number) => {
    const nextScaleXSign = activeCropProps.scaleX < 0 ? -1 : 1;
    const nextScaleYSign = activeCropProps.scaleY < 0 ? -1 : 1;
    patchCropDraft({
      scaleX: nextScale * nextScaleXSign,
      scaleY: nextScale * nextScaleYSign,
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
              applyScale(Array.isArray(value) ? value[0] : value);
            }}
            style={{ width: 180, margin: 0 }}
          />
          <InputNumber
            min={0.2}
            max={3}
            step={0.01}
            precision={2}
            value={activeScale}
            onChange={(value) => {
              if (typeof value !== 'number' || Number.isNaN(value)) return;
              applyScale(value);
            }}
            style={{ width: 80 }}
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
          <InputNumber
            min={-180}
            max={180}
            step={1}
            precision={0}
            value={activeCropProps.rotation}
            onChange={(value) => {
              if (typeof value !== 'number' || Number.isNaN(value)) return;
              patchCropDraft({ rotation: value });
            }}
            style={{ width: 80 }}
          />
        </Flex>
        <Button
          onClick={() => {
            const current = activeCropProps.scaleX === 0 ? 1 : activeCropProps.scaleX;
            const nextScaleX = -current;
            if (!cropEditingNodeId) {
              patchCropDraft({ scaleX: nextScaleX });
              return;
            }
            const metrics = getEditingImageMetrics(cropEditingNodeId);
            if (!metrics) {
              patchCropDraft({ scaleX: nextScaleX });
              return;
            }
            const beforeCenter = computeTransformedCenter({
              imageWidth: metrics.imageWidth,
              imageHeight: metrics.imageHeight,
              scaleX: activeCropProps.scaleX,
              scaleY: activeCropProps.scaleY,
              rotation: activeCropProps.rotation,
            });
            const afterCenter = computeTransformedCenter({
              imageWidth: metrics.imageWidth,
              imageHeight: metrics.imageHeight,
              scaleX: nextScaleX,
              scaleY: activeCropProps.scaleY,
              rotation: activeCropProps.rotation,
            });
            patchCropDraft({
              scaleX: nextScaleX,
              translateX: activeCropProps.translateX + beforeCenter.x - afterCenter.x,
              translateY: activeCropProps.translateY + beforeCenter.y - afterCenter.y,
            });
          }}
        >
          Flip LR
        </Button>
        <Button
          onClick={() => {
            const current = activeCropProps.scaleY === 0 ? 1 : activeCropProps.scaleY;
            const nextScaleY = -current;
            if (!cropEditingNodeId) {
              patchCropDraft({ scaleY: nextScaleY });
              return;
            }
            const metrics = getEditingImageMetrics(cropEditingNodeId);
            if (!metrics) {
              patchCropDraft({ scaleY: nextScaleY });
              return;
            }
            const beforeCenter = computeTransformedCenter({
              imageWidth: metrics.imageWidth,
              imageHeight: metrics.imageHeight,
              scaleX: activeCropProps.scaleX,
              scaleY: activeCropProps.scaleY,
              rotation: activeCropProps.rotation,
            });
            const afterCenter = computeTransformedCenter({
              imageWidth: metrics.imageWidth,
              imageHeight: metrics.imageHeight,
              scaleX: activeCropProps.scaleX,
              scaleY: nextScaleY,
              rotation: activeCropProps.rotation,
            });
            patchCropDraft({
              scaleY: nextScaleY,
              translateX: activeCropProps.translateX + beforeCenter.x - afterCenter.x,
              translateY: activeCropProps.translateY + beforeCenter.y - afterCenter.y,
            });
          }}
        >
          Flip UD
        </Button>
        <Button
          onClick={() => {
            if (!cropEditingNodeId) return;
            const metrics = getEditingImageMetrics(cropEditingNodeId);
            if (!metrics) return;
            const centeredTranslate = computeCenterTranslate({
              containerWidth: metrics.containerWidth,
              containerHeight: metrics.containerHeight,
              imageWidth: metrics.imageWidth,
              imageHeight: metrics.imageHeight,
              scaleX: activeCropProps.scaleX,
              scaleY: activeCropProps.scaleY,
              rotation: activeCropProps.rotation,
            });
            patchCropDraft({
              translateX: centeredTranslate.translateX,
              translateY: centeredTranslate.translateY,
            });
          }}
        >
          Center
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
