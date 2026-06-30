import Konva from "konva";
import { nanoid } from "nanoid";
import BaseNode, { pt, CONFIG_SIZE_MAP, WIDGET_SIZE } from "./WidgetBaseNode";
import { parseGIF, decompressFrames } from "gifuct-js";
import GIF from "gif.js";
import JSZip from "jszip";
const iosSystem = 'IOS';
const androidSystem = 'Android';
interface GifExportOptions {
  workers: number;
  quality: number;
  pixelRatio: number;
  minDelayMs: number;
  maxFps: number;
  speedMultiplier: number;
  backgroundColor: string;
  autoDownload: boolean;
  openPreview: boolean;
}
export default class Time extends BaseNode {
    private iosNodes: any;
    private androidNodes: any;
    private iosWidgetGroup: any;
    private androidWidgetGroup: any;
    private readonly gifExportOptions: GifExportOptions = {
      workers: 2,
      // gif.js 中 quality 越小体积越大，这里提高取样步长以减小预览图体积
      quality: 12,
      pixelRatio: 2,
      minDelayMs: 1,
      // 限制导出帧率，避免把高帧率源 GIF 全量编码导致文件过大
      maxFps: 8,
      speedMultiplier: 1,
      backgroundColor: '#ffffff',
      autoDownload: true,
      openPreview: true,
    };
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

    private isGifSource(source: unknown): source is string {
      if (typeof source !== 'string' || !source.trim()) return false;
      if (source.startsWith('data:image/gif')) return true;
      return /\.gif(?:$|\?)/i.test(source);
    }

    private normalizeGifDelayMs(delayValue: unknown, fallbackMs: number) {
      const n = Number(delayValue);
      if (!Number.isFinite(n) || n <= 0) return fallbackMs;
      // 一些解析结果是 1/100s（常见小值），一些是 ms（常见 >= 20）。
      return n <= 20 ? n * 10 : n;
    }

    private async decodeGifFrames(source: string) {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch gif: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const gif = parseGIF(arrayBuffer);
      const decodedFrames = decompressFrames(gif, true) as any[];
      if (!decodedFrames.length) return [];

      const screenWidth =
        Number((gif as any)?.lsd?.width) || Number(decodedFrames[0]?.dims?.width) || 1;
      const screenHeight =
        Number((gif as any)?.lsd?.height) || Number(decodedFrames[0]?.dims?.height) || 1;

      const stageCanvas = document.createElement('canvas');
      stageCanvas.width = screenWidth;
      stageCanvas.height = screenHeight;
      const stageCtx = stageCanvas.getContext('2d');
      if (!stageCtx) {
        throw new Error('Cannot create canvas 2d context');
      }

      let lastDelayMs = 10;
      const frameList = decodedFrames.map((frame, index: number) => {
        const { dims, patch } = frame;
        if (!dims || !patch) return null;

        const patchCanvas = document.createElement('canvas');
        patchCanvas.width = dims.width;
        patchCanvas.height = dims.height;
        const patchCtx = patchCanvas.getContext('2d');
        if (!patchCtx) return null;

        const patchImageData = patchCtx.createImageData(dims.width, dims.height);
        patchImageData.data.set(patch);
        patchCtx.putImageData(patchImageData, 0, 0);

        const prevFrameImage =
          frame.disposalType === 3
            ? stageCtx.getImageData(0, 0, screenWidth, screenHeight)
            : null;

        stageCtx.drawImage(patchCanvas, dims.left, dims.top);

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = screenWidth;
        outputCanvas.height = screenHeight;
        const outputCtx = outputCanvas.getContext('2d');
        if (!outputCtx) return null;
        outputCtx.drawImage(stageCanvas, 0, 0);

        if (frame.disposalType === 2) {
          stageCtx.clearRect(dims.left, dims.top, dims.width, dims.height);
        } else if (frame.disposalType === 3 && prevFrameImage) {
          stageCtx.putImageData(prevFrameImage, 0, 0);
        }

        const rawDelayMs = this.normalizeGifDelayMs(frame.delay, lastDelayMs);
        lastDelayMs = rawDelayMs;
        return {
          index,
          delayMs: Math.max(
            this.gifExportOptions.minDelayMs,
            Math.round(rawDelayMs * this.gifExportOptions.speedMultiplier),
          ),
          canvas: outputCanvas,
        };
      });
      const usableFrames = frameList.filter(Boolean) as Array<{
        index: number;
        delayMs: number;
        canvas: HTMLCanvasElement;
      }>;
      return usableFrames;
    }

    private findWidgetBgImage(widget: Konva.Group): Konva.Image | null {
      const bgImageGroup = this.backgroundImageNodes.get(widget);
      if (!bgImageGroup) return null;
      const bgImageNode = bgImageGroup.findOne(
        (n: Konva.Node) => n instanceof Konva.Image,
      );
      if (!(bgImageNode instanceof Konva.Image)) return null;
      return bgImageNode;
    }

