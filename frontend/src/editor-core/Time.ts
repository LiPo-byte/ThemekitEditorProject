import Konva from "konva";
import BaseNode, { pt, CONFIG_SIZE_MAP, WIDGET_BORDER_RADIUS, WIDGET_SIZE, WHITE_PIXEL_DATA_URL } from "./WidgetBaseNode";
const iosSystem = 'IOS';
const androidSystem = 'Android';
export default class Time extends BaseNode {
    private iosNodes: any;
    private androidNodes: any;
    private iosWidgetGroup: any;
    private androidWidgetGroup: any;
    // private titlesNodes: any;
    // private backgroundImageNodes: any;
    constructor(options: any) {
      super(options);
      this.iosNodes = {};
      this.androidNodes = {};
      this.iosWidgetGroup = null;
      this.androidWidgetGroup = null;
      // this.titlesNodes = new Map();
      // this.backgroundImageNodes = new Map();
      this.node.setAttr('title', 'Time');
      this.node.setAttr('editProps', { name: 'Time' });
      this.initLayoutFns();
      this.init();
    }

    /** 布局策略表：layoutType (number) -> 摆位函数；新增布局只需要加一个 key */
    initLayoutFns() {
      this.layoutFns = {
        // 0：上下堆叠 —— time / day / date 顺序从上往下
        0: ({ widget }: any) => {
          const time = widget.findOne(
            (node: any) => node.getAttr('itemKey') === 'time',
          );
          const day = widget.findOne(
            (node: any) => node.getAttr('itemKey') === 'day',
          );
          const date = widget.findOne(
            (node: any) => node.getAttr('itemKey') === 'date',
          );
          const timeHeight = time.height();
          const dayHeight = day.height();
          const dateHeight = date.height();
          const {
            editProps: { topSpacing, bottomSpacing },
          } = day.attrs;
          const {
            editProps: { textAlignment },
          } = widget.getParent().attrs;
          const {
            editProps: { padding },
          } = widget.attrs;
          const paddingPx = pt(padding);
          const widgetWidth = widget.width();
          const widgetHeight = widget.height();

          const alignX = (node: any) => {
            const nodeWidth = node.width();
            if (textAlignment === 2) {
              return (widgetWidth - nodeWidth) / 2;
            }
            if (textAlignment === 3) {
              return widgetWidth - paddingPx - nodeWidth;
            }
            return paddingPx;
          };

          const totalHeight =
            timeHeight +
            pt(topSpacing) +
            dayHeight +
            pt(bottomSpacing) +
            dateHeight;
          const startY = Math.max(0, (widgetHeight - totalHeight) / 2);

          time.x(alignX(time));
          time.y(startY);

          day.x(alignX(day));
          day.y(startY + timeHeight + pt(topSpacing));

          date.x(alignX(date));
          date.y(
            startY + timeHeight + pt(topSpacing) + dayHeight + pt(bottomSpacing),
          );
        },
        // 0-1：仅展示 time，单组件按对齐方式横向摆放，纵向居中
        '0-1': ({ widget }: any) => {
          const time = widget.findOne(
            (node: any) => node.getAttr('itemKey') === 'time',
          );
          const {
            editProps: { textAlignment },
          } = widget.getParent().attrs;
          const {
            editProps: { padding },
          } = widget.attrs;
          const paddingPx = pt(padding);
          const widgetWidth = widget.width();
          const widgetHeight = widget.height();
          const timeWidth = time.width();
          const timeHeight = time.height();

          let timeX = paddingPx;
          if (textAlignment === 2) {
            timeX = (widgetWidth - timeWidth) / 2;
          } else if (textAlignment === 3) {
            timeX = widgetWidth - paddingPx - timeWidth;
          }

          time.x(timeX);
          time.y(Math.max(0, (widgetHeight - timeHeight) / 2));
        },
      };
    }

