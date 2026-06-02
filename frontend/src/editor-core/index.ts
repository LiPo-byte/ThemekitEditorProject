import Konva from 'konva';

/** 96 DPI 下 1pt = 4/3 px；编辑器内部统一用 px 喂给 Konva，对外尺寸接口可以用 pt 表达 */
const PT_TO_PX = 4 / 3;
const pt = (n: number) => n * PT_TO_PX;

export interface EditorCoreOptions {
  width?: number;
  height?: number;
  /** 最小缩放，默认 0.1 */
  minScale?: number;
  /** 最大缩放，默认 8 */
  maxScale?: number;
  /** 每次滚轮的缩放倍率，默认 1.05 */
  zoomStep?: number;
  /** 主题，默认 'light'；当前影响背景网格颜色 */
  theme?: EditorTheme;
}

const WIDGET_SIZE:any = {
  small: {
    width: 155,
    height: 155,
  },
  medium: {
    width: 329,
    height: 155,
  },
  large: {
    width: 329,
    height: 345,
  },
}

const CONFIG_SIZE_MAP:any = {
  1: 'small',
  2: 'medium',
  3: 'large'
}

const WIDGET_BORDER_RADIUS = 22;

const WIDGET_GAP = 200;
const SELECTION_DRAG_THRESHOLD = 2;
const SELECTED_NODE_BOX_COLOR = '#fbbf24';
const SELECTED_NODE_BOX_WIDTH = 0.5;

export type EditorTheme = 'light' | 'dark';


/**
 * 编辑器核心
 * - 三层结构：背景层（网格/参考线）/ 内容层（图层节点）/ 浮层（选中框/控制点）
 * - 仅提供节点增删，后续按需扩展
 */
export class EditorCore {
  readonly stage: Konva.Stage;
  readonly bgLayer: Konva.Layer;
  readonly contentLayer: Konva.Layer;
  readonly overlayLayer: Konva.Layer;
  private cWidth: number;
  private cHeight: number;
  private readonly minScale: number;
  private readonly maxScale: number;
  private readonly zoomStep: number;
  private shiftKeyDownBoolean: boolean;
  private theme: EditorTheme;
  // private widgetBorderRadius: number;
  private widgetsNodes: any[];
  private transformer!: Konva.Transformer;
  private selectionRectangle: Konva.Rect;
  private selectionStartPoint: { x: number; y: number } | null = null;
  private isSelecting = false;
  private isShiftPressed = false;
  private suppressNextStageClick = false;
  private selectedNodes: Konva.Node[] = [];
  private selectionBoxes = new Map<Konva.Node, Konva.Rect>();
  /** 选中变化订阅器（供 React 浮层监听） */
  private selectionListeners = new Set<(node: Konva.Node[] | null) => void>();
  /** 布局变化订阅器（stage 缩放/平移、transformer 变换时触发，用于 React 浮层重定位） */
  private layoutListeners = new Set<() => void>();

  constructor(containerId: string, options: EditorCoreOptions = {}) {
    const el = document.getElementById(containerId);

    if (!el) {
      throw new Error(`[EditorCore] container #${containerId} not found`);
    }
    const parent = el.parentElement;
    if (!parent) {
      throw new Error(`[EditorCore] container #${containerId} has no parent`);
    }
    const width = options.width ?? parent.clientWidth;
    const height = options.height ?? parent.clientHeight;


    this.stage = new Konva.Stage({
      container: containerId,
      width,
      height,
      draggable: true,
    });

    this.bgLayer = new Konva.Layer({ listening: false });
    this.contentLayer = new Konva.Layer();
    this.overlayLayer = new Konva.Layer();
    this.cWidth = width;
    this.cHeight = height;
    this.shiftKeyDownBoolean = false;
    this.minScale = options.minScale ?? 0.1;
    this.maxScale = options.maxScale ?? 8;
    this.zoomStep = options.zoomStep ?? 1.05;
    this.theme = options.theme ?? 'light';
    this.widgetsNodes = [];

    this.stage.add(this.bgLayer);
    this.stage.add(this.contentLayer);
    this.stage.add(this.overlayLayer);

    this.transformer = new Konva.Transformer({
      rotateEnabled: false,
      ignoreStroke: true,
      keepRatio: true,
      enabledAnchors: [],
      borderStroke: '#1677ff',
      borderStrokeWidth: 1,
      // 添加锚点
      anchorFill: '#1677ff',
      anchorStroke: '#ffffff',
      anchorStrokeWidth: 0.5,
      anchorSize: 5,
      // 使所有锚点看起来像圆形
      anchorCornerRadius: 50,
    });
    // 添加一个新功能，让我们添加绘制选择矩形的能力
    this.selectionRectangle = new Konva.Rect({
      fill: 'rgba(0,0,255,0.5)',
      visible: false,
    });

    this.overlayLayer.add(this.transformer);
    this.overlayLayer.add(this.selectionRectangle);

    this.initBgLayer();
    this.bindEvents();
  }


