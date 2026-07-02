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
          const { width: timeWidth, height: timeHeight } = time.getClientRect({ relativeTo: widget });
          const { width: dayWidth, height: dayHeight } = day.getClientRect({ relativeTo: widget });
          const { width: dateWidth, height: dateHeight } = date.getClientRect({ relativeTo: widget });
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
            const { width: nodeWidth } = node.getClientRect({ relativeTo: widget });
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
          const { width: timeWidth, height: timeHeight } = time.getClientRect({ relativeTo: widget });

          let timeX = paddingPx;
          if (textAlignment === 2) {
            timeX = (widgetWidth - timeWidth) / 2;
          } else if (textAlignment === 3) {
            timeX = widgetWidth - paddingPx - timeWidth;
          }

          time.x(timeX);
          time.y(Math.max(0, (widgetHeight - timeHeight) / 2));
        },
        1: ({ widget }: any) => {
          const { padding } = widget.getAttr('editProps');
          const widgetWidth = widget.width();
          // const widgetHeight = widget.height();

          const time = widget.findOne(
            (node: any) => node.getAttr('itemKey') === 'time',
          );
          const { textAlignment } = time.getAttr('editProps')
          const day = widget.findOne(
            (node: any) => node.getAttr('itemKey') === 'day',
          );
          const {
            editProps: { topSpacing, bottomSpacing },
          } = day.attrs;
          const date = widget.findOne(
            (node: any) => node.getAttr('itemKey') === 'date',
          );

          const paddingPx = pt(padding);
          const alignX = (node: any) => {
            times[0].text(textAlignment === 2 ? '10:09' : '10');
            times[1].visible(textAlignment !== 2);
            const { width: nodeWidth } = node.getClientRect({ relativeTo: widget });
            times[1].y(times[0].height() + 10);
            if (textAlignment === 2) {
              return (widgetWidth - nodeWidth) / 2;
            }
            if (textAlignment === 3) {
              return widgetWidth - paddingPx - nodeWidth;
            }
            return paddingPx;
          };
          const startY = 16;

          const times = time.find('Text');

          time.x(alignX(time));
          time.y(startY);

          const { height: timeHeight } = time.getClientRect({ relativeTo: widget });

          day.x(padding);
          day.y(time.y() + timeHeight + topSpacing);

          const { height: dayHeight } = day.getClientRect({ relativeTo: widget });

          date.x(padding);
          date.y(day.y()+ dayHeight + bottomSpacing)
        },
        3: ({ widget }: any) => {
          const time = widget.findOne(
            (node: any) => node.getAttr('itemKey') === 'time',
          );
          const timebg1 = time.findOne(
            (node: any) => node.getAttr('itemKey') === 'timebg1',
          );
          const timebg2 = widget.findOne(
            (node: any) => node.getAttr('itemKey') === 'timebg2',
          );
          const time1 = widget.findOne(
            (node: any) => node.getAttr('itemKey') === 'time1',
          );
          const time2 = widget.findOne(
            (node: any) => node.getAttr('itemKey') === 'time2',
          );
          // timebg1.x(0);
          // timebg1.y(0);
          // timebg2.x(timebg1.width() + 10);
          // timebg2.y(0);

          time1.x(timebg1.x() + (timebg1.width() - time1.width())/2);
          time1.y(timebg1.y() + (timebg1.height() - time1.height())/2);
          time2.x(timebg2.x() + (timebg2.width() - time2.width())/2);
          time2.y(timebg2.y() + (timebg2.height() - time2.height())/2);

          const { width: timeWidth, height: timeHeight } = time.getClientRect({ relativeTo: widget });
          time.x((widget.width() - timeWidth)/2)
          time.y(Math.max(0, (widget.height() - timebg1.height()) / 2));
        }
      };
    }

    init() {
      const { ios, android } = this.dataJson;
      const iosPorps: any = {};
      const androidProps: any = {};
      Object.keys(ios).forEach((key: string) => {
        if (typeof ios[key] !== 'object') {
          iosPorps[key] = ios[key];
        }
      })
      Object.keys(android).forEach((key: string) => {
        if (typeof android[key] !== 'object') {
          androidProps[key] = android[key];
        }
      })
      this.iosWidgetGroup = new Konva.Group({
        x: 0,
        y: 0,
        selected: true,
        packable: true,
        title: `Time-${iosSystem}`,
        editProps: {
          ...iosPorps,
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
          ...androidProps,
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
            sizeKey,
            crop_props,
        },
        // Widget 容器级字段（padding/name/source/radius/crop_props）回填路径。
        snapshotDataPath: dataPath,
        snapshotNodeId: nanoid(),
      });

      const bgRect = this.createRect({ w: widthPx, h: heightPx })
      const bgImage = this.createSource({ w: widthPx, h: heightPx, source, crop_props, radius });
      let items:any = [bgRect, bgImage];
      const layoutFnConfig: any = {
        0: {
          time: ['10:09'],
        },
        '0-1': {
          time: ['10:09 AM'],
        },
        '1': {
          time: ['10', '09'],
        },
      }
      // 暂时layoutType = 3的时候单独处理Time
      if (time && layoutType !== 3) {
        const lc = layoutFnConfig[layoutType];
        const timeNode = this.createText({
          ...time,
          text: lc ? lc.time : ['10:09'],
          key: 'time',
        }, lc ? lc.time.length : 1);
        // 文本子节点映射到 data 的 time 分支。
        timeNode.setAttr('snapshotDataPath', `${dataPath}.time`);
        items.push(timeNode);
      }

      if (time && layoutType === 3) {
        const layoutType3Map: any = {
          small: [60, 58, 3],
          medium: [126, 120, 10],
          large: [144, 136, 10],
        }
        const w = layoutType3Map[sizeKey][0];
        const h = layoutType3Map[sizeKey][1];
        const timeRect1 = new Konva.Rect({
          x: 0,
          y: 0,
          width: w,
          height: h,
          fill: '#000000',
          itemKey: 'timebg1',
          cornerRadius: 5,
          editProps: {
            backgroundColor: time.backgroundColor,
          }
        });
        const timeRect2 = new Konva.Rect({
          x: layoutType3Map[sizeKey][0] + layoutType3Map[sizeKey][2],
          y: 0,
          width: w,
          height: h,
          fill: '#000000',
          itemKey: 'timebg2',
          cornerRadius: 5,
          editProps: {
            backgroundColor: time.backgroundColor,
          }
        });
        const time1 = new Konva.Text({
          x: 0,
          y: 0,
          text: '10',
          verticalAlign: 'middle',
          itemKey: 'time1',
          lineHeight: 1,
          padding: 0,
        });
        const time2 = new Konva.Text({
          x: 0,
          y: 0,
          text: '09',
          itemKey: 'time2',
          verticalAlign: 'middle',
          lineHeight: 1,
          padding: 0,
        });

        const group1 = new Konva.Group({
          x: 0,
          y: 0,
          itemKey: 'time',
          selected: true,
          snapshotDataPath: `${dataPath}.time`,
          editProps: {
            ...time
          }
        })
        group1.add(timeRect1, timeRect2, time1, time2)
        items.push(group1);
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