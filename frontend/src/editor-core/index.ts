import Konva from 'konva';
import mockdata from './mockdata.json';

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

const MAX_WIDGET_WIDTH = 329;

const CONFIG_SIZE_MAP:any = {
  1: 'small',
  2: 'medium',
  3: 'large'
}

const WIDGET_BORDER_RADIUS = 28;

const WIDGET_GAP = 200;
const SELECTED_NODE_BOX_COLOR = '#fbbf24';
const SELECTED_NODE_BOX_WIDTH = 0.5;

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
  private cropImage: Konva.Image | null = null;
  private selectionBoxes = new Map<Konva.Node, Konva.Rect>();
  /** 选中变化订阅器（供 React 浮层监听） */
  private selectionListeners = new Set<(node: Konva.Node[] | null) => void>();
  /** 布局变化订阅器（stage 缩放/平移、transformer 变换时触发，用于 React 浮层重定位） */
  private layoutListeners = new Set<() => void>();
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
      borderStrokeWidth: 1,
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
    this.stage.on('xChange yChange scaleXChange scaleYChange', this.emitLayoutChange);
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
    const command = this.undoStack.pop();
    if (!command) return;
    command.undo();
    this.redoStack.push(command);
    this.emitHistoryChange();
  }

  redo() {
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
  private handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
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

  /** 当前全部选中节点 */
  getSelectedNodes(): Konva.Node[] {
    return [...this.selectedNodes];
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

    this.contentLayer.getChildren().concat(this.wallPaperLayer.getChildren()).forEach((node) => {
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
        if (widgetNode) {
          this.select(widgetNode);
        }
        this.emitLayoutChange();
      },
      undo: () => {
        const idx = this.nodes.indexOf(widget);
        if (idx >= 0) {
          this.nodes.splice(idx, 1);
        }
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

  addWallPaper() {
    const { x, y } = this.getEmptyXY()
    const wallPaper = new WallPaper({ x, y });
    this.nodes.push(wallPaper);
    if (wallPaper.node) {
      this.wallPaperLayer.add(wallPaper.node);
      this.ensureWallPaperAnimation();
    }
  }


  createDeleteSelectNodesCommand(): EditorCommand | null {
    const selectedNodes = this.getSelectedNodes();
    if (!selectedNodes.length) return null;

    const deleteable = selectedNodes.every((node) => node.getAttr('deleteable') === true);

    if (!deleteable) {
      console.warn('[EditorCore] delete blocked: all selected nodes must set deleteable=true');
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
        const nodeIndexes = removedNodeEntries.map(({ index }) => index).sort((a, b) => b - a);
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

  addIconPack() {
    const { x, y } = this.getEmptyXY()

    const iconPack = new IconPack({ x, y });
    this.nodes.push(iconPack);
    if (iconPack.node) {
      this.contentLayer.add(iconPack.node);
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
    if (!target || !(target instanceof Konva.Image)) return;
    this.cropImage = target;
    const cropImage = target.clone();
    const widgetItem = target.getParent();
    this.cropImage.visible(false);

    if (!widgetItem || !(widgetItem instanceof Konva.Group)) return;
    const cropWidgetItem = widgetItem.clone();

    // 进入裁剪
    this.zoomable = false; // 禁止缩放
    this.stage.draggable(false); // 禁止画布平移
    this.croping = true; // 正在裁剪
    this.cropLayer.destroyChildren();
    this.deselect();
    const cropLayer = this.cropLayer;

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

    // 裁剪的图片以及
    cropWidgetItem.x(hole.x);
    cropWidgetItem.y(hole.y);
    // 添加裁剪图片
    cropImage.x(hole.x);
    cropImage.y(hole.y);
    cropImage.draggable(true);

    // 拖动 / 缩放共用：不露白 + 最小缩放（缩放时按锚点固定对角）
    const applyCropCoverConstraints = (
      dragPos?: { x: number; y: number },
    ): { x: number; y: number } | undefined => {
      const iw = cropImage.width();
      const ih = cropImage.height();
      if (!iw || !ih) return dragPos;

      const minScale = Math.max(hole.width / iw, hole.height / ih);
      const clampPosLocal = (x: number, y: number) => {
        const imgW = iw * cropImage.scaleX();
        const imgH = ih * cropImage.scaleY();
        return {
          x: Math.max(hole.x + hole.width - imgW, Math.min(hole.x, x)),
          y: Math.max(hole.y + hole.height - imgH, Math.min(hole.y, y)),
        };
      };

      if (dragPos) {
        const local = cropLayer.getAbsoluteTransform().copy().invert().point(dragPos);
        return cropLayer.getAbsoluteTransform().point(clampPosLocal(local.x, local.y));
      }

      const sx = cropImage.scaleX();
      const sy = cropImage.scaleY();
      if (sx < minScale || sy < minScale) {
        const x = cropImage.x();
        const y = cropImage.y();
        const brX = x + iw * sx;
        const brY = y + ih * sy;
        const anchor = this.transformer.getActiveAnchor();
        cropImage.scale({ x: minScale, y: minScale });
        switch (anchor) {
          case 'top-left':
            cropImage.position({ x: brX - iw * minScale, y: brY - ih * minScale });
            break;
          case 'top-right':
            cropImage.position({ x, y: brY - ih * minScale });
            break;
          case 'bottom-left':
            cropImage.position({ x: brX - iw * minScale, y });
            break;
          default:
            cropImage.position({ x, y });
            break;
        }
      }
      cropImage.position(clampPosLocal(cropImage.x(), cropImage.y()));
      return undefined;
    };

    cropImage.dragBoundFunc((pos: any) => applyCropCoverConstraints(pos) ?? pos);
    cropImage.on('transform', () => applyCropCoverConstraints());

    this.cropLayer.add(cropImage, cropWidgetItem);

    this.transformer.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right']);
    this.transformer.nodes([cropImage]);

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
    maskShape.cache({ x: view.x, y: view.y, width: view.width, height: view.height, pixelRatio: scale });
    // 命中按 cache 的 alpha：镂空区透明 → 不拦截，图片可交互；四周半透明 → 拦截点击
    maskShape.drawHitFromCache();

    this.cropLayer.batchDraw();
    this.cropLayer.visible(true);
  }

  closeCrop() {
    this.zoomable = true; // 禁止缩放
    this.stage.draggable(true); // 禁止画布平移
    this.croping = false; // 正在裁剪
    this.cropLayer.destroyChildren();
    this.cropLayer.visible(false);
    this.cropImage?.visible(true);
    this.transformer.nodes([]);
    this.transformer.enabledAnchors([]);
  }

  confirmCrop() {
    if (!this.croping || !this.cropImage) return;
    // 退出裁剪模式，并恢复原图显示
    this.closeCrop();
    this.refreshSelectionLayout();
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
    this.historyListeners.clear();
    this.wallPaperAnim?.stop();
    this.wallPaperAnim = null;

    this.stage.destroy();
  }
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

class BaseNode {
  public width: number;
  public height: number;
  public x: number;
  public y: number;
  public dataJson: any;
  public gap: number;
  public ratio: number;
  public node: Konva.Group;
  constructor(options: any) {
    const { x, y, data, ratio } = options
    this.width = 0;
    this.height = 0;
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.dataJson = data;
    this.gap = 50;
    this.ratio = ratio ?? 2;
    this.node = new Konva.Group({
      x: this.x,
      y: this.y,
      selected: true,
      deleteable: true,
      packable: true,
    });
  }

  initFullBox(): void {
      // #0ea5e9
      // #a78bfa
      // #f9a8d4
      // #fbbf24
      // 加完所有 widget 后重算一次完整 bbox（覆盖两行）
      const fullBbox = this.node.getClientRect({ skipTransform: true });

      // 比 widget 群外扩 pad px，视觉留白
      const pad = 40;

      const w = fullBbox.width + pad * 2;
      const h = fullBbox.height + pad * 2;
      this.width = w;
      this.height = h;

      const bg = new Konva.Rect({
        x: fullBbox.x - pad,
        y: fullBbox.y - pad,
        width: w,
        height: h,
        fill: '#10b981', // 薄荷绿；想换色见下方 BG_PALETTE
        opacity: 0.1,
        cornerRadius: pt(3),
      });
      // 包含背景边距后的总尺寸
      this.node.width(w);
      this.node.height(h);
      this.node.add(bg);
      bg.moveToBottom();
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

  clipFuncBorderRadius(ctx: any, radius: number, widthPx: number, heightPx: number) {
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
  }

  createBgImage(params: any) {
    const { src, w, h } = params;
    if (!src) return;
    const imageObj = new Image();
    imageObj.src = src;
    imageObj.crossOrigin = 'anonymous'; // 之后想 toDataURL 导出时避免污染 canvas
    // 主要 API:
    const image = new Konva.Image({
      x: 0,
      y: 0,
      image: imageObj,
      width: w,
      height: h,
      selected: true,
    });
    imageObj.onload = () => {
      // image.width(pt(imageObj.width/this.ratio));
      // image.height(pt(imageObj.height/this.ratio));
    }
    return image;
  }

}


class Time extends BaseNode {
  private iosNodes: any;
  private androidNodes: any;
  constructor(options: any) {
    super(options);
    this.iosNodes = {};
    this.androidNodes = {};
    this.init();
  }

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
    2: ({ h, padding, time, day, date }) => {
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

  init() {
    const { ios, android } = this.dataJson;
    if (ios) {
      ios.sizes.forEach((iosData: any) => {
        const sizeKey = CONFIG_SIZE_MAP[iosData.size];
        const wdget = this.createWidget({agent: 'ios', ...iosData, sizeKey: sizeKey})
        this.iosNodes[sizeKey] = wdget;
      });
    }
    if (android) {
      android.sizes.forEach((iosData: any) => {
        const sizeKey = CONFIG_SIZE_MAP[iosData.size];
        const wdget = this.createWidget({agent: 'android', ...iosData, sizeKey: sizeKey})
        this.androidNodes[sizeKey] = wdget;
      });
    }

    ['large', 'medium', 'small'].forEach((sizeKey: string) => {
      const bbox = this.node.getClientRect({ skipTransform: true });
      // 纵向基线要用包围盒底边(bbox.y + bbox.height)，否则 bbox.y 偏移会吃掉行间距
      const nextY = bbox.height === 0 ? 0 : bbox.y + bbox.height + 20;
      const iosWidget = this.iosNodes[sizeKey];
      const androidWidget = this.androidNodes[sizeKey];
      const cursorX = 0;
      if (iosWidget) {
        iosWidget.x(cursorX);
        iosWidget.y(nextY);
        this.node.add(iosWidget)
      }
      if (androidWidget) {
        androidWidget.x(pt(MAX_WIDGET_WIDTH) + this.gap);
        androidWidget.y(nextY);
        this.node.add(androidWidget)
      }
    })

    this.initFullBox();
  }

  createWidget(options: any) {
    const { agent, name, sizeKey, time, day, date, padding, layoutType, src } = options;
    const sizeCfg = WIDGET_SIZE[sizeKey];
    const widthPx = pt(sizeCfg.width);
    const heightPx = pt(sizeCfg.height);
    const radius = pt(WIDGET_BORDER_RADIUS);
    // 用 clipFunc 圆角裁剪整个 group：让无圆角的 bgImage 也被裁出圆角（单纯靠 z-index 遮挡做不到）
    const widgetGroup = new Konva.Group({
      x: 0,
      y: 0,
      // selected: true,
      clipFunc: (ctx: any) => this.clipFuncBorderRadius(ctx, radius, widthPx, heightPx),
    });
    // const rect = this.createRect({ w: widthPx, h: heightPx });
    const title = this.createTitle({x: 5, y: heightPx + 10, name: `${name}_${agent}` })

    const timeNode = this.createDes({ ...time, text: '10:09' });
    const dayNode = this.createDes({ ...day, text: 'Wednesday' });
    const dateNode = this.createDes({ ...date, text: 'March 23' });
    const bgImage = this.createBgImage({ w:widthPx, h: heightPx, src });
    const items = [bgImage, timeNode, dayNode, dateNode];

    const layoutFn = this.layoutFns[2];
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

    widgetGroup.add(...items);

    const group = new Konva.Group({ selected: true });
    group.add(title);
    group.add(widgetGroup);

    return group;
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
    imageObj.src = src ?? 'http://localhost:5173/mock/widgets_large_time.jpg';
    imageObj.crossOrigin = 'anonymous'; // 之后想 toDataURL 导出时避免污染 canvas
    // 主要 API:
    const image = new Konva.Image({
      x: 0,
      y: 0,
      image: imageObj,
      width: w,
      height: h,
      selected: true,
      cropable: true,
    });
    imageObj.onload = () => {
      // image.width(pt(imageObj.width/this.ratio));
      // image.height(pt(imageObj.height/this.ratio));
    }
    return image;
  }
}

class WallPaper extends BaseNode {
  constructor(options: any) {
    super(options);
    this.init();
  }
  init() {
    const rect = this.createRect({ w: 887, h: 1926 });
    this.node.add(rect);
    const video = document.createElement('video');
    video.src =
      'http://localhost:5100/live_wallpaper.mp4';
    video.play();
    video.loop = true;
    video.muted = true;
    video.autoplay = true;
    const group = this.node;
    video.addEventListener('loadedmetadata', () => {
      rect.width(video.videoWidth);
      rect.height(video.videoHeight);
      const videoNode = new Konva.Image({
        image: video,
        x: 0,
        y: 0,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      group.add(videoNode);
    });
    this.initFullBox();
  };
}

class IconPack extends BaseNode {
  constructor(options: any) {
    super(options);
    this.init();
  }
  init() {
    // mock数据
    const { icon_pack } = mockdata;
    let cursorX = 0;
    let cursorY = 0;
    let col = 4;
    icon_pack.forEach((icon: string) => {
      const widthPx = pt(180);
      const heightPx = pt(180);
      const radius = pt(WIDGET_BORDER_RADIUS);

      const group = new Konva.Group({
        x: cursorX,
        y: cursorY,
        clipFunc: (ctx: any) => this.clipFuncBorderRadius(ctx, radius, widthPx, heightPx)
      });
      const iconImage = this.createBgImage({ w: widthPx, h: heightPx, src: `http://localhost:5100/appicons/${icon}` });
      if (iconImage) {
        group.add(iconImage)
      }
      col--;
      if (!col) {
        col = 4;
        cursorX = 0;
        cursorY += (heightPx + this.gap * 2);
      } else {
        cursorX += (widthPx + this.gap * 2);
      }
      this.node.add(group)
    })
    this.initFullBox();
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