  private bindEvents() {
    this.stage.on('wheel', this.handleWheel);
    this.stage.on('click tap', this.handleStageClick);
    // stage 任何位置/缩放变化（含 wheel、stage 拖动）→ 通知浮层重定位
    this.stage.on('xChange yChange scaleXChange scaleYChange', this.emitLayoutChange);
    window.addEventListener('keydown', this.handleWindowKeyDown);
    window.addEventListener('keyup', this.handleWindowKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
    // 通过 transformer 锚点变换选中节点时同步重定位
    this.transformer.on('transform', this.emitLayoutChange);
  }

  private handleWindowKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Shift' || this.shiftKeyDownBoolean) return;
    this.shiftKeyDownBoolean = true;
    e.preventDefault();
  };

  private handleWindowKeyUp = (e: KeyboardEvent) => {
    if (e.key !== 'Shift') return;
    this.shiftKeyDownBoolean = false;
    e.preventDefault();
  };

  private handleWindowBlur = () => {
    this.shiftKeyDownBoolean = false;
    this.stage.draggable(!this.isSelecting);
  };

  /** 点击空白/其他元素取消选中；点中带 selected:true 的节点（或其后代）选中之 */
  private handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const isMultiSelect = this.shiftKeyDownBoolean;
    // 点 stage 自身（真正的空白）→ 取消选中
    if (e.target === this.stage) {
      if (isMultiSelect) return;
      this.deselect();
      return;
    }
    // 自身或祖先里找第一个标记 selected 的节点
    let node: Konva.Node | null = e.target;
    while (node && node !== this.stage) {
      if (node.getAttr('selected') === true) {
        if (isMultiSelect) {
          this.appendSelection(node);
          return;
        }
        this.select(node);
        return;
      }
      node = node.getParent();
    }
    if (isMultiSelect) return;
    this.deselect();
  };

  /** Shift + 点击：追加到当前选中集合 */
  private appendSelection(node: Konva.Node) {
    if (this.selectedNodes.includes(node)) return;
    this.setSelectedNodes([...this.selectedNodes, node]);
  }

  /** 选中节点，挂上 Transformer 控制点 */
  select(node: Konva.Node) {
    if (this.selectedNodes.length === 1 && this.selectedNodes[0] === node) return;
    this.setSelectedNodes([node]);
  }

  /** 取消选中 */
  deselect() {
    if (this.selectedNodes.length === 0) return;
    this.setSelectedNodes([]);
  }

  private syncSelectionBoxes() {
    const shouldShowBoxes = this.selectedNodes.length > 1;
    const nextSet = shouldShowBoxes ? new Set(this.selectedNodes) : new Set<Konva.Node>();
    this.selectionBoxes.forEach((box, node) => {
      if (nextSet.has(node)) return;
      box.destroy();
      this.selectionBoxes.delete(node);
    });
    if (!shouldShowBoxes) {
      this.transformer.moveToTop();
      this.selectionRectangle.moveToTop();
      this.overlayLayer.batchDraw();
      return;
    }
    this.selectedNodes.forEach((node) => {
      const rect = node.getClientRect({ relativeTo: this.stage });
      let box = this.selectionBoxes.get(node);
      if (!box) {
        box = new Konva.Rect({
          listening: false,
          fillEnabled: false,
          stroke: SELECTED_NODE_BOX_COLOR,
          strokeWidth: SELECTED_NODE_BOX_WIDTH,
        });
        this.selectionBoxes.set(node, box);
        this.overlayLayer.add(box);
      }
      box.setAttrs({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
    });
    this.transformer.moveToTop();
    this.selectionRectangle.moveToTop();
    this.overlayLayer.batchDraw();
  }

  private setSelectedNodes(nextNodes: Konva.Node[]) {
    const normalizedNodes = this.normalizeSelectedNodes(nextNodes);
    const prevNodes = this.selectedNodes;
    const unchanged =
      prevNodes.length === normalizedNodes.length &&
      prevNodes.every((node, idx) => node === normalizedNodes[idx]);
    if (unchanged) return;
    this.selectedNodes = normalizedNodes;
    this.transformer.nodes(this.selectedNodes);
    this.syncSelectionBoxes();
    this.emitSelectionChange();
  }

  /**
   * 规范化选中集合：
   * - 同一节点去重
   * - 祖先节点优先；若祖先已选则忽略后代
   * - 选中新祖先时，移除已存在的后代
   */
  private normalizeSelectedNodes(nodes: Konva.Node[]): Konva.Node[] {
    const normalized: Konva.Node[] = [];
    nodes.forEach((node) => {
      if (normalized.includes(node)) return;
      const hasSelectedAncestor = normalized.some((selectedNode) =>
        this.isAncestorNode(selectedNode, node),
      );
      if (hasSelectedAncestor) return;
      const filteredNodes = normalized.filter(
        (selectedNode) => !this.isAncestorNode(node, selectedNode),
      );
      filteredNodes.push(node);
      normalized.splice(0, normalized.length, ...filteredNodes);
    });
    return normalized;
  }

  /** 判断 ancestor 是否是 node 的祖先 */
  private isAncestorNode(ancestor: Konva.Node, node: Konva.Node): boolean {
    let parent = node.getParent();
    while (parent) {
      if (parent === ancestor) return true;
      if (parent === this.stage) return false;
      parent = parent.getParent();
    }
    return false;
  }

  /** 订阅选中变化；返回退订函数 */
  onSelectionChange(cb: (node: Konva.Node[] | null) => void): () => void {
    this.selectionListeners.add(cb);
    return () => {
      this.selectionListeners.delete(cb);
    };
  }

  /** 订阅布局变化（画布缩放/平移、节点变换）；返回退订函数 */
  onLayoutChange(cb: () => void): () => void {
    this.layoutListeners.add(cb);
    return () => {
      this.layoutListeners.delete(cb);
    };
  }

  /**
   * 选中节点在 stage 容器坐标系下的 bbox（屏幕坐标，单位 px）。
   * 已经包含 stage 的 scale/translate，浮层用 left/top 直接消费即可。
   */
  getSelectionScreenRect(): { x: number; y: number; width: number; height: number } | null {
    if (!this.selectedNodes.length) {
      return null;
    }
    // 不直接用 transformer 的 bbox，避免把锚点/边框算进来；改为合并选中节点真实包围盒
    const nodeRects = this.selectedNodes.map((node) =>
      node.getClientRect({ relativeTo: this.stage }),
    );
    const x = Math.min(...nodeRects.map((item) => item.x));
    const y = Math.min(...nodeRects.map((item) => item.y));
    const right = Math.max(...nodeRects.map((item) => item.x + item.width));
    const bottom = Math.max(...nodeRects.map((item) => item.y + item.height));
    const scaleX = this.stage.scaleX();
    const scaleY = this.stage.scaleY();
    return {
      x: x * scaleX + this.stage.x(),
      y: y * scaleY + this.stage.y(),
      width: (right - x) * scaleX,
      height: (bottom - y) * scaleY,
    };
  }

  private emitSelectionChange = () => {
    const selectNodes = this.getSelectedNodes();
    this.selectionListeners.forEach((cb) => cb(selectNodes));
  };

  private emitLayoutChange = () => {
    this.syncSelectionBoxes();
    this.layoutListeners.forEach((cb) => cb());
  };

  /** 当前全部选中节点 */
  getSelectedNodes(): Konva.Node[] {
    return [...this.selectedNodes];
  }

  /** 外部手动修改节点几何（如字体/内容）后，主动刷新选框与浮层定位 */
  refreshSelectionLayout() {
    this.transformer.forceUpdate();
    this.emitLayoutChange();
  }

  /** 公开缩放：放大一步（可传锚点；不传则按当前可视区域中心） */
  zoomIn(pointer?: { x: number; y: number }) {
    this.applyZoom(true, pointer ?? this.getViewportCenter());
  }

  /** 公开缩放：缩小一步（可传锚点；不传则按当前可视区域中心） */
  zoomOut(pointer?: { x: number; y: number }) {
    this.applyZoom(false, pointer ?? this.getViewportCenter());
  }

  // 切换到全局视角，把所有节点显示出来，居中
  fitView() {
    let hasVisibleNode = false;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    this.contentLayer.getChildren().forEach((node) => {
      if (!node.isVisible()) return;
      hasVisibleNode = true;
      const rect = node.getClientRect({ relativeTo: this.stage });
      if (rect.x < minX) minX = rect.x;
      if (rect.y < minY) minY = rect.y;
      if (rect.x + rect.width > maxX) maxX = rect.x + rect.width;
      if (rect.y + rect.height > maxY) maxY = rect.y + rect.height;
    });

    if (!hasVisibleNode) return;

    const boundsWidth = Math.max(1, maxX - minX);
    const boundsHeight = Math.max(1, maxY - minY);

    const stage = this.stage;
    const padding = 40;
    const availableWidth = Math.max(1, stage.width() - padding * 2);
    const availableHeight = Math.max(1, stage.height() - padding * 2);
    let targetScale = Math.min(availableWidth / boundsWidth, availableHeight / boundsHeight);
    targetScale = Math.min(this.maxScale, Math.max(this.minScale, targetScale));

    const boundsCenterX = minX + boundsWidth / 2;
    const boundsCenterY = minY + boundsHeight / 2;
    const viewportCenter = this.getViewportCenter();

    stage.scale({ x: targetScale, y: targetScale });
    stage.position({
      x: viewportCenter.x - boundsCenterX * targetScale,
      y: viewportCenter.y - boundsCenterY * targetScale,
    });
    stage.batchDraw();
  }

  /** 当前可视区域中心点（屏幕坐标） */
  private getViewportCenter() {
    return { x: this.stage.width() / 2, y: this.stage.height() / 2 };
  }

  /** 统一缩放计算（滚轮/按钮复用） */
  private applyZoom(zoomIn: boolean, pointer: { x: number; y: number }) {
    const stage = this.stage;
    const oldScale = stage.scaleX();
    const worldPos = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    let newScale = zoomIn ? oldScale * this.zoomStep : oldScale / this.zoomStep;
    newScale = Math.min(this.maxScale, Math.max(this.minScale, newScale));
    if (newScale === oldScale) return;
    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: pointer.x - worldPos.x * newScale,
      y: pointer.y - worldPos.y * newScale,
    });
  }

  

  /**
   * 滚轮缩放：以鼠标所在位置为锚点。
   * - 普通鼠标滚轮：上滚放大、下滚缩小
   * - Mac 触控板捏合：浏览器以 wheel + ctrlKey 派发，等价行为
   */
  private handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = this.stage;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    this.applyZoom(e.evt.deltaY < 0, pointer);
  };

  /** 添加节点到内容层 */
  addNode(node: Konva.Group | Konva.Shape) {
    this.contentLayer.add(node);
  }

  addWidget(data: any) {
    // 网格布局：每行 PER_ROW 个，超出换行
    const PER_ROW = 4;

    const idx = this.widgetsNodes.length;
    const col = idx % PER_ROW;
    const row = Math.floor(idx / PER_ROW);

    let x = 0;
    let y = 0;
    if (col > 0) {
      // 同一行：跟在前一个右边
      const prev = this.widgetsNodes[idx - 1];
      x = prev.x + prev.width + WIDGET_GAP;
      y = prev.y;
    } else if (row > 0) {
      // 新一行：x 归零，y 跳到上一行最大底部 + gap
      const prevRowStart = (row - 1) * PER_ROW;
      const prevRow = this.widgetsNodes.slice(prevRowStart, prevRowStart + PER_ROW);
      const maxBottom = Math.max(...prevRow.map((w: any) => w.y + w.height));
      x = 0;
      y = maxBottom + WIDGET_GAP;
    }

    const time = new Time({ x, y, data });
    this.widgetsNodes.push(time);
    if (time.node) {
      this.contentLayer.add(time.node);
    }
  }


  /** 移除节点（自动从所属父级解绑），并刷新所在层 */
  removeNode(node: Konva.Node) {
    const layer = node.getLayer();
    const idx = this.selectedNodes.indexOf(node);
    if (idx >= 0) {
      this.setSelectedNodes(this.selectedNodes.filter((n) => n !== node));
    }
    node.remove();
    layer?.batchDraw();
  }

  initBgLayer() {
    // React Flow Dots 风格点阵：单 Shape + sceneFunc 自绘，避免大量节点开销
    const baseGap = 30;
    const minScreenGap = 8;
    const maxScreenGap = 28;
    const dotRadiusPx = 1;
    const grid = new Konva.Shape({
      listening: false,
      perfectDrawEnabled: false,
      sceneFunc: (ctx) => {
        const stage = this.stage;
        const scale = stage.scaleX();
        // 按缩放层级切换间距：缩小时变稀、放大时变密（2 的幂档位）
        let gap = baseGap;
        while (gap * scale < minScreenGap) {
          gap *= 2;
        }
        while (gap * scale > maxScreenGap && gap > 2) {
          gap /= 2;
        }

        const pos = stage.position();
        // 可视区域 → 世界坐标
        const x1 = -pos.x / scale;
        const y1 = -pos.y / scale;
        const x2 = (stage.width() - pos.x) / scale;
        const y2 = (stage.height() - pos.y) / scale;
        // 对齐到网格起点（向下取整到 gap 倍数）
        const startX = Math.floor(x1 / gap) * gap;
        const startY = Math.floor(y1 / gap) * gap;

        const radius = dotRadiusPx / scale;
        ctx.fillStyle = this.getGridDotColor();
        ctx.beginPath();
        for (let x = startX; x <= x2; x += gap) {
          for (let y = startY; y <= y2; y += gap) {
            // moveTo 避免与上一段 path 意外连线
            ctx.moveTo(x + radius, y);
            ctx.arc(x, y, radius, 0, Math.PI * 2);
          }
        }
        ctx.fill();
      },
    });
    this.bgLayer.add(grid);
  }

  private getGridDotColor() {
    return this.theme === 'dark' ? '#3a3a3a' : '#ccc';
  }

  /** 当前主题 */
  getTheme(): EditorTheme {
    return this.theme;
  }

  /** 运行时切换 light/dark */
  setTheme(theme: EditorTheme) {
    if (this.theme === theme) return;
    this.theme = theme;
    this.bgLayer.destroyChildren();
    this.initBgLayer();
    this.bgLayer.batchDraw();
  }

  

  /** 销毁 Stage，释放 Konva 资源；组件卸载时调用 */
  destroy() {
    this.stage.off('wheel', this.handleWheel);
    this.stage.off('click tap', this.handleStageClick);
    this.stage.off('xChange yChange scaleXChange scaleYChange', this.emitLayoutChange);
    window.removeEventListener('keydown', this.handleWindowKeyDown);
    window.removeEventListener('keyup', this.handleWindowKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);

    this.transformer.off('transform', this.emitLayoutChange);

    this.selectionListeners.clear();
    this.layoutListeners.clear();

    this.stage.destroy();
  }
}

