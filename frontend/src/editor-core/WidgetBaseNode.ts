import Konva from 'konva';

const PT_TO_PX = 4 / 3;
export const pt = (n: number) => n * PT_TO_PX;
export const WIDGET_BORDER_RADIUS = 28;

export const MAX_WIDGET_WIDTH = 329;

export const CONFIG_SIZE_MAP: any = {
  1: 'small',
  2: 'medium',
  3: 'large',
};
export const WIDGET_SIZE: any = {
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
  };
export const WHITE_PIXEL_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlH0mQAAAAASUVORK5CYII=';

export interface ExportTransformedImageOptions {
  width?: number;
  height?: number;
  imageUrl: string;
  /** 裁剪起点偏移（相对原图左上角） */
  translateX?: number;
  translateY?: number;
  /** 对原图做缩放（以原图中心为基准） */
  scale?: number;
  /** 对原图做旋转（角度制，以原图中心为基准） */
  rotate?: number;
  /** 导出像素倍率，越大越清晰（默认取设备像素比，范围 1-4） */
  pixelRatio?: number;
  mimeType?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
}

const loadImageElement = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });

export default class BaseNode {
    public width: number;
    public height: number;
    public x: number;
    public y: number;
    public dataJson: any;
    public gap: number;
    public ratio: number;
    public node: Konva.Group;
    private titlesNodes: any;
    public backgroundImageNodes: any;
    public renderNodes: any;
    public layoutFns: any;
    constructor(options: any) {
      const { x, y, data, ratio } = options;
      this.width = 0;
      this.height = 0;
      this.x = x ?? 0;
      this.y = y ?? 0;
      this.dataJson = data;
      this.gap = 50;
      this.ratio = ratio ?? 2;
      this.titlesNodes = new Map();
      this.backgroundImageNodes = new Map();
      this.renderNodes = [];
      this.layoutFns = {};
      this.node = new Konva.Group({
        x: this.x,
        y: this.y,
        selected: true,
        deleteable: true,
        packable: true,
        instance: this,
      });
    }

