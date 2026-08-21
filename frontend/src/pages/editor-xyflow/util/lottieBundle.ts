import JSZip from 'jszip';

/**
 * Lottie 资源在两种形态之间转换：
 * - 打包态：.lottie（zip）或图片 base64 内嵌的单个 .json
 * - 展开态：animation json + 一组独立图片文件（导出包里的 lottie.json + images/）
 *
 * 两个方向分别是 unpackLottieBundle 与 packDotLottie，中间的资源引用改写
 * 由 externalizeLottieImageAssets / internalizeLottieImageAssets 对称承担。
 */

export const DEFAULT_LOTTIE_IMAGE_DIR = 'images';

export type LottieBundle = {
  /** 已改写成外链 imageDir/ 的动画 json */
  animation: Record<string, any>;
  /** 文件名 → 图片内容，文件名不含目录前缀 */
  images: Map<string, Blob>;
  imageDir: string;
};

/** .lottie 实际是 zip，靠魔数区分 dotLottie 与裸 json */
export const isZipBuffer = (buffer: ArrayBuffer) => {
  const head = new Uint8Array(buffer.slice(0, 4));
  return head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
};

export const extFromImageMime = (mime: string) => {
  const value = String(mime || '').toLowerCase();
  if (value.includes('png')) return 'png';
  if (value.includes('webp')) return 'webp';
  if (value.includes('gif')) return 'gif';
  if (value.includes('svg')) return 'svg';
  return 'jpg';
};

export const dataUrlToImage = (
  dataUrl: string,
): { blob: Blob; ext: string } | null => {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || 'image/png';
  const isBase64 = Boolean(match[2]);
  const payload = match[3] ?? '';
  try {
    if (!isBase64) {
      return {
        blob: new Blob([decodeURIComponent(payload)], { type: mime }),
        ext: extFromImageMime(mime),
      };
    }
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return { blob: new Blob([bytes], { type: mime }), ext: extFromImageMime(mime) };
  } catch {
    return null;
  }
};

const sanitizeAssetName = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '');

type LottieArchive = {
  animation: Record<string, any> | null;
  zipImages: Map<string, Blob>;
};

/** 解包 .lottie：取 manifest 指定的动画 json + images/ 下的图片 */
export const readDotLottieArchive = async (
  buffer: ArrayBuffer,
): Promise<LottieArchive> => {
  const zip = await JSZip.loadAsync(buffer);
  const zipImages = new Map<string, Blob>();
  const animationEntries = new Map<string, JSZip.JSZipObject>();
  const imageEntries: Array<{ name: string; file: JSZip.JSZipObject }> = [];
  let looseJson: JSZip.JSZipObject | null = null;
  let manifest: JSZip.JSZipObject | null = null;

  zip.forEach((relativePath, file) => {
    if (file.dir) return;
    const path = relativePath.replace(/^\.?\//, '');
    // v1 布局是 animations/ + images/，v2 换成了 a/ + i/，上传的两种都要能读
    if (/^(images|i)\/.+/i.test(path)) {
      imageEntries.push({ name: path.split('/').pop() as string, file });
      return;
    }
    if (/^(animations|a)\/.+\.json$/i.test(path)) {
      animationEntries.set(path.split('/').pop() as string, file);
      return;
    }
    if (/^manifest\.json$/i.test(path)) {
      manifest = file;
      return;
    }
    if (!looseJson && /\.json$/i.test(path)) looseJson = file;
  });

  for (const entry of imageEntries) {
    zipImages.set(entry.name, await entry.file.async('blob'));
  }

  let animationFile: JSZip.JSZipObject | null = null;
  if (manifest && animationEntries.size > 1) {
    try {
      const parsed = JSON.parse(await (manifest as JSZip.JSZipObject).async('string'));
      const id = parsed?.animations?.[0]?.id;
      if (id) animationFile = animationEntries.get(`${id}.json`) ?? null;
    } catch {
      // manifest 坏了不致命，退回按文件名取第一个
    }
  }
  if (!animationFile) {
    const firstKey = [...animationEntries.keys()].sort()[0];
    animationFile = (firstKey ? animationEntries.get(firstKey) : null) ?? looseJson;
  }
  if (!animationFile) return { animation: null, zipImages };

  return {
    animation: JSON.parse(await animationFile.async('string')),
    zipImages,
  };
};

/**
 * 把动画里的图片资源统一改成「外链 imageDir/」形式：
 * 内嵌 base64 抽成独立文件，已是外链的只改写目录前缀。
 * 会就地修改 animation（调用方传的是刚解析出来的临时对象）。
 */
export const externalizeLottieImageAssets = (
  animation: Record<string, any>,
  imageDir: string,
  zipImages: Map<string, Blob>,
): LottieBundle => {
  const assets = Array.isArray(animation.assets) ? animation.assets : [];
  const images = new Map<string, Blob>();

  assets.forEach((asset: any, assetIndex: number) => {
    // 预合成资源没有 p 字段，只处理图片资源
    if (!asset || typeof asset.p !== 'string' || !asset.p) return;
    const raw = asset.p;

    if (raw.startsWith('data:')) {
      const decoded = dataUrlToImage(raw);
      if (!decoded) return;
      const token = sanitizeAssetName(String(asset.id ?? '')) || `img_${assetIndex}`;
      const name = `${token}.${decoded.ext}`;
      images.set(name, decoded.blob);
      asset.p = name;
    } else {
      const name = raw.split('/').pop() || raw;
      const blob = zipImages.get(name);
      if (blob) images.set(name, blob);
      asset.p = name;
    }
    asset.u = `${imageDir}/`;
    asset.e = 0;
  });

  // assets 没引用到的图片也带出去，避免漏资源
  zipImages.forEach((blob, name) => {
    if (!images.has(name)) images.set(name, blob);
  });

  return { animation, images, imageDir };
};

/**
 * 打包态 → 展开态。input 支持 .lottie（zip）与裸 .json 两种。
 * 解析不出动画时返回 null，由调用方决定怎么提示。
 */
export const unpackLottieBundle = async (
  input: ArrayBuffer,
  options?: { imageDir?: string },
): Promise<LottieBundle | null> => {
  const imageDir = options?.imageDir || DEFAULT_LOTTIE_IMAGE_DIR;
  const archive: LottieArchive = isZipBuffer(input)
    ? await readDotLottieArchive(input)
    : {
        animation: JSON.parse(new TextDecoder().decode(input)),
        zipImages: new Map<string, Blob>(),
      };
  if (!archive.animation) return null;
  return externalizeLottieImageAssets(archive.animation, imageDir, archive.zipImages);
};

/** 从 URL 拉取并展开，失败会抛错 */
export const unpackLottieBundleByUrl = async (
  url: string,
  options?: { imageDir?: string },
): Promise<LottieBundle | null> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return unpackLottieBundle(await response.arrayBuffer(), options);
};