    init() {
      const { ios, android } = this.dataJson;
      this.iosWidgetGroup = new Konva.Group({
        x: 0,
        y: 0,
        selected: true,
        packable: true,
        title: `Time-${iosSystem}`,
        editProps: {
          textAlignment: ios.textAlignment,
          isLockScreen: ios.isLockScreen,
          system: iosSystem,
        },
      });
      this.androidWidgetGroup = new Konva.Group({
        x: 0,
        y: 0,
        selected: true,
        packable: true,
        title: `Time-${androidSystem}`,
        editProps: {
          textAlignment: android.textAlignment,
          isLockScreen: android.isLockScreen,
          system: androidSystem,
        },
      });

      this.node.add(this.androidWidgetGroup, this.iosWidgetGroup);
      if (ios) {
        ios.sizes.forEach((iosData: any) => {
          const sizeKey = CONFIG_SIZE_MAP[iosData.size];
          const wdget = this.createWidget({
            agent: iosSystem,
            ...iosData,
            sizeKey: sizeKey,
          });
          this.iosNodes[sizeKey] = wdget;
        });
      }
      if (android) {
        android.sizes.forEach((iosData: any) => {
          const sizeKey = CONFIG_SIZE_MAP[iosData.size];
          const wdget = this.createWidget({
            agent: androidSystem,
            ...iosData,
            sizeKey: sizeKey,
          });
          this.androidNodes[sizeKey] = wdget;
        });
      }

      let cursorY = 0;
      ['large', 'medium', 'small'].forEach((sizeKey: string) => {
        const iosWidget = this.iosNodes[sizeKey];
        const androidWidget = this.androidNodes[sizeKey];
        if (iosWidget) {
          iosWidget.x(0);
          iosWidget.y(cursorY);
        }
        if (androidWidget) {
          androidWidget.x(0);
          androidWidget.y(cursorY);
        }
        cursorY += iosWidget ? iosWidget.height() + 50 : 0;
      });


      this.createFullBox({ node: this.iosWidgetGroup, color: '#fbbf24' });
      this.createFullBox({ node: this.androidWidgetGroup, color: '#fbbf24' });

      const { width: iosGroupWidth } = this.iosWidgetGroup.getClientRect({
        skipTransform: true,
      });
      this.androidWidgetGroup.x(iosGroupWidth + this.gap);

      this.createFullBox({
        color: 'rgb(243, 253, 246)'
      });

      this.render();
    }

    createWidget(options: any) {
      const {
        agent,
        name,
        sizeKey,
        time,
        day,
        date,
        padding,
        layoutType,
        source,
      } = options;

      const sizeCfg = WIDGET_SIZE[sizeKey];
      const widthPx = pt(sizeCfg.width);
      const heightPx = pt(sizeCfg.height);

      const crop_props = {
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        translateX: 0,
        translateY: 0,
      };
      const widgetGroup = new Konva.Group({
        x: 0,
        y: 0,
        width: widthPx,
        height: heightPx,
        selected: true,
        system: agent,
        layoutType: layoutType,
        layoutNode: true,
        cropable: !!source,
        editProps: {
            padding,
            name,
            source,
            crop_props: crop_props,
        },
      });

      const bgRect = this.createRect({ w: widthPx, h: heightPx })
      const bgImage = this.createSource({ w: widthPx, h: heightPx, source, crop_props });
      let items:any = [bgRect, bgImage];
      if (time) {
        const timeNode = this.createText({
          ...time,
          text: '10:09',
          key: 'time',
        });
        items.push(timeNode);
      }
      if (day) {
        const dayNode = this.createText({
          ...day,
          text: 'Wednesday',
          key: 'day',
        });
        items.push(dayNode);
      }
      if (date) {
        const dateNode = this.createText({
          ...date,
          text: 'March 23',
          key: 'date',
        });
        items.push(dateNode);
      }
      this.backgroundImageNodes.set(widgetGroup, bgImage);
      widgetGroup.add(...items);

      if (agent === iosSystem) {
        this.iosWidgetGroup.add(widgetGroup);
      }
      if (agent === androidSystem) {
        this.androidWidgetGroup.add(widgetGroup);
      }

      return widgetGroup;
    }

    // render() {
    //   const groups = this.renderNodes;
    //   groups.forEach((wg: Konva.Group) => {
    //     this.addTitle(wg, 15);
    //     const candidates = wg.find((node: Konva.Node) => {
    //       return (
    //         !!node.getAttr('editProps') || node.getAttr('layoutNode') === true
    //       );
    //     });
    //     const layoutNodes = new Set<Konva.Node>();
    //     candidates.forEach((node: Konva.Node) => {
    //       if (node.getAttr('editProps')) {
    //         this.decorationNode(node);
    //       }
    //       if (node.getAttr('layoutNode') === true) {
    //         layoutNodes.add(node);
    //       }
    //     });
    //     layoutNodes.forEach((node) => {
    //       this.layoutNode(node);
    //     });
    //     layoutNodes.forEach((node) => {
    //       this.addTitle(node);
    //     });
    //   });
    //   this.node.getLayer()?.batchDraw(); // 最后统一一次提交绘制
    // }

