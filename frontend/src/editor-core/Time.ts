import Konva from "konva";
import { nanoid } from "nanoid";
import BaseNode, { pt, CONFIG_SIZE_MAP, WIDGET_SIZE } from "./WidgetBaseNode";
import JSZip from "jszip";
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
      this.category = 'widget';
      this.subtype = 'time';
      // this.titlesNodes = new Map();
      // this.backgroundImageNodes = new Map();
      this.node.setAttr('title', 'Time');
      this.node.setAttr('editProps', { name: 'Time' });
      this.node.setAttr('snapshotCategory', 'widget');
      this.node.setAttr('snapshotType', 'time');
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
        // 1（兼容旧 key "0-1"）：仅展示 time，单组件按对齐方式横向摆放，纵向居中
        1: ({ widget }: any) => {
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
        '0-1': ({ widget }: any) => this.layoutFns[1]({ widget }),
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
        // serialize 时用于把 editProps 回填到 data.ios
        snapshotDataPath: 'ios',
        snapshotNodeId: nanoid(),
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
        // serialize 时用于把 editProps 回填到 data.android
        snapshotDataPath: 'android',
        snapshotNodeId: nanoid(),
      });

      this.node.add(this.androidWidgetGroup, this.iosWidgetGroup);
      if (ios) {
        ios.sizes.forEach((iosData: any, sizeIndex: number) => {
          const sizeKey = CONFIG_SIZE_MAP[iosData.size];
          const dataPath = `ios.sizes.${sizeIndex}`;
          const wdget = this.createWidget({
            agent: iosSystem,
            ...iosData,
            sizeKey: sizeKey,
            // 对齐 data 中 sizes 的真实索引，避免按 sizeKey 推断导致错位。
            dataPath,
          });
          this.iosNodes[sizeKey] = wdget;
        });
      }
      if (android) {
        android.sizes.forEach((iosData: any, sizeIndex: number) => {
          const sizeKey = CONFIG_SIZE_MAP[iosData.size];
          const dataPath = `android.sizes.${sizeIndex}`;
          const wdget = this.createWidget({
            agent: androidSystem,
            ...iosData,
            sizeKey: sizeKey,
            // 对齐 data 中 sizes 的真实索引，避免按 sizeKey 推断导致错位。
            dataPath,
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
        radius,
        dataPath,
        crop_props,
      } = options;

      const sizeCfg = WIDGET_SIZE[sizeKey];
      const widthPx = pt(sizeCfg.width);
      const heightPx = pt(sizeCfg.height);

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
            radius,
            crop_props,
        },
        // Widget 容器级字段（padding/name/source/radius/crop_props）回填路径。
        snapshotDataPath: dataPath,
        snapshotNodeId: nanoid(),
      });

      const bgRect = this.createRect({ w: widthPx, h: heightPx })
      const bgImage = this.createSource({ w: widthPx, h: heightPx, source, crop_props, radius });
      let items:any = [bgRect, bgImage];
      if (time) {
        const timeNode = this.createText({
          ...time,
          text: '10:09',
          key: 'time',
        });
        // 文本子节点映射到 data 的 time 分支。
        timeNode.setAttr('snapshotDataPath', `${dataPath}.time`);
        items.push(timeNode);
      }
      if (day) {
        const dayNode = this.createText({
          ...day,
          text: 'Wednesday',
          key: 'day',
        });
        // 文本子节点映射到 data 的 day 分支。
        dayNode.setAttr('snapshotDataPath', `${dataPath}.day`);
        items.push(dayNode);
      }
      if (date) {
        const dateNode = this.createText({
          ...date,
          text: 'March 23',
          key: 'date',
        });
        // 文本子节点映射到 data 的 date 分支。
        dateNode.setAttr('snapshotDataPath', `${dataPath}.date`);
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

    async exportWidgetBundle(data: unknown, system: string) {
      const zip = new JSZip();
      zip.file('widgets_spec.json', JSON.stringify(data ?? {}, null, 2));

      const nodes = system === 'ios' ? this.iosNodes : this.androidNodes;
      const sizes = ['small', 'medium', 'large'];
      for (const size of sizes) {
        const widgetNode = nodes[size];
        if (!widgetNode) continue;

        const { source } = widgetNode.getAttr('editProps') || {};
        if (this.isGifSource(source)) {
          const { blob: previewBlob, sourceBlob } = await this.exportWidgetGif(widgetNode, source);
          zip.file(`widgets_${size}_preview.gif`, previewBlob);
          zip.file(`widgets_${size}_time.gif`, sourceBlob);
        } else {
          const { blob: previewBlob, sourceBlob } = await this.exportWidgetPreviewPng(widgetNode);
          zip.file(`widgets_${size}_preview.png`, previewBlob);
          zip.file(`widgets_${size}_time.png`, sourceBlob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const filename = `widget_${this.getDateStamp()}_${system}.zip`;
      this.triggerDownload(zipUrl, filename);
      window.setTimeout(() => URL.revokeObjectURL(zipUrl), 30_000);
    }

    async export(node: Konva.Node) {
      if (node) {
        const snapshotDataPath = node.getAttr('snapshotDataPath');
        const fullData = this.buildStructuredEditPropsPatch(
          node as Konva.Group,
          this.cloneSerializable(this.originalData),
        );
        const data =
          typeof snapshotDataPath === 'string' && snapshotDataPath
            ? this.getByPath(fullData, snapshotDataPath)
            : fullData;
        if (snapshotDataPath == 'ios') {
          await this.exportWidgetBundle(data, 'ios');
          return;
        }
        if (snapshotDataPath == 'android') {
          await this.exportWidgetBundle(data, 'android');
          return;
        }
        await this.exportWidgetBundle(data, 'ios');
        await this.exportWidgetBundle(data, 'android');
      }
    }

  }