    createFullBox({
        node,
        color,
        opacity,
    } : {
        node?: Konva.Group,
        color?: string,
        opacity?: number,
    }): void {
      if(!node) node = this.node;
      const fullBbox = node.getClientRect({ skipTransform: true });
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
        fill: color || 'rgb(243, 253, 246)',
        opacity: opacity || 1,
        cornerRadius: pt(3),
      });
      // 包含背景边距后的总尺寸
      node.width(w);
      node.height(h);
      node.add(bg);
      bg.moveToBottom();
    }

    createRect(params: any) {
      const { x = 0, y = 0, w, h, radius } = params;
      const rect = new Konva.Rect({
        x: x,
        y: y,
        width: w,
        height: h,
        // fill: '#ffffff',
        cornerRadius: radius || pt(WIDGET_BORDER_RADIUS),
        // editProps: {
        //     radius: radius || WIDGET_BORDER_RADIUS
        // }
      });
      return rect;
    }

    clipFuncBorderRadius(
      ctx: any,
      radius: number,
      widthPx: number,
      heightPx: number,
    ) {
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
        const { source = '', w, h } = params;
        const imageObj = new Image();
        imageObj.src = source || WHITE_PIXEL_DATA_URL;
        imageObj.crossOrigin = 'anonymous'; // 之后想 toDataURL 导出时避免污染 canvas

        const image = new Konva.Image({
          x: 0,
          y: 0,
          image: imageObj,
          width: w,
          height: h,
          cropInstance: true,
        });
        return image;
    }

    addTitle(node: Konva.Node, textSize?: Number, text?: string) {
        if (typeof text === 'undefined') {
            const { name, system } = node.getAttr('editProps') || {};
            text = name || system;
        }
        if (this.titlesNodes.has(node)) {
          const title = this.titlesNodes.get(node);
          title.text(text || '');
        } else {
          const rect = node.getClientRect({ relativeTo: this.node });
          const { x, y, width, height } = rect;
          const titleNode = this.createTitle({
            x: x + 5,
            y: y + height + 10,
            text: text || '',
            w: width,
            textSize,
          });
          this.node.add(titleNode);
          this.titlesNodes.set(node, titleNode);
        }
    }
    createTitle(params: any) {
        const { x, y, text, w, textSize, align } = params;
        const title = new Konva.Text({
            x,
            y,
            text,
            fontSize: pt(textSize || 10),
            fontFamily: 'Calibri',
            fill: 'green',
            width: w,
            align: align || 'right',
        });
        return title;
    }

    /** 只负责造节点，不负责定位（定位交给 layoutFns） */
    createText(params: any) {
        const { text, key } = params;
        return new Konva.Text({
            text,
            selected: true,
            // align: 'center',
            verticalAlign: 'middle',
            editProps: { ...params },
            itemKey: key,
        });
    }

    render() {
        this.addTitle(this.node, 15);
        const candidates = this.node.find((node: Konva.Node) => {
          return (
            !!node.getAttr('editProps') || node.getAttr('layoutNode') === true
          );
        });
        const layoutNodes = new Set<Konva.Node>();
        candidates.forEach((node: Konva.Node) => {
            if (node.getAttr('editProps')) {
                this.decorationNode(node);
            }
            if (node.getAttr('layoutNode') === true) {
                layoutNodes.add(node);
            }
            this.addTitle(node);
        });
        layoutNodes.forEach((node) => {
          this.layoutNode(node);
        });
        this.node.getLayer()?.batchDraw(); // 最后统一一次提交绘制
    }

    // // 定位节点
    layoutNode = (widget: Konva.Node) => {
        const layoutType = widget.getAttr('layoutType');
        const layoutFn = this.layoutFns[layoutType || 0];
        if (layoutFn) {
            layoutFn({ widget: widget });
        } else {
            console.warn('[Time] unknown layoutType:');
        }
    };

    // 装饰节点
    decorationNode(node: Konva.Node) {
        const getValue = (key: string, value: any): any => {
            const needPt = ['textHeight', 'textSize', 'cornerRadius'];
            if (needPt.includes(key) && typeof value === 'number') {
                return pt(value);
            }
            return value;
        };
        const temp: any = {
            alpha: 'opacity',
            textHeight: 'height',
            font: 'fontFamily',
            textSize: 'fontSize',
            textColor: 'fill',
        };
        const decorationFuns:any = {
            crop_props: (node: Konva.Node) => {
                this.renderSource(node);
            },
            radius: (node: Konva.Node) => {
                const { radius } = node.getAttr('editProps') || {};
                node.setAttr('clipFunc', (ctx: any) => this.clipFuncBorderRadius(ctx, pt(radius), node.width(), node.height()))
            }
        }
        const editProps = node.getAttr('editProps');
        const attrs: any = {};
        Object.keys(editProps).forEach((key: string) => {
            const decorationFun = decorationFuns[key];
            if (decorationFun) {
                decorationFun(node)
            } else {
                if (temp[key] !== undefined) {
                    attrs[temp[key]] = getValue(key, editProps[key]);
                }
            }
        });
        node.setAttrs(attrs);
    }

        /**
     * 用 Group(clip) + Konva.Image 替代 Rect + fillPatternImage，
     * 避免 fillPatternRepeat: 'no-repeat' 在 Rect 边缘出现 1px 描边的伪影
     * （根因：canvas pattern 在边界抗锯齿时采样到了图外的透明像素）。
     *
     * 与 createBgImage 调用签名一致；返回的 Group 上额外挂了 .image() 方法，
     * 兼容 changeBackGroundImage 里 bgImage.image() / bgImage.image(img) 的用法。
     */
    createSource(params: any) {
        const {
            source = '',
            w,
            h,
            x = 0,
            y = 0,
            radius,
        } = params;

        const imageObj = new Image();
        imageObj.crossOrigin = 'anonymous'; // 必须在 src 之前设置才生效
        imageObj.src = source || WHITE_PIXEL_DATA_URL;

        // 外层 Group：把可视区裁剪到 w×h，等价于原 Rect 的边界（含圆角时改用 clipFunc）
        const group = new Konva.Group({
            x,
            y,
            width: w,
            height: h,
            cropInstance: true,
            editProps: {
              radius,
            },
            // clip: { x: 0, y: 0, width: w, height: h },
            clipFunc: (ctx: any) =>
            this.clipFuncBorderRadius(ctx, pt(radius || WIDGET_BORDER_RADIUS), w, h),
        });

        // 内层 Image：承载图片本身以及 crop 变换（位移/缩放/旋转）
        // 语义：
        //   - 初始（translate=0）时，图片左上角对齐 clip 的 (0,0)
        //   - scale / rotation 绕图片中心
        //   - translateX/Y 在上述基础上叠加平移
        // 精确的 x/y/offset 依赖图片真实尺寸，在 onload 里设。
        const inner = new Konva.Image({
            x: 0,
            y: 0,
            width: w,
            height: h,
            offsetX: 0,
            offsetY: 0,
            image: undefined,
            listening: false,
            perfectDrawEnabled: false,
            shadowForStrokeEnabled: false,
        });

        group.add(inner);

        // Group.getClientRect() 默认是并集所有子节点的边界，会忽略 clip，
        // 导致选框跟着内层 Image 的原始尺寸走。这里强制按 w×h 返回。
        // 复用 Konva 内部 _transformedRect 处理 transform 与 relativeTo，避免自己算错。
        (group as any).getClientRect = function (config: any = {}) {
            const localRect = { x: 0, y: 0, width: w, height: h };
            if (config.skipTransform) return localRect;
            return this._transformedRect(localRect, config.relativeTo);
        };


        return group;
    }

    renderSource(node: Konva.Node) {
        const { source, crop_props, } = node.getAttr('editProps') || {};
        if (this.backgroundImageNodes.has(node)) {
          const bgImage = this.backgroundImageNodes.get(node);
          const bgImageInstance = bgImage.findOne(
            (n: Konva.Node) => n instanceof Konva.Image,
          );
          node.setAttr('cropable', !!source);

          const nextSrc = source || WHITE_PIXEL_DATA_URL;
          const currentSrc = bgImageInstance.image()?.src || '';
          // src 没变：只重算 crop 参数，不重新 load，避免无关属性变更导致图片闪烁
          if (currentSrc === nextSrc) {
            this.cropParamSource(bgImageInstance, crop_props);
            node.getLayer()?.batchDraw();
            return;
          }

          const imageObj = new Image();
          imageObj.crossOrigin = 'anonymous'; // 必须在 src 之前设置才生效
          imageObj.onload = () => {
            bgImageInstance.image(imageObj);
            if (!source) {
                // 做占位符
                imageObj.width = 500;
                imageObj.height = 500;
            }
            this.cropParamSource(bgImageInstance, crop_props);
            node.getLayer()?.batchDraw();
          };
          imageObj.onerror = () => {
            // bgImageInstance.image(imageObj);
            node.setAttr('cropable', false);
          };
          imageObj.src = nextSrc; // src 必须在 onload/onerror 绑定后赋值，缓存命中时事件才不会丢
          this.cropParamSource(bgImageInstance, crop_props);
        }
    }

    cropParamSource(imageInstance: any, cropParams: any) {
        const imageObj = imageInstance.image();
        if (!imageObj) return;
        const {
          scaleX = 1,
          scaleY = 1,
          rotation = 0,
          translateX = 0,
          translateY = 0,
        } = cropParams;
        imageInstance.width(imageObj.width);
        imageInstance.height(imageObj.height);
        // 锚点 = 图片中心 → scale/rotation 绕图片中心
        imageInstance.offsetX(imageObj.width / 2);
        imageInstance.offsetY(imageObj.height / 2);
        // (x, y) 是 offset 点在父坐标系的位置；让锚点落在 (imgW/2, imgH/2)
        // 时，图片左上角正好在 (0, 0)，再叠加用户位移。
        imageInstance.x(imageObj.width / 2 + translateX);
        imageInstance.y(imageObj.height / 2 + translateY);
        imageInstance.scaleX(scaleX);
        imageInstance.scaleY(scaleY);
        imageInstance.rotation(rotation);
    }
  }