    // addTitle(node: Konva.Node, textSize?: Number, text?: string) {
    //   if (!text) {
    //       const { name, system } = node.getAttr('editProps') || {};
    //       text = name || system;
    //   }
    //   if (this.titlesNodes.has(node)) {
    //     const title = this.titlesNodes.get(node);
    //     title.text(text);
    //   } else {
    //     const rect = node.getClientRect({ relativeTo: this.node });
    //     const { x, y, width, height } = rect;
    //     const titleNode = this.createTitle({
    //       x: x + 5,
    //       y: y + height + 10,
    //       text: text,
    //       w: width,
    //       textSize,
    //     });
    //     this.node.add(titleNode);
    //     this.titlesNodes.set(node, titleNode);
    //   }
    // }

    // renderSource(node: Konva.Node) {
    //   const { source, crop_props, w, h, } = node.getAttr('editProps') || {};
    //   if (this.backgroundImageNodes.has(node)) {
    //     const bgImage = this.backgroundImageNodes.get(node);
    //     const bgImageInstance = bgImage.findOne(
    //       (n: Konva.Node) => n instanceof Konva.Image,
    //     );
    //     node.setAttr('cropable', !!source);

    //     const nextSrc = source || WHITE_PIXEL_DATA_URL;
    //     const currentSrc = bgImageInstance.image()?.src || '';
    //     // src 没变：只重算 crop 参数，不重新 load，避免无关属性变更导致图片闪烁
    //     if (currentSrc === nextSrc) {
    //       this.cropParamSource(bgImageInstance, crop_props);
    //       node.getLayer()?.batchDraw();
    //       return;
    //     }

    //     const imageObj = new Image();
    //     imageObj.crossOrigin = 'anonymous'; // 必须在 src 之前设置才生效
    //     imageObj.onload = () => {
    //       bgImageInstance.image(imageObj);
    //       this.cropParamSource(bgImageInstance, crop_props);
    //       node.getLayer()?.batchDraw();
    //     };
    //     imageObj.onerror = () => {
    //       // bgImageInstance.image(imageObj);
    //       node.setAttr('cropable', false);
    //     };
    //     imageObj.src = nextSrc; // src 必须在 onload/onerror 绑定后赋值，缓存命中时事件才不会丢
    //     this.cropParamSource(bgImageInstance, crop_props);
    //   }
    // }

    // // 定位节点
    // layoutNode = (widget: Konva.Node) => {
    //   const layoutType = widget.getAttr('layoutType');
    //   const layoutFn = this.layoutFns[layoutType || 0];
    //   if (layoutFn) {
    //     layoutFn({ widget: widget });
    //   } else {
    //     console.warn('[Time] unknown layoutType:');
    //   }
    // };

    // // 装饰节点
    // decorationNode(node: Konva.Node) {
    //   const getValue = (key: string, value: any): any => {
    //     const needPt = ['textHeight', 'textSize'];
    //     if (needPt.includes(key) && typeof value === 'number') {
    //       return pt(value);
    //     }
    //     return value;
    //   };
    //   const temp: any = {
    //     alpha: 'opacity',
    //     textHeight: 'height',
    //     font: 'fontFamily',
    //     textSize: 'fontSize',
    //     textColor: 'fill',
    //   };
    //   const editProps = node.getAttr('editProps');
    //   const attrs: any = {};
    //   Object.keys(editProps).forEach((key: string) => {
    //     if (key === 'crop_props') {
    //       this.renderSource(node);
    //     }
    //     if (temp[key]) {
    //       attrs[temp[key]] = getValue(key, editProps[key]);
    //     }
    //   });
    //   node.setAttrs(attrs);
    // }

    // createTitle(params: any) {
    //   const { x, y, text, w, textSize, align } = params;
    //   const title = new Konva.Text({
    //     x,
    //     y,
    //     text,
    //     fontSize: pt(textSize || 10),
    //     fontFamily: 'Calibri',
    //     fill: 'green',
    //     width: w,
    //     align: align || 'right',
    //   });
    //   return title;
    // }
  }