/** .lottie v1 内部目录是固定的，与展开态自定义的 imageDir 无关 */
const DOTLOTTIE_IMAGE_DIR = 'images';
const DOTLOTTIE_ANIMATION_DIR = 'animations';

/**
 * externalizeLottieImageAssets 的反向：改写成 .lottie 内部的引用形式。
 * v1 规范要求整条相对路径放 p、u 留空（见 dotlottie.io/spec/1.0）。
 * 返回副本，不动传入的 animation。
 */
export const internalizeLottieImageAssets = (
  animation: Record<string, any>,
  images: Map<string, Blob>,
): Record<string, any> => {
  const cloned = JSON.parse(JSON.stringify(animation)) as Record<string, any>;
  const assets = Array.isArray(cloned.assets) ? cloned.assets : [];

  assets.forEach((asset: any) => {
    if (!asset || typeof asset.p !== 'string' || !asset.p) return;
    if (asset.p.startsWith('data:')) return;
    const name = asset.p.split('/').pop() || asset.p;
    if (!images.has(name)) return;
    asset.p = `${DOTLOTTIE_IMAGE_DIR}/${name}`;
    asset.u = '';
    asset.e = 0;
  });

  return cloned;
};

export type PackDotLottieOptions = {
  /** 动画 id，同时决定 animations/{id}.json 的文件名 */
  animationId?: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  generator?: string;
};

/**
 * 展开态 → 打包态：按 v1 布局打成 .lottie（manifest.json + animations/ + images/）。
 * 选 v1 而不是 v2（a/ + i/），是因为新老播放器都能读 v1，v2 只有新版能读。
 */
export const packDotLottie = async (
  bundle: LottieBundle,
  options?: PackDotLottieOptions,
): Promise<Blob> => {
  const animationId =
    sanitizeAssetName(options?.animationId ?? '') || 'animation_1';
  const zip = new JSZip();

  const manifest = {
    version: '1.0.0',
    generator: options?.generator || 'themekit-editor',
    revision: 1,
    animations: [
      {
        id: animationId,
        direction: 1,
        speed: options?.speed ?? 1,
        playMode: 'normal',
        loop: options?.loop ?? true,
        autoplay: options?.autoplay ?? true,
      },
    ],
    activeAnimationId: animationId,
  };
  zip.file('manifest.json', JSON.stringify(manifest));

  const animation = internalizeLottieImageAssets(bundle.animation, bundle.images);
  zip.file(
    `${DOTLOTTIE_ANIMATION_DIR}/${animationId}.json`,
    JSON.stringify(animation),
  );

  // 转成 ArrayBuffer 再塞，JSZip 读 Blob 走的是 FileReader，非浏览器环境会炸
  for (const [name, blob] of bundle.images) {
    zip.file(`${DOTLOTTIE_IMAGE_DIR}/${name}`, await blob.arrayBuffer());
  }

  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
};