    private compactGifFramesByFps(
      frames: Array<{ canvas: HTMLCanvasElement; delayMs: number }>,
    ): Array<{ canvas: HTMLCanvasElement; delayMs: number }> {
      if (!frames.length) return [];
      const maxFps = Math.max(1, this.gifExportOptions.maxFps || 1);
      const minFrameDelay = Math.max(1, Math.round(1000 / maxFps));
      const compacted: Array<{ canvas: HTMLCanvasElement; delayMs: number }> = [];
      let pendingDelay = 0;
      let pendingCanvas = frames[0].canvas;
      frames.forEach((frame, index) => {
        pendingCanvas = frame.canvas;
        pendingDelay += Math.max(1, Math.round(frame.delayMs));
        const isLast = index === frames.length - 1;
        if (pendingDelay < minFrameDelay && !isLast) return;
        compacted.push({
          canvas: pendingCanvas,
          delayMs: pendingDelay,
        });
        pendingDelay = 0;
      });
      return compacted.length ? compacted : frames;
    }

    private renderNodeToGif(
      frameCanvases: Array<{ canvas: HTMLCanvasElement; delayMs: number }>,
      width: number,
      height: number,
    ): Promise<Blob> {
      return new Promise((resolve, reject) => {
        if (!frameCanvases.length) {
          reject(new Error('No frame to encode.'));
          return;
        }
        const gif = new GIF({
          workers: this.gifExportOptions.workers,
          quality: this.gifExportOptions.quality,
          width,
          height,
          workerScript: '/scripts/gif.worker.js',
        });
        frameCanvases.forEach((frame) => {
          gif.addFrame(frame.canvas, {
            delay: frame.delayMs,
            copy: true,
          });
        });
        gif.on('finished', (blob: Blob) => resolve(blob));
        gif.on('abort', () => reject(new Error('GIF render aborted.')));
        gif.render();
      });
    }

    private buildGifFileName(prefix: string) {
      const date = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
      return `${prefix}-${stamp}.gif`;
    }

    private triggerDownload(url: string, filename: string) {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }

