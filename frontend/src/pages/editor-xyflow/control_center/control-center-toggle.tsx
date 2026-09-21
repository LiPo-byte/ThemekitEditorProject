import { PictureOutlined } from '@ant-design/icons';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { ControlCenterFileRole } from './asset-rules';
import { loadPagRuntime, type PagFile, type PagView } from './pagRuntime';

type SlotItem = {
  key: string;
  role?: ControlCenterFileRole;
  asset?: {
    source?: string;
    pagsource?: string;
    ext?: string;
  };
  width?: number;
  height?: number;
};

/** pag 播完没等到 onAnimationEnd 时的兜底时长 */
const FALLBACK_DURATION = 1500;
/** duration() 给的是微秒，再多留一点余量等最后一帧画完 */
const END_GUARD = 200;

/**
 * 播一遍就结束的 pag。只在用户点了开关的那一刻挂载，播完立刻卸载并 destroy，
 * 所以画布上最多同时存在一个 wasm 播放实例，不会被 10 个动画槽位拖垮。
 *
 * PAGFile 和 PAGView 都是 wasm 对象，得手动 destroy 释放，光靠 GC 收不掉。
 *
 * onAnimationEnd 万一不来（素材坏了、wasm 拉不到），除了监听事件还挂一个按
 * duration 算的定时器兜底，两边谁先到都走同一个收尾，免得格子卡在动画态上。
 */
const PagOnce: React.FC<{
  source: string;
  width: number;
  height: number;
  onDone: () => void;
}> = ({ source, width, height, onDone }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // onDone 每次渲染都是新函数，放进 ref 免得 effect 跟着重跑、动画从头再播
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let alive = true;
    // 放进对象而不是局部 let：await 之后赋值，cleanup 才能销毁「刚创建出来」的那份，
    // 否则卸载发生在 PAGFile.load / PAGView.init 期间，闭包里的 view/file 还是 null，泄漏
    const session: {
      view: PagView | null;
      file: PagFile | null;
      timer: ReturnType<typeof setTimeout> | null;
    } = { view: null, file: null, timer: null };

    const dispose = () => {
      if (session.timer) clearTimeout(session.timer);
      session.timer = null;
      session.view?.destroy();
      session.file?.destroy();
      session.view = null;
      session.file = null;
    };

    const finish = () => {
      if (!alive) return;
      alive = false;
      dispose();
      onDoneRef.current();
    };

    void (async () => {
      try {
        // wasm 和 pag 文件一起拉，第一次点会多等一个 1.5MB 的 wasm
        const [PAG, response] = await Promise.all([
          loadPagRuntime(),
          fetch(source),
        ]);
        if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
        const buffer = await response.arrayBuffer();
        if (!alive) return;
        if (!canvasRef.current) {
          // 组件还在但 canvas 没了，得把父组件的 playing 清掉，否则再点没反应
          finish();
          return;
        }
        session.file = await PAG.PAGFile.load(buffer);
        if (!alive) {
          dispose();
          return;
        }
        if (!canvasRef.current) {
          dispose();
          finish();
          return;
        }
        session.view =
          (await PAG.PAGView.init(session.file, canvasRef.current)) ?? null;
        if (!session.view) throw new Error('PAGView init failed');
        if (!alive) {
          dispose();
          return;
        }
        session.view.setRepeatCount(1);
        session.view.addListener('onAnimationEnd', finish);
        const duration = session.view.duration();
        session.timer = setTimeout(
          finish,
          (duration > 0 ? duration / 1000 : FALLBACK_DURATION) + END_GUARD,
        );
        await session.view.play();
      } catch (error) {
        // 拉不到或者解不了就直接落到目标静态图，不把开关卡住
        console.warn('control center pag 预览失败', error);
        if (alive) finish();
        else dispose();
      }
    })();

    return () => {
      alive = false;
      dispose();
    };
  }, [source]);

  return (
    <canvas
      ref={canvasRef}
      // 不给宽高属性的话 canvas 默认 300x150，pag 会被拉变形
      width={width}
      height={height}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};

/**
 * 双态槽位的画布格子：点素材本身在关闭态（base）和开启态（select）之间切换。
 *
 * 槽位里带 open / close 两个 pag 的（animated_toggle），点击时先把对应的过渡动画
 * 播一遍，播完再落到目标静态图；没有 pag 的（toggle）直接切图。
 * 动画播放期间不接受再次点击，免得两个 pag 叠在一起播。
 *
 * 切换只是编辑器里的预览态，不写回 config，保存结果和点之前一样。
 */
