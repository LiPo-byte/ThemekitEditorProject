/**
 * 把 libpag 的 wasm 从 node_modules 拷进 public/
 * 由 postinstall 触发，产物不入库（见 .gitignore），与 copy-lottie-wasm.js 同一套做法
 *
 * 不这么做的话，PAGInit 运行时会按 script 所在目录去拉 libpag.wasm，
 * 打包后路径对不上直接 404。拷贝而不是手动放一份，是为了让 wasm 版本始终跟着
 * package.json 里的依赖版本走 —— 两者版本不一致会直接崩。
 *
 * 注意 libpag 的版本要锁死：npm 上 latest（4.4.74）只发了 TS 源码、没有 lib 和 wasm，
 * 带构建产物的是 4.5.x，所以 package.json 里写的是精确版本而不是 ^。
 */

const fs = require('node:fs');
const path = require('node:path');

const TARGET = path.join(__dirname, '..', 'public', 'libpag.wasm');

function main() {
  let source;
  try {
    // 从 package.json 反推包根目录：libpag 的 exports 不放行 .wasm，
    // 直接 require.resolve('libpag/lib/libpag.wasm') 会被挡掉
    source = path.join(
      path.dirname(require.resolve('libpag/package.json')),
      'lib',
      'libpag.wasm',
    );
    if (!fs.existsSync(source)) throw new Error('wasm not found');
  } catch {
    // 依赖没装齐时不要让整个 install 失败，缺文件只会让 pag 预览不可用
    console.warn('⚠ 未找到 libpag 的 wasm，跳过拷贝');
    return;
  }

  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.copyFileSync(source, TARGET);
  console.log('✓ 已拷贝 libpag.wasm 到 public/');
}

main();
