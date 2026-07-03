export type ImageSize = {
  width: number;
  height: number;
};

/**
 * 通过图片地址获取原始尺寸（naturalWidth / naturalHeight）。
 */
export const getImageSize = (src: string): Promise<ImageSize> =>
  new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('Image src is required.'));
      return;
    }

    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`));
    };
    image.src = src;
  });
