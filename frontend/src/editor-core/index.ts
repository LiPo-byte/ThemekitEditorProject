import Konva from 'konva';
import IconPack from './IconPack';
import Time from './Time';

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


const WIDGET_BORDER_RADIUS = 28;

const WIDGET_GAP = 200;
const SELECTED_NODE_BOX_COLOR = '#fbbf24';
const SELECTED_NODE_BOX_WIDTH = 2;

export type EditorTheme = 'light' | 'dark';

type EditorCommand = {
  label: string;
  do: () => void;
  undo: () => void;
};

type EditorHistoryState = {
  canUndo: boolean;
  canRedo: boolean;
};

type SelectionCapabilities = {
  canDelete: boolean;
  canExport: boolean;
  canCrop: boolean;
};


/**
 * 编辑器核心
 * - 三层结构：背景层（网格/参考线）/ 内容层（图层节点）/ 浮层（选中框/控制点）
 * - 仅提供节点增删，后续按需扩展
 */
export class EditorCore {
  readonly stage: Konva.Stage;
  readonly bgLayer: Konva.Layer;
  readonly contentLayer: Konva.Layer;
  readonly wallPaperLayer: Konva.Layer;
  readonly overlayLayer: Konva.Layer;
  readonly cropLayer: Konva.Layer;
  private readonly minScale: number;
  private readonly maxScale: number;
  private readonly zoomStep: number;
  private zoomable: boolean;
  private croping: boolean;
  private shiftKeyDownBoolean: boolean;
  private theme: EditorTheme;
  private backgroundColor = '#ffffff';
  private showBackgroundDecorations = true;
  private showAxis = true;
  private wallPaperAnim: Konva.Animation | null = null;
  private nodes: any[];
  private transformer!: Konva.Transformer;
  private selectionRectangle: Konva.Rect;
  private selectedNodes: Konva.Node[] = [];

  /** 当前处于裁剪模式的背景图；null 表示未进入裁剪 */
  private cropImage: Konva.Group | null = null;
  private selectionBoxes = new Map<Konva.Node, Konva.Rect>();
  /** 选中变化订阅器（供 React 浮层监听） */
  private selectionListeners = new Set<(node: Konva.Node[] | null) => void>();
  /** 布局变化订阅器（stage 缩放/平移、transformer 变换时触发，用于 React 浮层重定位） */
  private layoutListeners = new Set<() => void>();
  /** 节点 editProps 变化订阅器（节点 attrs.editProps 变化时触发） */
  private editPropsListeners = new Set<() => void>();
  private gridShape: Konva.Shape | null = null;
  private axisShape: Konva.Shape | null = null;

  private historyListeners = new Set<(state: EditorHistoryState) => void>();
  private undoStack: EditorCommand[] = [];
  private redoStack: EditorCommand[] = [];
  private readonly maxHistorySize = 100;

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
    this.stage.container().style.backgroundColor = this.backgroundColor;

    this.bgLayer = new Konva.Layer({ listening: false });
    this.contentLayer = new Konva.Layer();
    this.wallPaperLayer = new Konva.Layer();
    this.overlayLayer = new Konva.Layer();
    this.cropLayer = new Konva.Layer({
      visible: false,
      draggable: false,
    });
    this.shiftKeyDownBoolean = false;
    this.minScale = options.minScale ?? 0.1;
    this.maxScale = options.maxScale ?? 8;
    this.zoomStep = options.zoomStep ?? 1.05;
    this.zoomable = true;
    this.croping = false;
    this.theme = options.theme ?? 'light';
    this.nodes = [];

    this.stage.add(this.bgLayer);
    this.stage.add(this.contentLayer);
    this.stage.add(this.wallPaperLayer);
    this.stage.add(this.cropLayer);
    this.stage.add(this.overlayLayer);

    this.transformer = new Konva.Transformer({
      rotateEnabled: false,
      ignoreStroke: true,
      keepRatio: true,
      flipEnabled: false,
      // enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      enabledAnchors: [],
      borderStroke: '#1677ff',
      borderStrokeWidth: 2,
      // 添加锚点
      anchorFill: '#1677ff',
      anchorStroke: '#ffffff',
      anchorStrokeWidth: 0.5,
      anchorSize: 5,
      // 使所有锚点看起来像圆形
      anchorCornerRadius: 50,
    });
    // 禁止拖过对角后翻转；向内拖小于裁剪框时直接拒绝（如拖右下锚点往左上）
    this.transformer.flipEnabled(false);
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
    this.stage.on(
      'xChange yChange scaleXChange scaleYChange',
      this.emitLayoutChange,
    );
    window.addEventListener('keydown', this.handleWindowKeyDown);
    window.addEventListener('keyup', this.handleWindowKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
    // 通过 transformer 锚点变换选中节点时同步重定位
    this.transformer.on('transform', this.emitLayoutChange);
  }

  private handleWindowKeyDown = (e: KeyboardEvent) => {
    if (this.isEditableTarget(e.target)) return;
    if (this.handleUndoRedoKeydown(e)) return;
    if (this.handleDeleteKeydown(e)) return;
    this.handleShiftKeydown(e);
  };