    private canvasToBlob(
      canvas: HTMLCanvasElement,
      type = 'image/png',
      quality?: number,
    ): Promise<Blob> {
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
            return;
          }
          reject(new Error('Failed to convert canvas to blob.'));
        }, type, quality);
      });
    }

    private resolveResourceExt(source: string, blob?: Blob) {
      const byMime: Record<string, string> = {
        'image/gif': 'gif',
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
      };
      if (blob) {
        const mimeExt = byMime[blob.type];
        if (mimeExt) return mimeExt;
      }
      const plainSource = source.split('?')[0];
      const match = plainSource.match(/\.([a-zA-Z0-9]+)$/);
      if (match?.[1]) return match[1].toLowerCase();
      return 'bin';
    }

    private getDateStamp() {
      const date = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
    }

    // private openGifPreview(url: string, frameCount: number, fileName: string) {
    //   const previewWindow = window.open('', '_blank', 'width=900,height=700');
    //   if (!previewWindow) return;
    //   previewWindow.document.title = 'medium 导出 GIF';
    //   previewWindow.document.body.innerHTML = `
    //     <div style="padding:16px;font-family:Arial,sans-serif;">
    //       <h3 style="margin:0 0 12px;">medium 导出 GIF</h3>
    //       <p style="color:#666;">frameCount: ${frameCount}</p>
    //       <img src="${url}" style="max-width:100%;display:block;background:#f6f6f6;border:1px solid #eee;border-radius:8px;" />
    //       <a href="${url}" download="${fileName}" style="display:inline-block;margin-top:12px;">下载 GIF</a>
    //     </div>
    //   `;
    // }

    private async exportWidgetGif(widget: Konva.Group, source: string) {
      const bgImageNode = this.findWidgetBgImage(widget);
      if (!bgImageNode) {
        throw new Error('Cannot find widget background image node.');
      }
      const bgImageContainer = bgImageNode.getParent() as Konva.Group | null;
      if (!bgImageContainer) {
        throw new Error('Cannot find widget background image container.');
      }
      const originalClipFunc =
        bgImageContainer && typeof (bgImageContainer as any).clipFunc === 'function'
          ? (bgImageContainer as any).clipFunc()
          : undefined;
      const frames = await this.decodeGifFrames(source);
      if (!frames.length) {
        throw new Error('No gif frames decoded.');
      }
      const originalImage = bgImageNode.image();
      const { crop_props } = widget.getAttr('editProps') || {};
      const renderedFrames: Array<{ canvas: HTMLCanvasElement; delayMs: number }> = [];
      const sourceOnlyFrames: Array<{ canvas: HTMLCanvasElement; delayMs: number }> = [];
      const widgetRect = widget.getClientRect({ skipTransform: true });
      const width = Math.max(1, Math.round(widgetRect.width));
      const height = Math.max(1, Math.round(widgetRect.height));
      try {
        if (bgImageContainer) {
          bgImageContainer.setAttr('clipFunc', undefined);
        }
        for (const frame of frames) {
          bgImageNode.image(frame.canvas);
          this.cropParamSource(bgImageNode, crop_props || {});
          widget.getLayer()?.draw();
          const previewFrameCanvas = widget.toCanvas({ pixelRatio: this.gifExportOptions.pixelRatio });
          const sourceFrameCanvas = bgImageContainer.toCanvas({
            pixelRatio: this.gifExportOptions.pixelRatio,
          });
          const previewComposedCanvas = document.createElement('canvas');
          const sourceComposedCanvas = document.createElement('canvas');
          // 导出尺寸固定为 widgetRect 的逻辑宽高
          previewComposedCanvas.width = width;
          previewComposedCanvas.height = height;
          sourceComposedCanvas.width = width;
          sourceComposedCanvas.height = height;
          const previewCtx = previewComposedCanvas.getContext('2d');
          const sourceCtx = sourceComposedCanvas.getContext('2d');
          if (!previewCtx || !sourceCtx) {
            continue;
          }
          previewCtx.fillStyle = this.gifExportOptions.backgroundColor;
          previewCtx.fillRect(0, 0, previewComposedCanvas.width, previewComposedCanvas.height);
          // 按目标尺寸回填；pixelRatio 仅用于提高采样清晰度
          previewCtx.drawImage(
            previewFrameCanvas,
            0,
            0,
            previewComposedCanvas.width,
            previewComposedCanvas.height,
          );
          sourceCtx.drawImage(
            sourceFrameCanvas,
            0,
            0,
            sourceComposedCanvas.width,
            sourceComposedCanvas.height,
          );
          renderedFrames.push({
            canvas: previewComposedCanvas,
            delayMs: frame.delayMs,
          });
          sourceOnlyFrames.push({
            canvas: sourceComposedCanvas,
            delayMs: frame.delayMs,
          });
        }
      } finally {
        if (originalImage) {
          bgImageNode.image(originalImage);
          this.cropParamSource(bgImageNode, crop_props || {});
        }
        if (bgImageContainer) {
          bgImageContainer.setAttr('clipFunc', originalClipFunc);
        }
        widget.getLayer()?.draw();
      }
      if (!renderedFrames.length) {
        throw new Error('No rendered gif frames.');
      }
      if (!sourceOnlyFrames.length) {
        throw new Error('No rendered source gif frames.');
      }
      const compactedFrames = this.compactGifFramesByFps(renderedFrames);
      const compactedSourceFrames = this.compactGifFramesByFps(sourceOnlyFrames);
      const outputWidth = width;
      const outputHeight = height;
      const blob = await this.renderNodeToGif(compactedFrames, outputWidth, outputHeight);
      const sourceBlob = await this.renderNodeToGif(
        compactedSourceFrames,
        outputWidth,
        outputHeight,
      );

      return { blob, sourceBlob, frameCount: compactedFrames.length };
    }

    private async exportWidgetPreviewPng(widget: Konva.Group) {
      const bgImageNode = this.findWidgetBgImage(widget);
      const pixelRati =  this.gifExportOptions.pixelRatio;
      if (!bgImageNode) {
        throw new Error('Cannot find widget background image node.');
      }
      const bgImageContainer = bgImageNode.getParent() as Konva.Group | null;
      const originalClipFunc =
        bgImageContainer && typeof (bgImageContainer as any).clipFunc === 'function'
          ? (bgImageContainer as any).clipFunc()
          : undefined;

      const widgetRect = widget.getClientRect({ skipTransform: true });
      const width = Math.max(1, Math.round(widgetRect.width * pixelRati));
      const height = Math.max(1, Math.round(widgetRect.height * pixelRati));
      try {
        if (bgImageContainer) {
          bgImageContainer.setAttr('clipFunc', undefined);
        }
        const rawPreviewCanvas = widget.toCanvas({ pixelRatio: pixelRati });
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = width;
        previewCanvas.height = height;
        const previewCtx = previewCanvas.getContext('2d');
        if (previewCtx) {
          previewCtx.drawImage(rawPreviewCanvas, 0, 0, width, height);
        }
        const blob = await this.canvasToBlob(previewCanvas, 'image/png');

        const sourceCanvas = (bgImageContainer || bgImageNode).toCanvas({ pixelRatio: pixelRati });
        const sourceOnlyCanvas = document.createElement('canvas');
        sourceOnlyCanvas.width = width;
        sourceOnlyCanvas.height = height;
        const sourceOnlyCtx = sourceOnlyCanvas.getContext('2d');
        if (sourceOnlyCtx) {
          sourceOnlyCtx.drawImage(sourceCanvas, 0, 0, width, height);
        }
        const sourceBlob = await this.canvasToBlob(sourceOnlyCanvas, 'image/png');
        return { blob, sourceBlob };
      } finally {
        if (bgImageContainer) {
          bgImageContainer.setAttr('clipFunc', originalClipFunc);
        }
      }
    }

    private async exportWidgetBundle(data: unknown, system: string) {
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