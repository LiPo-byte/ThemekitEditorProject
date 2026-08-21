/**
 * 把 dotlottie 播放器的 wasm 从 node_modules 拷进 public/
 * 由 postinstall 触发，产物不入库（见 .gitignore）
 *
 * 不这么做的话，@lottiefiles/dotlottie-web 运行时会去 jsdelivr / unpkg 拉 wasm，
 * 内网或离线环境直接不可用。拷贝而不是手动放一份，是为了让 wasm 版本始终跟着
 * package.json 里的依赖版本走 —— 两者版本不一致会直接崩。
 */

const fs = require('node:fs');
const path = require('node:path');

const TARGET = path.join(__dirname, '..', 'public', 'dotlottie-player.wasm');

function main() {
  let source;
  try {
    source = require.resolve('@lottiefiles/dotlottie-web/dotlottie-player.wasm');
  } catch {
    // 依赖没装齐时不要让整个 install 失败，缺文件只会退回 CDN 加载
    console.warn('⚠ 未找到 @lottiefiles/dotlottie-web 的 wasm，跳过拷贝');
    return;
  }

  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.copyFileSync(source, TARGET);
  console.log('✓ 已拷贝 dotlottie-player.wasm 到 public/');
}

main();
