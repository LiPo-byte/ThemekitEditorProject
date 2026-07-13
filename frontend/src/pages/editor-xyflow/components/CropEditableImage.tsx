import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useEditorCropDraftProps,
  useEditorCropDraftPropsSetter,
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
  type CropProps,
} from '../context';
import { getImageSize } from '../widget/util';

type CropEditableImageProps = {
  nodeId: string;
  source?: string;
  radius?: number;
  cropProps?: CropProps;
};

const DEFAULT_CROP_PROPS: CropProps = {
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  translateX: 0,
  translateY: 0,
};

const toCropProps = (value: unknown): CropProps => {
  if (!value || typeof value !== 'object') return { ...DEFAULT_CROP_PROPS };
  const source = value as Record<string, unknown>;
  const readNumber = (key: keyof CropProps, fallback: number) => {
    const next = source[key];
    return typeof next === 'number' && Number.isFinite(next) ? next : fallback;
  };
  return {
    scaleX: readNumber('scaleX', DEFAULT_CROP_PROPS.scaleX),
    scaleY: readNumber('scaleY', DEFAULT_CROP_PROPS.scaleY),
    rotation: readNumber('rotation', DEFAULT_CROP_PROPS.rotation),
    translateX: readNumber('translateX', DEFAULT_CROP_PROPS.translateX),
    translateY: readNumber('translateY', DEFAULT_CROP_PROPS.translateY),
  };
};

const CropEditableImage: React.FC<CropEditableImageProps> = ({
  nodeId,
  source,
  radius,
  cropProps,
}) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const cropDraftProps = useEditorCropDraftProps();
  const setCropDraftProps = useEditorCropDraftPropsSetter();
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const isCropEditingNode = cropToolOpen && cropEditingNodeId === nodeId;
  const activeCropProps = useMemo(
    () => (isCropEditingNode && cropDraftProps ? cropDraftProps : toCropProps(cropProps)),
    [isCropEditingNode, cropDraftProps, cropProps],
  );

  useEffect(() => {
    if (!source) {
      setImageSize(null);
      return;
    }

    let disposed = false;
    void getImageSize(source)
      .then((size) => {
        if (disposed) return;
        setImageSize(size);
      })
      .catch(() => {
        if (disposed) return;
        setImageSize(null);
      });

    return () => {
      disposed = true;
    };
  }, [source]);

  const onCropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isCropEditingNode) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    const baseCropProps = cropDraftProps ?? toCropProps(cropProps);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      setCropDraftProps({
        ...baseCropProps,
        translateX: baseCropProps.translateX + deltaX,
        translateY: baseCropProps.translateY + deltaY,
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    event.currentTarget.setPointerCapture(pointerId);
  };

  if (!source) return null;

  return (
    <>
      <img
        ref={imageRef}
        data-crop-node-id={nodeId}
        src={source}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: imageSize ? `${imageSize.width}px` : 'auto',
          height: imageSize ? `${imageSize.height}px` : 'auto',
          maxWidth: 'none',
          maxHeight: 'none',
          pointerEvents: 'none',
          zIndex: 1,
          transformOrigin: 'top left',
          transform: `translate(${activeCropProps.translateX}px, ${activeCropProps.translateY}px) scale(${activeCropProps.scaleX}, ${activeCropProps.scaleY}) rotate(${activeCropProps.rotation}deg)`,
        }}
      />
      {isCropEditingNode ? (
        <div
          onPointerDown={onCropPointerDown}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: imageSize ? `${imageSize.width}px` : '100%',
            height: imageSize ? `${imageSize.height}px` : '100%',
            transformOrigin: 'top left',
            transform: `translate(${activeCropProps.translateX}px, ${activeCropProps.translateY}px) scale(${activeCropProps.scaleX}, ${activeCropProps.scaleY}) rotate(${activeCropProps.rotation}deg)`,
            cursor: 'grab',
            zIndex: 10,
            background: 'transparent',
          }}
        />
      ) : null}
      {isCropEditingNode ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 11,
            pointerEvents: 'none',
            border: '1px dashed rgba(255, 255, 255, 0.95)',
            boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.28)',
            borderRadius: `${radius ?? 0}px`,
          }}
        />
      ) : null}
    </>
  );
};

export default CropEditableImage;