class Widget {
  constructor() {}
}

type WidgetLayoutCtx = {
  w: number;
  h: number;
  padding: number;
  time: Konva.Text;
  day: Konva.Text;
  date: Konva.Text;
};
type WidgetLayoutFn = (ctx: WidgetLayoutCtx) => void;

class Time {
  public width: number;
  public height: number;
  public x: number;
  public y: number;
  public dataJson: any;
  // public system: string;
  public gap: number;
  public node: Konva.Group | null;

  /** 布局策略表：layoutType (number) -> 摆位函数；新增布局只需要加一个 key */
  private layoutFns: Record<number, WidgetLayoutFn> = {
    // 0：上下堆叠 —— time / day / date 顺序从上往下
    0: ({ w, padding, time, day, date }) => {
      let cy = padding;
      [time, day, date].forEach((n) => {
        n.x(padding);
        n.width(w - padding * 2);
        n.y(cy);
        cy += n.height() + pt(4);
      });
    },
    // 1：上方大时间 + 下方一行 day | date
    1: ({ w, padding, time, day, date }) => {
      time.x(padding);
      time.y(padding);
      time.width(w - padding * 2);
      const halfW = (w - padding * 2) / 2;
      const bottomY = padding + time.height() + pt(4);
      day.x(padding);
      day.y(bottomY);
      day.width(halfW);
      date.x(padding + halfW);
      date.y(bottomY);
      date.width(halfW);
    },
    // 2：整组垂直水平居中
    2: ({ w, h, padding, time, day, date }) => {
      const gap = pt(4);
      const totalH = time.height() + day.height() + date.height() + gap * 2;
      let cy = (h - totalH) / 2;
      [time, day, date].forEach((n) => {
        n.x(padding);
        // n.width(w - padding * 2);
        n.y(cy);
        cy += n.height() + gap;
      });
    },
    // 3：左大时间（垂直居中）+ 右上 day / 右下 date
    3: ({ w, h, padding, time, day, date }) => {
      const innerW = w - padding * 2;
      const leftW = innerW * 0.55;
      const colGap = pt(8);
      const rightX = padding + leftW + colGap;
      const rightW = innerW - leftW - colGap;
      time.x(padding);
      time.width(leftW);
      time.y((h - time.height()) / 2);
      day.x(rightX);
      day.y(padding);
      day.width(rightW);
      date.x(rightX);
      date.y(padding + day.height() + pt(2));
      date.width(rightW);
    },
  };

