/**
 * 从 lottie 动画反推 diy live wallpaper 的 wallpapers_spec.json。
 *
 * 槽位靠图片命名约定识别：content_N 是第 N 个槽的内容图，mask_N / border_N 是
 * 同槽的配套图；有 mask_N 表示这个槽可以让用户换成自己的照片（customs[N]）。
 *
 * 几何取动画最后一帧的值，位置要沿 parent 链和预合成宿主图层一路累加；
 * 尺寸直接取 asset 的 w/h，不乘 scale。
 */

type LottieLayer = Record<string, any>;

export type WallpaperSpec = {
  version: number;
  layoutType: number;
  /** "w{中心X},h{中心Y},w{宽},w{高}"，除中心 Y 以画布高为基准外，其余都以画布宽为基准 */
  frames: string[];
  angles: number[];
  customs: boolean[];
};

const SLOT_FILENAME = /^(content|mask|border)_(\d+)\./i;

/** 关键帧数组取末帧值；静态值原样返回 */
const lastKeyframeValue = (value: any): any => {
  if (!Array.isArray(value) || !value.length) return value;
  if (typeof value[0] !== 'object' || value[0] === null) return value;
  // 末帧常常只有 t 没有 s，往前找到最后一个带值的
  for (let i = value.length - 1; i >= 0; i -= 1) {
    const frame = value[i];
    if (frame?.s !== undefined) return frame.s;
    if (frame?.e !== undefined) return frame.e;
  }
  return null;
};

const numberAt = (value: any, index = 0) => {
  const resolved = Array.isArray(value) ? value[index] : value;
  const num = Number(resolved);
  return Number.isFinite(num) ? num : 0;
};

const readTransform = (layer: LottieLayer) => {
  const ks = layer?.ks ?? {};
  const anchor = lastKeyframeValue(ks.a?.k);
  const rotation = lastKeyframeValue(ks.r?.k);

  let px: number;
  let py: number;
  if (ks.p?.s) {
    // 位置被拆成独立的 x / y 通道
    px = numberAt(lastKeyframeValue(ks.p?.x?.k));
    py = numberAt(lastKeyframeValue(ks.p?.y?.k));
  } else {
    const position = lastKeyframeValue(ks.p?.k);
    px = numberAt(position, 0);
    py = numberAt(position, 1);
  }

  return {
    ax: numberAt(anchor, 0),
    ay: numberAt(anchor, 1),
    px,
    py,
    rotation: numberAt(rotation, 0),
  };
};

type LayerSite = { layer: LottieLayer; siblings: LottieLayer[] };

/** 从外到内的图层链：最后一项是目标图片图层，前面是各层预合成宿主 */
const findImageLayerChain = (
  refId: string,
  layers: LottieLayer[],
  compLayers: Map<string, LottieLayer[]>,
  visiting: Set<string>,
): LayerSite[] | null => {
  for (const layer of layers) {
    if (!layer) continue;
    if (layer.refId === refId && layer.ty === 2) return [{ layer, siblings: layers }];

    const nestedId = layer.refId ? String(layer.refId) : '';
    const nested = nestedId ? compLayers.get(nestedId) : null;
    // 预合成互相引用会死循环，靠 visiting 挡住
    if (!nested || visiting.has(nestedId)) continue;
    visiting.add(nestedId);
    const sub = findImageLayerChain(refId, nested, compLayers, visiting);
    visiting.delete(nestedId);
    if (sub) return [{ layer, siblings: layers }, ...sub];
  }
  return null;
};

/** 累加整条链的平移与旋转，得到图片左上角在画布上的末帧位置 */
const accumulateChain = (chain: LayerSite[]) => {
  let x = 0;
  let y = 0;
  let rotation = 0;

  for (const { layer, siblings } of chain) {
    let current: LottieLayer | undefined = layer;
    const walked = new Set<number>();
    while (current) {
      const transform = readTransform(current);
      x += transform.px - transform.ax;
      y += transform.py - transform.ay;
      rotation += transform.rotation;

      const parentInd: unknown = current.parent;
      if (typeof parentInd !== 'number' || walked.has(parentInd)) break;
      walked.add(parentInd);
      current = siblings.find((sibling) => sibling?.ind === parentInd);
    }
  }

  return { x, y, rotation };
};

const roundTo2 = (value: number) => Math.round(value * 100) / 100;

type SlotAssets = {
  content?: Record<string, any>;
  mask?: Record<string, any>;
  border?: Record<string, any>;
};

/**
 * 生成 spec。没有任何 content_N 时返回空数组的 spec；
 * content 编号不连续（不是 0..n-1）时返回 null，由调用方提示并跳过。
 */
export const buildLottieWallpaperSpec = (
  animation: Record<string, any>,
): WallpaperSpec | null => {
  const canvasWidth = Number(animation?.w);
  const canvasHeight = Number(animation?.h);
  const assets: Record<string, any>[] = Array.isArray(animation?.assets)
    ? animation.assets
    : [];

  const slots = new Map<number, SlotAssets>();
  const compLayers = new Map<string, LottieLayer[]>();
  for (const asset of assets) {
    if (Array.isArray(asset?.layers)) compLayers.set(String(asset.id), asset.layers);
    const filename = String(asset?.p ?? '').split('/').pop() ?? '';
    const matched = SLOT_FILENAME.exec(filename);
    if (!matched) continue;
    const kind = matched[1].toLowerCase() as keyof SlotAssets;
    const slotIndex = Number(matched[2]);
    const slot = slots.get(slotIndex) ?? {};
    slot[kind] = asset;
    slots.set(slotIndex, slot);
  }

  const spec: WallpaperSpec = {
    version: 0,
    layoutType: 0,
    frames: [],
    angles: [],
    customs: [],
  };

  const contentIndexes = [...slots.keys()]
    .filter((index) => Boolean(slots.get(index)?.content))
    .sort((a, b) => a - b);
  if (!contentIndexes.length) return spec;

  const isContiguous = contentIndexes.every((value, index) => value === index);
  if (!isContiguous) return null;
  if (!(canvasWidth > 0) || !(canvasHeight > 0)) return null;

  const rootLayers: LottieLayer[] = Array.isArray(animation?.layers)
    ? animation.layers
    : [];

  for (const slotIndex of contentIndexes) {
    const slot = slots.get(slotIndex) as SlotAssets;
    const content = slot.content as Record<string, any>;
    const chain = findImageLayerChain(
      String(content.id),
      rootLayers,
      compLayers,
      new Set<string>(),
    );
    if (!chain) return null;

    const { x, y, rotation } = accumulateChain(chain);
    const imageWidth = Number(content.w) || 0;
    const imageHeight = Number(content.h) || 0;
    const centerX = x + imageWidth / 2;
    const centerY = y + imageHeight / 2;

    // 宽高与中心 X 都按画布宽换算，只有中心 Y 按画布高
    const frame = [
      `w${roundTo2((centerX / canvasWidth) * 100)}`,
      `h${roundTo2((centerY / canvasHeight) * 100)}`,
      `w${roundTo2((imageWidth / canvasWidth) * 100)}`,
      `w${roundTo2((imageHeight / canvasWidth) * 100)}`,
    ].join(',');

    spec.frames.push(frame);
    spec.angles.push(roundTo2(rotation));
    spec.customs.push(Boolean(slot.mask));
  }

  return spec;
};
