/**
 * 完整版 libpag（wasm）的按需加载入口。
 *
 * 为什么不用 libpag-lite：lite 版没带矢量渲染引擎，只能播「BMP 预合成」的 pag，
 * 拿纯矢量导出的 pag 喂给它，PAGView.init 会直接抛
 * 「PAGFile has no BMP video sequence!」。控制中心的开关动画都是矢量的，
 * 所以这里换成完整版。（charging_animation 那边仍用 lite，没动。）
 *
 * 代价是 1.5MB wasm，所以用动态 import 切成单独 chunk：
 * 只有用户第一次点带动画的开关时才会去拉，首屏不受影响。
 * 整个页面共用一个 wasm 实例，PAGInit 只跑一次。
 */

/** PAGInit 返回的模块对象，类型从包里反推，不用手写 */
type PagRuntime = Awaited<ReturnType<typeof import('libpag').PAGInit>>;

/** 解出来的 pag 文件，wasm 对象，用完要 destroy */
export type PagFile = Awaited<ReturnType<PagRuntime['PAGFile']['load']>>;

/** 绑在某个 canvas 上的播放器，init 可能返回 undefined，这里剥掉 */
export type PagView = NonNullable<
  Awaited<ReturnType<PagRuntime['PAGView']['init']>>
>;

let runtimePromise: Promise<PagRuntime> | null = null;

export const loadPagRuntime = (): Promise<PagRuntime> => {
  if (!runtimePromise) {
    runtimePromise = import('libpag')
      .then(({ PAGInit }) =>
        // wasm 由 postinstall 的 scripts/copy-libpag-wasm.js 拷到 public/，
        // 路径需与 publicPath 一致，和 lottie_wallpaper 的 setWasmUrl 同一套
        PAGInit({ locateFile: () => '/libpag.wasm' }),
      )
      .catch((error) => {
        // 拉失败（断网 / wasm 404）后允许下次点击重试，不然一次失败就永久哑掉
        runtimePromise = null;
        throw error;
      });
  }
  return runtimePromise;
};