  constructor(options: any) {
    const { x, y, data } = options
    this.width = 0;
    this.height = 0;
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.dataJson = data;
    this.gap = 50;
    this.node = null;
    this.init();
  }

  init() {
    const { sizes } = this.dataJson;
    const group = new Konva.Group({ x: this.x, y: this.y, selected: true });
    let cursorX = 0;          // 下一个 item 的起始 x
    let cursorY = 0;
    let totalWidth = 0;       // 整个 group 的宽度
    sizes.forEach((node_data: any, idx: number, arr: any[]) => {
      let { size, name, padding, time, day, date } = node_data;
      const sizeCfg = WIDGET_SIZE[CONFIG_SIZE_MAP[size]];
      const widthPx = pt(sizeCfg.width);
      const heightPx = pt(sizeCfg.height);
      const groupItem = new Konva.Group({ x: cursorX, y: 0, selected: true });

      const title = this.createTitle({ x: pt(5), y: heightPx + 10, name });
      const rect = this.createRect({ w: widthPx, h: heightPx });

      const timeNode = this.createDes({ ...time, text: '10:09' });
      const dayNode = this.createDes({ ...day, text: 'Wednesday' });
      const dateNode = this.createDes({ ...date, text: 'March 23' });
      const bgImage = this.createBgImage({
        w: widthPx,
        h: heightPx,
        src: 'http://localhost:5173/mock/widgets_' + CONFIG_SIZE_MAP[size] +'_time.jpg'
      })

      const layoutType: number = node_data.layoutType ?? 2;
      const layoutFn = this.layoutFns[layoutType];
      if (layoutFn) {
        layoutFn({
          w: widthPx,
          h: heightPx,
          padding: pt(padding ?? 0),
          time: timeNode,
          day: dayNode,
          date: dateNode,
        });
      } else {
        console.warn('[Time] unknown layoutType:', layoutType);
      }

      groupItem.add(rect, bgImage, title, timeNode, dayNode, dateNode);
      group.add(groupItem);
      cursorX += widthPx + this.gap;
    });
    const bbox = group.getClientRect({ skipTransform: true });
    cursorX = 0;          // 下一个 item 的起始 x
    cursorY = bbox.height + this.gap;
    sizes.forEach((node_data: any, idx: number, arr: any[]) => {
      let { size, name, padding, time, day, date } = node_data;
      const sizeCfg = WIDGET_SIZE[CONFIG_SIZE_MAP[size]];
      const widthPx = pt(sizeCfg.width);
      const heightPx = pt(sizeCfg.height);
      const groupItem = new Konva.Group({ x: cursorX, y: cursorY, selected: true });

      const title = this.createTitle({ x: pt(5), y: heightPx + 10, name });
      const rect = this.createRect({ w: widthPx, h: heightPx });

      const timeNode = this.createDes({ ...time, text: '10:09' });
      const dayNode = this.createDes({ ...day, text: 'Wednesday' });
      const dateNode = this.createDes({ ...date, text: 'March 23' });
      const bgImage = this.createBgImage({
        w: widthPx,
        h: heightPx,
        src: 'http://localhost:5173/mock/widgets_' + CONFIG_SIZE_MAP[size] +'_time.jpg'
      })

      const layoutType: number = node_data.layoutType ?? 2;
      const layoutFn = this.layoutFns[layoutType];
      if (layoutFn) {
        layoutFn({
          w: widthPx,
          h: heightPx,
          padding: pt(padding ?? 0),
          time: timeNode,
          day: dayNode,
          date: dateNode,
        });
      } else {
        console.warn('[Time] unknown layoutType:', layoutType);
      }

      // add 顺序决定 zIndex：rect 底色 → bgImage 盖在白底之上 → 文字在最上层
      groupItem.add(rect, bgImage, title, timeNode, dayNode, dateNode);
      group.add(groupItem);
      cursorX += widthPx + this.gap;
      totalWidth += widthPx + (idx < arr.length - 1 ? this.gap : 0); // 末尾不算 gap
    });

    // 加完所有 widget 后重算一次完整 bbox（覆盖两行）
    const fullBbox = group.getClientRect({ skipTransform: true });
    // 比 widget 群外扩 pad px，视觉留白
    const pad = 40;
    // #0ea5e9
    // #a78bfa
    // #f9a8d4
    // #fbbf24
    const bg = new Konva.Rect({
      x: fullBbox.x - pad,
      y: fullBbox.y - pad,
      width: fullBbox.width + pad * 2,
      height: fullBbox.height + pad * 2,
      fill: '#10b981', // 薄荷绿；想换色见下方 BG_PALETTE
      opacity: 0.1,
      cornerRadius: pt(3),
    });
    group.add(bg);
    bg.moveToBottom(); // 置底，不挡 widget

    // 包含背景边距后的总尺寸
    group.width(fullBbox.width + pad * 2);
    group.height(fullBbox.height + pad * 2);
    this.width = fullBbox.width + pad * 2;
    this.height = fullBbox.height + pad * 2;
    this.node = group;
  }