  // 撤销回退按键
  private handleUndoRedoKeydown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    const commandPressed = e.metaKey || e.ctrlKey;
    if (!commandPressed) return false;
    if (key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
      return true;
    }
    if (key === 'y') {
      e.preventDefault();
      this.redo();
      return true;
    }
    return false;
  }

  // 删除按键
  private handleDeleteKeydown(e: KeyboardEvent) {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return false;
    e.preventDefault();
    this.deleteSelectedNodes();
    return true;
  }

  // 按下shift按键
  private handleShiftKeydown(e: KeyboardEvent) {
    if (e.key !== 'Shift' || this.shiftKeyDownBoolean) return;
    this.shiftKeyDownBoolean = true;
    e.preventDefault();
  }

  // 抬起shift按键
  private handleWindowKeyUp = (e: KeyboardEvent) => {
    if (e.key !== 'Shift') return;
    this.shiftKeyDownBoolean = false;
    e.preventDefault();
  };

  private handleWindowBlur = () => {
    this.shiftKeyDownBoolean = false;
    // 裁剪模式下保持禁止平移，避免失焦/可见性变化把 draggable 又打开
    // if (this.cropLayer.visible()) return;
    // this.stage.draggable(!this.isSelecting);
  };

  private isEditableTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return (
      target.isContentEditable ||
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT'
    );
  }

  private executeCommand(command: EditorCommand) {
    command.do();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.emitHistoryChange();
  }

  undo() {
    if (this.croping) return;
    const command = this.undoStack.pop();
    if (!command) return;
    command.undo();
    this.redoStack.push(command);
    this.emitHistoryChange();
  }

  redo() {
    if (this.croping) return;
    const command = this.redoStack.pop();
    if (!command) return;
    command.do();
    this.undoStack.push(command);
    this.emitHistoryChange();
  }

  private getHistoryState(): EditorHistoryState {
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
    };
  }

  private emitHistoryChange() {
    const state = this.getHistoryState();
    this.historyListeners.forEach((cb) => {
      cb(state);
    });
  }

  onHistoryChange(cb: (state: EditorHistoryState) => void): () => void {
    this.historyListeners.add(cb);
    cb(this.getHistoryState());
    return () => {
      this.historyListeners.delete(cb);
    };
  }

  /** 点击空白/其他元素取消选中；点中带 selected:true 的节点（或其后代）选中之 */
  private handleStageClick = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (this.croping) return;
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

  /** 选中节点 */
  select(node: Konva.Node) {
    if (this.selectedNodes.length === 1 && this.selectedNodes[0] === node)
      return;
    this.setSelectedNodes([node]);
  }

  /** 取消选中 */
  deselect() {
    if (this.selectedNodes.length === 0) return;
    this.setSelectedNodes([]);
  }

  private syncSelectionBoxes() {
    const shouldShowBoxes = this.selectedNodes.length > 1;
    const nextSet = shouldShowBoxes
      ? new Set(this.selectedNodes)
      : new Set<Konva.Node>();
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

  /** 订阅节点 editProps 变化；返回退订函数 */
  onEditPropsChange(cb: () => void): () => void {
    this.editPropsListeners.add(cb);
    return () => {
      this.editPropsListeners.delete(cb);
    };
  }

  /**
   * 选中节点在 stage 容器坐标系下的 bbox（屏幕坐标，单位 px）。
   * 已经包含 stage 的 scale/translate，浮层用 left/top 直接消费即可。
   */
  getSelectionScreenRect(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null {
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
    this.selectionListeners.forEach((cb) => {
      cb(selectNodes);
    });
  };

  private emitLayoutChange = () => {
    this.syncSelectionBoxes();
    this.layoutListeners.forEach((cb) => {
      cb();
    });
  };

  /** 主动触发节点 editProps 变化通知（供外部手动派发） */
  emitEditPropsChange() {
    this.editPropsListeners.forEach((cb) => {
      cb();
    });
  }

  /** 当前全部选中节点 */
  getSelectedNodes(): Konva.Node[] {
    return [...this.selectedNodes];
  }

  /**
   * 获取当前选中节点（含子节点）的 editProps 聚合结果。
   * 同 key 在多节点中值不一致时，返回 multipleValue。
   */
  getSelectedEditProps(multipleValue = '__MIXED__'): Record<string, any> {
    if (!this.selectedNodes.length) return {};
    const mergedEditProps: Record<string, any> = {};
    const mixedKeys = new Set<string>();
    const candidateNodes: Konva.Node[] = [];
    const visitedNodes = new Set<Konva.Node>();
    const collectNodeAndDescendants = (node: Konva.Node) => {
      if (visitedNodes.has(node)) return;
      visitedNodes.add(node);
      candidateNodes.push(node);
      const children = (node as any).getChildren?.();
      if (!children?.length) return;
      children.forEach((child: Konva.Node) => {
        collectNodeAndDescendants(child);
      });
    };

    this.selectedNodes.forEach((node) => {
      collectNodeAndDescendants(node);
    });

    candidateNodes.forEach((node) => {
      const editProps = node.getAttr('editProps');
      if (!editProps || typeof editProps !== 'object') return;
      Object.entries(editProps).forEach(([key, value]) => {
        // 图片资源需要单独处理
        if (key === 'source') {
          const obj = mergedEditProps[key] || [];
          obj.push({
            id: node._id,
            name: editProps.name || '未知',
            source: value,
          })
          mergedEditProps[key] = [...obj];
          return;
        }
        if (!Object.hasOwn(mergedEditProps, key)) {
          mergedEditProps[key] = value;
          return;
        }
        if (!Object.is(mergedEditProps[key], value)) {
          mixedKeys.add(key);
        }
      });
    });

    mixedKeys.forEach((key) => {
      mergedEditProps[key] = multipleValue;
    });
    return mergedEditProps;
  }

  getSelectionCapabilities(): SelectionCapabilities {
    const selectedNodes = this.selectedNodes;
    const selectedCount = selectedNodes.length;
    let canDelete = selectedCount > 0;
    let canExport = false;
    let canCrop = false;

    for (let i = 0; i < selectedCount; i += 1) {
      const node = selectedNodes[i];
      if (node.getAttr('deleteable') !== true) {
        canDelete = false;
      }
      if (!canExport && node.getAttr('packable') === true) {
        canExport = true;
      }
      if (selectedCount === 1 && node.getAttr('cropable') === true) {
        canCrop = true;
      }
    }

    return { canDelete, canExport, canCrop };
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

    this.contentLayer
      .getChildren()
      .concat(this.wallPaperLayer.getChildren())
      .forEach((node) => {
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
    let targetScale = Math.min(
      availableWidth / boundsWidth,
      availableHeight / boundsHeight,
    );
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

  /**
   * 截图整个画布
   * - 默认模式（不传 outputWidth/outputHeight）：按所有内容真实包围盒 1:1 输出
   * - 固定尺寸模式（传了 outputWidth+outputHeight）：内容居中适配到指定尺寸，
   *   fit='contain' 完整显示+留白；fit='cover' 填满+裁剪
   * - 排除：背景网格、坐标轴、选中框、变换控制点、裁剪蒙层
   * - 同步返回 base64 dataURL；无可见内容时返回 null
   */
  captureCanvas(
    options: {
      /** 像素密度，默认 2 */
      pixelRatio?: number;
      /** 输出格式，默认 image/png */
      mimeType?: 'image/png' | 'image/jpeg' | 'image/webp';
      /** JPEG/WebP 质量 0-1，默认 0.92 */
      quality?: number;
      /**
       * 内边距/外扩 px：
       * - 固定尺寸模式：输出画布的屏幕内边距，默认 20
       * - 包围盒模式：包围盒外扩的世界坐标 px，默认 0
       */
      padding?: number;
      /** 背景色；传 null 输出透明；不传沿用当前 stage 背景色 */
      backgroundColor?: string | null;
      /** 输出宽 px。配合 outputHeight 走「固定尺寸 + 内容居中」模式 */
      outputWidth?: number;
      /** 输出高 px */
      outputHeight?: number;
      /** 固定尺寸模式下的适配方式，默认 contain */
      fit?: 'contain' | 'cover';
      /** 是否包含背景辅助元素（网格点、坐标轴、原点标记），默认 true */
      includeBackground?: boolean;
    } = {},
  ): string | null {
    const pixelRatio = options.pixelRatio ?? 2;
    const mimeType = options.mimeType ?? 'image/png';
    const quality = options.quality ?? 0.92;
    const includeBackground = options.includeBackground ?? true;
    const backgroundColor =
      'backgroundColor' in options
        ? options.backgroundColor
        : this.backgroundColor;

    const exportableNodes = [
      ...this.contentLayer.getChildren(),
      ...this.wallPaperLayer.getChildren(),
    ].filter((node) => node.isVisible());
    if (!exportableNodes.length) return null;

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    exportableNodes.forEach((node) => {
      // relativeTo: stage 得到的是不含 stage transform 的世界坐标
      const rect = node.getClientRect({ relativeTo: this.stage });
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.x < minX) minX = rect.x;
      if (rect.y < minY) minY = rect.y;
      if (rect.x + rect.width > maxX) maxX = rect.x + rect.width;
      if (rect.y + rect.height > maxY) maxY = rect.y + rect.height;
    });
    if (!Number.isFinite(minX)) return null;

    const bboxW = Math.max(1, maxX - minX);
    const bboxH = Math.max(1, maxY - minY);
    const isFixed =
      options.outputWidth != null && options.outputHeight != null;

    // 按模式分别推导：导出缩放、stage 临时位置、toDataURL 截取区域（屏幕坐标）
    let exportScale: number;
    let stagePosX: number;
    let stagePosY: number;
    let toDataX: number;
    let toDataY: number;
    let toDataW: number;
    let toDataH: number;

    if (isFixed) {
      const outW = options.outputWidth as number;
      const outH = options.outputHeight as number;
      const fit = options.fit ?? 'contain';
      const pad = options.padding ?? 20;

      const availW = Math.max(1, outW - pad * 2);
      const availH = Math.max(1, outH - pad * 2);
      exportScale =
        fit === 'contain'
          ? Math.min(availW / bboxW, availH / bboxH)
          : Math.max(outW / bboxW, outH / bboxH);

      const centerX = minX + bboxW / 2;
      const centerY = minY + bboxH / 2;
      // 让内容中心 (centerX, centerY) 映射到屏幕中心 (outW/2, outH/2)
      stagePosX = outW / 2 - centerX * exportScale;
      stagePosY = outH / 2 - centerY * exportScale;
      toDataX = 0;
      toDataY = 0;
      toDataW = outW;
      toDataH = outH;
    } else {
      const pad = options.padding ?? 0;
      exportScale = 1;
      stagePosX = 0;
      stagePosY = 0;
      toDataX = minX - pad;
      toDataY = minY - pad;
      toDataW = Math.max(1, Math.ceil(bboxW + pad * 2));
      toDataH = Math.max(1, Math.ceil(bboxH + pad * 2));
    }

    const savedScale = { x: this.stage.scaleX(), y: this.stage.scaleY() };
    const savedPos = this.stage.position();
    const savedBgVisible = this.bgLayer.visible();
    const savedAxisVisible = this.axisShape?.visible() ?? true;
    const savedOverlayVisible = this.overlayLayer.visible();
    const savedCropVisible = this.cropLayer.visible();

    // 背景色：临时新建一个 Layer 放在所有 layer 最底，避免 PNG 透明 / JPEG 黑底；
    // 不能放 contentLayer 里——contentLayer 整层在 bgLayer 之上，背景色会盖住网格/坐标轴
    let bgRectLayer: Konva.Layer | null = null;
    if (backgroundColor) {
      const worldX = (toDataX - stagePosX) / exportScale;
      const worldY = (toDataY - stagePosY) / exportScale;
      const worldW = toDataW / exportScale;
      const worldH = toDataH / exportScale;
      bgRectLayer = new Konva.Layer({ listening: false });
      bgRectLayer.add(
        new Konva.Rect({
          x: worldX,
          y: worldY,
          width: worldW,
          height: worldH,
          fill: backgroundColor,
        }),
      );
      this.stage.add(bgRectLayer);
      bgRectLayer.moveToBottom();
    }

    this.stage.scale({ x: exportScale, y: exportScale });
    this.stage.position({ x: stagePosX, y: stagePosY });
    // bgLayer 上的 grid/axis 都是 sceneFunc 自绘并依赖 stage 当前 transform，
    // 这里设置 visible(true) 后，toDataURL 会按上面新设置的 scale/position 重新绘制，自动适配
    this.bgLayer.visible(includeBackground);
    // 截图里不要坐标轴和刻度数字，只保留网格点
    this.axisShape?.visible(false);
    this.overlayLayer.visible(false);
    this.cropLayer.visible(false);

    try {
      return this.stage.toDataURL({
        x: toDataX,
        y: toDataY,
        width: toDataW,
        height: toDataH,
        pixelRatio,
        mimeType,
        quality,
      });
    } finally {
      bgRectLayer?.destroy();
      this.stage.scale(savedScale);
      this.stage.position(savedPos);
      this.bgLayer.visible(savedBgVisible);
      this.axisShape?.visible(savedAxisVisible);
      this.overlayLayer.visible(savedOverlayVisible);
      this.cropLayer.visible(savedCropVisible);
      this.stage.batchDraw();
    }
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
    if (!this.zoomable) return;
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

  // 获取空白位置
  getEmptyXY() {
    // 网格布局：每行 PER_ROW 个，超出换行
    const PER_ROW = 8;

    const idx = this.nodes.length;
    const col = idx % PER_ROW;
    const row = Math.floor(idx / PER_ROW);

    let x = 0;
    let y = 0;
    if (col > 0) {
      // 同一行：跟在前一个右边
      const prev = this.nodes[idx - 1];
      x = prev.x + prev.width + WIDGET_GAP;
      y = prev.y;
    } else if (row > 0) {
      // 新一行：x 归零，y 跳到上一行最大底部 + gap
      const prevRowStart = (row - 1) * PER_ROW;
      const prevRow = this.nodes.slice(prevRowStart, prevRowStart + PER_ROW);
      const maxBottom = Math.max(...prevRow.map((w: any) => w.y + w.height));
      x = 0;
      y = maxBottom + WIDGET_GAP;
    }
    return { x, y };
  }

  private getOwnerInstanceForNode(node: Konva.Node | null) {
    let current = node;
    while (current) {
      const instance = current.getAttr('instance');
      if (instance && typeof instance.render === 'function') {
        return instance;
      }
      current = current.getParent();
    }
    return null;
  }
  getOwnerTitleForNode(node: Konva.Node | null) {
    let current = node;
    while (current) {
      const title = current.getAttr('title');
      if (title) {
        return title;
      }
      current = current.getParent();
    }
    return null;
  }

  // Widget
  private createAddWidgetCommand(data: any): EditorCommand {
    const { x, y } = this.getEmptyXY();
    const widget = new Time({ x, y, data });
    const widgetNode = widget.node;
    const insertIndex = this.nodes.length;

    return {
      label: 'add-widget',
      do: () => {
        if (!this.nodes.includes(widget)) {
          const safeIndex = Math.min(insertIndex, this.nodes.length);
          this.nodes.splice(safeIndex, 0, widget);
        }
        if (widgetNode && widgetNode.getParent() !== this.contentLayer) {
          this.contentLayer.add(widgetNode);
        }
        this.contentLayer.batchDraw();
        this.emitLayoutChange();
      },
      undo: () => {
        const idx = this.nodes.indexOf(widget);
        if (idx >= 0) {
          this.nodes.splice(idx, 1);
        }
        this.deselect();
        if (widgetNode?.getParent()) {
          this.removeNode(widgetNode);
        } else {
          this.contentLayer.batchDraw();
        }
        this.emitLayoutChange();
      },
    };
  }
  addWidget(data: any) {
    this.executeCommand(this.createAddWidgetCommand(data));
  }
  private createAddIconPackCommand(data: any): EditorCommand {
    const { x, y } = this.getEmptyXY();
    const iconPack = new IconPack({ x, y, data });
    const iconPackNode = iconPack.node;
    const insertIndex = this.nodes.length;

    return {
      label: 'add-iconpack',
      do: () => {
        if (!this.nodes.includes(iconPack)) {
          const safeIndex = Math.min(insertIndex, this.nodes.length);
          this.nodes.splice(safeIndex, 0, iconPack);
        }
        if (iconPackNode && iconPackNode.getParent() !== this.contentLayer) {
          this.contentLayer.add(iconPackNode);
        }
        this.contentLayer.batchDraw();
        this.emitLayoutChange();
      },
      undo: () => {
        const idx = this.nodes.indexOf(iconPack);
        if (idx >= 0) {
          this.nodes.splice(idx, 1);
        }
        this.deselect();
        if (iconPackNode?.getParent()) {
          this.removeNode(iconPackNode);
        } else {
          this.contentLayer.batchDraw();
        }
        this.emitLayoutChange();
      },
    };
  }
  addIconPack(data: any) {
    this.executeCommand(this.createAddIconPackCommand(data));
  }


  private createChangeNodePropsCommand(params: any): EditorCommand | null {
    const { key, value, ids } = params;
    if (!this.selectedNodes.length) return null;
    const nodesAttrs: any = [];
    const candidateNodes: Konva.Node[] = [];
    const visitedNodes = new Set<Konva.Node>();
    const collectNodeAndDescendants = (node: Konva.Node) => {
      if (visitedNodes.has(node)) return;
      visitedNodes.add(node);
      candidateNodes.push(node);
      const children = (node as any).getChildren?.();
      if (!children?.length) return;
      children.forEach((child: Konva.Node) => {
        collectNodeAndDescendants(child);
      });
    };
    this.selectedNodes.forEach((node) => {
      collectNodeAndDescendants(node);
    });
    candidateNodes.forEach((node: any) => {
      if (ids && !ids.includes(node._id)) return;
      const prevEditProps = { ...(node.getAttr('editProps') ?? {}) };
      // 如果不包含此参数，直接返回
      if (!Object.keys(prevEditProps).includes(key)) return;

      const hasChanged = prevEditProps[key] !== value;
      if (!hasChanged) return;

      nodesAttrs.push({
        instance: node,
        prevAttrs: {
          ...prevEditProps,
        },
        nextAttrs: {
          ...prevEditProps,
          [key]: value,
        },
      });
    });
    return {
      label: `change-node-props:${String(key)}`,
      do: () => {
        const affectedInstances = new Set<any>();
        const affectedLayers = new Set<Konva.Layer>();
        nodesAttrs.forEach(({ instance, nextAttrs }: any) => {
          instance.setAttr('editProps', nextAttrs);
          const ownerInstance = this.getOwnerInstanceForNode(instance);
          if (ownerInstance) {
            affectedInstances.add(ownerInstance);
          } else {
            const layer = instance.getLayer();
            if (layer) affectedLayers.add(layer);
          }
        });
        affectedInstances.forEach((instance) => {
          instance.render();
        });
        affectedLayers.forEach((layer) => layer.batchDraw());
        this.transformer.forceUpdate();
        this.emitEditPropsChange();
      },
      undo: () => {
        const affectedInstances = new Set<any>();
        const affectedLayers = new Set<Konva.Layer>();
        nodesAttrs.forEach(({ instance, prevAttrs }: any) => {
          instance.setAttr('editProps', prevAttrs);
          const ownerInstance = this.getOwnerInstanceForNode(instance);
          if (ownerInstance) {
            affectedInstances.add(ownerInstance);
          } else {
            const layer = instance.getLayer();
            if (layer) affectedLayers.add(layer);
          }
        });
        affectedInstances.forEach((instance) => {
          instance.render();
        });
        affectedLayers.forEach((layer) => layer.batchDraw());
        this.transformer.forceUpdate();
        this.emitEditPropsChange();
      },
    };
  }

  changeNodeProps(params: any) {
    const command = this.createChangeNodePropsCommand(params);
    if (!command) return;
    this.executeCommand(command);
    this.emitSelectionChange();
  }

  private createDeleteSelectNodesCommand(): EditorCommand | null {
    const selectedNodes = this.getSelectedNodes();
    if (!selectedNodes.length) return null;

    const deleteable = selectedNodes.every(
      (node) => node.getAttr('deleteable') === true,
    );

    if (!deleteable) {
      console.warn(
        '[EditorCore] delete blocked: all selected nodes must set deleteable=true',
      );
      return null;
    }

    const nodeSnapshots = selectedNodes.map((node) => {
      const parent = node.getParent();
      return {
        node,
        parent,
        index: parent ? node.index : -1,
      };
    });

    const removedNodeEntries = this.nodes
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => selectedNodes.some((node) => item?.node === node));

    return {
      label: 'delete-selected-nodes',
      do: () => {
        const nodeIndexes = removedNodeEntries
          .map(({ index }) => index)
          .sort((a, b) => b - a);
        nodeIndexes.forEach((index) => {
          this.nodes.splice(index, 1);
        });
        nodeSnapshots.forEach(({ node }) => {
          if (node.getParent()) {
            this.removeNode(node);
          }
        });
        this.deselect();
        this.emitLayoutChange();
      },
      undo: () => {
        removedNodeEntries
          .slice()
          .sort((a, b) => a.index - b.index)
          .forEach(({ item, index }) => {
            const safeIndex = Math.min(Math.max(index, 0), this.nodes.length);
            this.nodes.splice(safeIndex, 0, item);
          });

        nodeSnapshots.forEach(({ node, parent, index }) => {
          if (!parent || node.getParent() === parent) return;
          parent.add(node);
          if (index >= 0) {
            node.zIndex(index);
          }
          parent.getLayer()?.batchDraw();
        });
        this.emitLayoutChange();
      },
    };
  }

  deleteSelectedNodes() {
    const command = this.createDeleteSelectNodesCommand();
    if (!command) return;
    this.executeCommand(command);
  }

  private ensureWallPaperAnimation() {
    if (this.wallPaperAnim?.isRunning()) return;
    this.wallPaperAnim = new Konva.Animation(() => {
      // 只用于驱动视频帧刷新
    }, this.wallPaperLayer);
    this.wallPaperAnim.start();
  }

  private stopWallPaperAnimationIfIdle() {
    if (this.wallPaperLayer.getChildren().length > 0) return;
    this.wallPaperAnim?.stop();
    this.wallPaperAnim = null;
  }

  /** 移除节点（自动从所属父级解绑），并刷新所在层 */
  removeNode(node: Konva.Node) {
    const layer = node.getLayer();
    const idx = this.selectedNodes.indexOf(node);
    if (idx >= 0) {
      this.setSelectedNodes(this.selectedNodes.filter((n) => n !== node));
    }
    node.remove();
    if (layer === this.wallPaperLayer) {
      this.stopWallPaperAnimationIfIdle();
    }
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
    grid.visible(this.showBackgroundDecorations);
    this.gridShape = grid;
    this.bgLayer.add(grid);

    // 过世界原点(0,0)的 X/Y 坐标轴 + 自适应刻度数字，跟随缩放平移
    const axisTargetPx = 80; // 期望相邻刻度的屏幕间距，据此选 1/2/5 档刻度步长
    // 取不大于 raw 档位里最接近的 1/2/5×10^n，保证刻度数字为「整齐」值
    const niceStep = (raw: number) => {
      const pow = 10 ** Math.floor(Math.log10(raw));
      const n = raw / pow;
      const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
      return m * pow;
    };
    const axis = new Konva.Shape({
      listening: false,
      perfectDrawEnabled: false,
      sceneFunc: (ctx) => {
        const stage = this.stage;
        const scale = stage.scaleX();
        const pos = stage.position();
        // 可视区域 → 世界坐标
        const x1 = -pos.x / scale;
        const y1 = -pos.y / scale;
        const x2 = (stage.width() - pos.x) / scale;
        const y2 = (stage.height() - pos.y) / scale;

        const step = niceStep(axisTargetPx / scale);
        // 线宽/刻度长/字号都除以 scale，保证屏幕上视觉尺寸恒定
        const tick = 4 / scale;
        const fontPx = 11 / scale;
        const lineWidth = 1 / scale;
        const fmt = (v: number) => String(+v.toFixed(2));

        // 两条轴线
        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = this.getAxisLineColor();
        ctx.moveTo(x1, 0);
        ctx.lineTo(x2, 0);
        ctx.moveTo(0, y1);
        ctx.lineTo(0, y2);
        ctx.stroke();

        ctx.fillStyle = this.getAxisTextColor();
        ctx.font = `${fontPx}px sans-serif`;

        // X 轴刻度 + 数字（在轴线下方）
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const startX = Math.ceil(x1 / step) * step;
        for (let x = startX; x <= x2; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, -tick);
          ctx.lineTo(x, tick);
          ctx.stroke();
          if (x !== 0) ctx.fillText(fmt(x), x, tick * 1.4);
        }

        // Y 轴刻度 + 数字（在轴线左侧，数值用世界坐标，向下为正）
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const startY = Math.ceil(y1 / step) * step;
        for (let y = startY; y <= y2; y += step) {
          ctx.beginPath();
          ctx.moveTo(-tick, y);
          ctx.lineTo(tick, y);
          ctx.stroke();
          if (y !== 0) ctx.fillText(fmt(y), -tick * 1.6, y);
        }

        // 原点标记
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('0', -tick * 1.2, tick * 1.4);
      },
    });
    axis.visible(this.showAxis);
    this.axisShape = axis;
    this.bgLayer.add(axis);
  }

  private getGridDotColor() {
    return this.theme === 'dark' ? '#3a3a3a' : '#ccc';
  }

  private getAxisLineColor() {
    return this.theme === 'dark' ? '#555' : '#999';
  }

  private getAxisTextColor() {
    return this.theme === 'dark' ? '#888' : '#666';
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

  getBackgroundColor(): string {
    return this.backgroundColor;
  }

  setBackgroundColor(color: string) {
    if (!color || this.backgroundColor === color) return;
    this.backgroundColor = color;
    this.stage.container().style.backgroundColor = color;
  }

  getShowBackgroundDecorations(): boolean {
    return this.showBackgroundDecorations;
  }

  setShowBackgroundDecorations(show: boolean) {
    if (this.showBackgroundDecorations === show) return;
    this.showBackgroundDecorations = show;
    this.gridShape?.visible(show);
    this.bgLayer.batchDraw();
  }

  getShowAxis(): boolean {
    return this.showAxis;
  }

  setShowAxis(show: boolean) {
    if (this.showAxis === show) return;
    this.showAxis = show;
    this.axisShape?.visible(show);
    this.bgLayer.batchDraw();
  }

  /**
   * 切换裁剪模式：
   * - 裁剪框 = widgetGroup 已有的 clipFunc 区域，固定不动
   * - 进入裁剪时只让背景图 draggable，图片在固定窗口内拖动，超出部分被现有 clip 裁掉
   * - 同时禁用画布平移，避免拖到空白处误触
   * - 再次调用则退出裁剪，图片当前位置即裁剪结果（clip 方式不写回源图，可反复重裁）
   */
  crop() {
    // 选中的整块 widget group，作为裁剪高亮区
    const target = this.selectedNodes[0];
    if (!target || !(target instanceof Konva.Group)) return;
    const cropable = target.getAttr('cropable');
    if (!cropable) return;
    const cropImageInstance = target.findOne((node: Konva.Node) =>
      node.getAttr('cropInstance'),
    );

    const cropWidgetItem = target.clone();

    const cropImage = cropWidgetItem.findOne((node: Konva.Node) =>
      node.getAttr('cropInstance'),
    );

    if (
      !cropImageInstance ||
      !(cropImageInstance instanceof Konva.Group) ||
      !cropImage ||
      !(cropImage instanceof Konva.Group)
    )
      return;

    // 进入裁剪
    this.zoomable = false; // 禁止缩放
    this.stage.draggable(false); // 禁止画布平移
    this.croping = true; // 正在裁剪
    this.cropLayer.destroyChildren();
    // 关键：把 cropImage（cropInstance group）的所有裁剪去掉，让内层 Image 整张展示出来
    // clipFunc 是圆角；clip 是矩形（现版本被注释，保留这行做双保险）
    cropImage.setAttr('clipFunc', undefined);
    cropImage.setAttr('clip', null);
    this.deselect();

    // cropLayer 与 contentLayer 同为 stage 直接子层、自身无 transform，坐标可直接互换
    const hole = target.getClientRect({ relativeTo: this.contentLayer });
    // stage 的缩放/平移会作用到所有 layer，整屏蒙层需换算到世界坐标才能真正盖满屏幕
    const scale = this.stage.scaleX();
    const pos = this.stage.position();
    const view = {
      x: -pos.x / scale,
      y: -pos.y / scale,
      width: this.stage.width() / scale,
      height: this.stage.height() / scale,
    };


    // cropWidgetItem 放回原 widget 位置（cropLayer 与 contentLayer 坐标系一致）
    cropWidgetItem.x(hole.x);
    cropWidgetItem.y(hole.y);

    // 只 add cropWidgetItem。cropImage 已经是它的子节点，不能再单独 add
    // —— 否则 Konva 会把它从 cropWidgetItem 里 detach 出来跑到 cropLayer 的 (0,0)
    this.cropLayer.add(cropWidgetItem);

    // 找到 cropImage 内层的 Konva.Image，开启拖拽与命中
    // cropWidgetItem 是 clone 出来的，closeCrop 中会 destroyChildren，不必手动还原
    const innerImage = cropImage.findOne(
      (n: Konva.Node) => n instanceof Konva.Image,
    );
    if (!(innerImage instanceof Konva.Image)) return;
    innerImage.listening(true);
    innerImage.draggable(true);

    this.transformer.enabledAnchors([
      'top-center',
      'middle-left',
      'middle-right',
      'bottom-center',
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
    ]);
    this.transformer.rotateEnabled(true);
    // transformer 必须接管 Konva.Image 本身，而不是外层 Group
    // confirmCrop 里也是按 cropPreviewImage instanceof Konva.Image 判定的
    this.transformer.nodes([innerImage]);

    // 压暗蒙层 + 挖空：用单个 Shape，在自己的 cache 离屏 canvas 里画
    // 「整屏压暗 + destination-out 挖空」，destination-out 限定在离屏内生效，不会擦穿下层图片。
    // 用 Shape（而非 Group）是因为只有 Shape 才有 drawHitFromCache。
    const maskShape = new Konva.Shape({
      listening: false,
      sceneFunc: (ctx) => {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(view.x, view.y, view.width, view.height);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000'; // ← 加这一行，擦除强度拉满
        const widthPx = hole.width;
        const heightPx = hole.height;
        const radius = pt(WIDGET_BORDER_RADIUS);
        // 平移到洞的实际位置，路径就能继续用相对 0,0 的写法
        ctx.translate(hole.x, hole.y);
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(widthPx - radius, 0);
        ctx.quadraticCurveTo(widthPx, 0, widthPx, radius);
        ctx.lineTo(widthPx, heightPx - radius);
        ctx.quadraticCurveTo(widthPx, heightPx, widthPx - radius, heightPx);
        ctx.lineTo(radius, heightPx);
        ctx.quadraticCurveTo(0, heightPx, 0, heightPx - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.fill(); // 关键：这一步才真正挖洞
        ctx.restore(); // restore 会自动恢复 composite operation 和 translate
      },
    });
    this.cropLayer.add(maskShape);

    // 自定义 sceneFunc 无法自动算包围盒，cache 必须显式给区域；pixelRatio 对齐当前缩放避免发虚
    maskShape.cache({
      x: view.x,
      y: view.y,
      width: view.width,
      height: view.height,
      pixelRatio: scale,
    });
    // 命中按 cache 的 alpha：镂空区透明 → 不拦截，图片可交互；四周半透明 → 拦截点击
    maskShape.drawHitFromCache();

    target.visible(false);
    this.cropImage = target;
    this.cropLayer.batchDraw();
    this.cropLayer.visible(true);
  }

  closeCrop() {
    this.zoomable = true;
    this.croping = false;
    this.stage.draggable(true);
    this.cropImage?.visible(true);
    this.transformer.keepRatio(true);
    this.transformer.rotateEnabled(false);
    this.cropLayer.destroyChildren();
    this.cropLayer.visible(false);
    this.deselect()
    this.transformer.nodes([]);
    // this.cropImage && this.transformer.nodes([this.cropImage]);
    this.transformer.enabledAnchors([]);
  }
  /**
   * 第一步：仅拿到用户在裁剪面板里调整的几何参数（translate/scale/rotation），
   * 反算回 crop_props 语义（与 createBgImage2 一致），先不做导出/写回。
   */
  confirmCrop() {
    if (!this.croping) return null;
    const [previewImage] = this.transformer.nodes();
    if (!(previewImage instanceof Konva.Image)) return null;

    // 与 createBgImage2 的几何约定一一对应：
    //   x = imgW/2 + translateX, y = imgH/2 + translateY
    //   offsetX/Y = imgW/2, imgH/2（旋转/缩放锚点固定在图片中心）
    const crop_props = {
      translateX: previewImage.x() - previewImage.offsetX(),
      translateY: previewImage.y() - previewImage.offsetY(),
      scaleX: previewImage.scaleX(),
      scaleY: previewImage.scaleY(),
      rotation: previewImage.rotation(),
    };
    if (this.cropImage) {
      this.select(this.cropImage);
      this.changeNodeProps({ key: 'crop_props', value: crop_props });
    }
    this.closeCrop();
    return crop_props;
  }

  /** 销毁 Stage，释放 Konva 资源；组件卸载时调用 */
  destroy() {
    this.stage.off('wheel', this.handleWheel);
    this.stage.off('click tap', this.handleStageClick);
    this.stage.off(
      'xChange yChange scaleXChange scaleYChange',
      this.emitLayoutChange,
    );
    window.removeEventListener('keydown', this.handleWindowKeyDown);
    window.removeEventListener('keyup', this.handleWindowKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);

    this.transformer.off('transform', this.emitLayoutChange);

    this.selectionListeners.clear();
    this.layoutListeners.clear();
    this.editPropsListeners.clear();
    this.historyListeners.clear();
    this.wallPaperAnim?.stop();
    this.wallPaperAnim = null;

    this.stage.destroy();
  }
}

let core: EditorCore | null = null;

/** 在 DOM 准备好后由容器组件调用一次，负责创建实例 */
function initCore(
  containerId: string,
  options?: EditorCoreOptions,
): EditorCore {
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

export { destroyCore, getCore, initCore };