export default function ControlCenterToggle(props: any) {
  const data = props.data ?? {};
  const items = (data.items ?? []) as SlotItem[];
  const [on, setOn] = useState(false);
  /** 正在播的过渡动画，null 表示当前显示静态图 */
  const [playing, setPlaying] = useState<{
    role: 'open' | 'close';
    source: string;
  } | null>(null);

  const mediaWidth =
    Number(data.mediaWidth) > 0 ? Number(data.mediaWidth) : 100;
  const mediaHeight =
    Number(data.mediaHeight) > 0 ? Number(data.mediaHeight) : 100;
  const labelHeight =
    Number(data.fileNameHeight) > 0 ? Number(data.fileNameHeight) : 40;

  const findByRole = (role: ControlCenterFileRole) =>
    items.find((item) => item.role === role);

  const base = findByRole('base') ?? items[0];
  const select = findByRole('select');
  // pag 的 url 在 pagsource 而不是 source 上
  const openSource = findByRole('open')?.asset?.pagsource ?? '';
  const closeSource = findByRole('close')?.asset?.pagsource ?? '';
  const hasAnimation = Boolean(openSource || closeSource);

  const current = on && select ? select : base;
  const source = current?.asset?.source ?? '';
  // 默认 config 里 select 条目一定在，空 source 也算「有条目」；没图就点不动
  const switchable = Boolean(select?.asset?.source);

  /** 当前画的是哪一个文件：播动画时是 open/close 的 pag，否则是静态的 base/select */
  const activeItem = playing ? findByRole(playing.role) : current;
  // 名字取当前文件自己的 asset key（带 _select / _open 后缀的那个），
  // 不然切了图但底下还写着 base 那个名字，对不出现在画的是哪一个文件
  const activeName = activeItem?.key ?? data.name ?? '';

  const handleClick = () => {
    if (!switchable || playing) return;
    const next = !on;
    const transition = next ? openSource : closeSource;
    // 缺这一段动画（或者本来就是无动画槽位）就直接切静态图
    if (!transition) {
      setOn(next);
      return;
    }
    setPlaying({ role: next ? 'open' : 'close', source: transition });
  };

  const finishTransition = (role: 'open' | 'close') => {
    setOn(role === 'open');
    setPlaying(null);
  };

  const renderMedia = () => {
    if (playing) {
      return (
        <PagOnce
          key={playing.source}
          source={playing.source}
          width={mediaWidth}
          height={mediaHeight}
          onDone={() => finishTransition(playing.role)}
        />
      );
    }
    if (source) {
      return (
        <img
          src={source}
          alt=""
          // 上传的图和 config 里的宽高对不上时撑满格子，不溢出到邻居身上
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      );
    }
    return (
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          color: 'rgba(0, 0, 0, 0.25)',
        }}
      >
        <PictureOutlined style={{ fontSize: 28 }} />
        <span style={{ fontSize: 12 }}>暂无资源</span>
      </span>
    );
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
      }}
    >
      <button
        type="button"
        className="nodrag nopan"
        // 底下那行只放文件名，中文名挂在 title 上，两个都能认
        title={
          switchable
            ? `${data.label ?? ''} · ${activeName}（点击${hasAnimation ? '播放切换动画' : '切换开关'}）`
            : `${data.label ?? ''} · ${activeName}`
        }
        onClick={handleClick}
        style={{
          width: mediaWidth,
          height: mediaHeight,
          flex: '0 0 auto',
          position: 'relative',
          padding: 0,
          border: 'none',
          background: 'transparent',
          borderRadius: 4,
          overflow: 'hidden',
          cursor: switchable && !playing ? 'pointer' : 'default',
        }}
      >
        {renderMedia()}
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            padding: '0 4px',
            borderRadius: 2,
            fontSize: 11,
            lineHeight: '16px',
            color: '#ffffff',
            background: on && select ? '#1677ff' : 'rgba(0, 0, 0, 0.45)',
          }}
        >
          {playing
            ? '▶'
            : `${on && select ? '开' : '关'}${hasAnimation ? ' ▶' : ''}`}
        </span>
      </button>
      <div
        title={`${data.label ?? ''} · ${activeName}`}
        style={{
          width: '100%',
          height: labelHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          color: 'rgba(0, 0, 0, 0.65)',
          textAlign: 'center',
          padding: '0 4px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {activeName}
      </div>
    </div>
  );
}