  createTitle(params: any) {
    const { x, y, name } = params;
    const title = new Konva.Text({
      x,
      y,
      text: name,
      fontSize: pt(10),
      fontFamily: 'Calibri',
      fill: 'green',
      selected: true,
    });
    return title;
  }
  createRect(params: any) {
    const { x = 0, y = 0, w, h } = params;
    const rect = new Konva.Rect({
      x: x,
      y: y,
      width: w,
      height: h,
      fill: '#ffffff',
      cornerRadius: pt(WIDGET_BORDER_RADIUS),
    });
    return rect;
  }
  /** 只负责造节点，不负责定位（定位交给 layoutFns） */
  createDes(params: any) {
    const { alpha, textColor, textHeight, textSize, font, text } = params;
    return new Konva.Text({
      text,
      fontSize: pt(textSize),
      selected: true,
      fill: textColor,
      opacity: alpha,
      align: 'center',
      verticalAlign: 'middle',
      height: pt(textHeight),
      fontFamily: font,
    });
  }

  createBgImage(params: any) {
    const { src, w, h } = params;
    const imageObj = new Image();
    imageObj.crossOrigin = 'anonymous'; // 之后想 toDataURL 导出时避免污染 canvas
    const radius = pt(WIDGET_BORDER_RADIUS);
    // 用 Shape + sceneFunc 自绘：先 clip 一个圆角矩形再 drawImage，让背景图带圆角
    const bg = new Konva.Shape({
      x: 0,
      y: 0,
      width: w,
      height: h,
      listening: false, // 背景不响应事件
      selected: true,
      sceneFunc: (ctx) => {
        if (!imageObj.complete || imageObj.naturalWidth === 0) return;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(w - radius, 0);
        ctx.quadraticCurveTo(w, 0, w, radius);
        ctx.lineTo(w, h - radius);
        ctx.quadraticCurveTo(w, h, w - radius, h);
        ctx.lineTo(radius, h);
        ctx.quadraticCurveTo(0, h, 0, h - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.clip();
        // 直接拉伸铺满父元素（不保持宽高比）
        ctx.drawImage(imageObj, 0, 0, w, h);
      },
    });
    imageObj.onload = () => bg.getLayer()?.batchDraw();
    imageObj.onerror = () => console.warn('[bgImage] load fail:', imageObj.src);
    imageObj.src = src ?? 'http://localhost:5173/mock/widgets_large_time.jpg';
    return bg;
  }
}

// export default EditorCore;

let core: EditorCore | null = null;

/** 在 DOM 准备好后由容器组件调用一次，负责创建实例 */
function initCore(containerId: string, options?: EditorCoreOptions): EditorCore {
  if (core) return core;
  core = new EditorCore(containerId, options);
  return core;
}

/** 其他地方按需取实例；未初始化时返回 null，调用方需判空 */
function getCore(): EditorCore | null {
  return core;
}

/** 容器组件卸载时调用，释放 Konva 资源 */
function destroyCore() {
  core?.destroy();
  core = null;
}

export {
  initCore,
  getCore,
  destroyCore,
}