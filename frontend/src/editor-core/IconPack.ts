import Konva from 'konva';
import { nanoid } from 'nanoid';
import BaseNode, { pt, WIDGET_BORDER_RADIUS, WHITE_PIXEL_DATA_URL } from "./WidgetBaseNode";
// import mockdata from './mockdata.json';

const ICON_WIDTH = 180
const DEFAULT_CROP_PROPS = {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    translateX: 0,
    translateY: 0,
}

function getSuffixName(filename: string): string {
    const base = filename.replace(/\.[^.]+$/, ''); // 去扩展名
    const idx = base.lastIndexOf('_');
    return idx >= 0 ? base.slice(idx + 1) : '';
}
export default class IconPack extends BaseNode {
    constructor(options: any) {
      super(options);
      this.category = 'iconpack';
      this.subtype = 'iconpack';
      this.node.setAttr('title', 'Icon Pack');
      this.node.setAttr('editProps', { name: 'Icon Pack' });
      this.node.setAttr('snapshotCategory', 'iconpack');
      this.node.setAttr('snapshotType', 'iconpack');
      this.gap = 100;
      this.init();
    }

   init() {
      const appsData = this.dataJson?.apps;
      const iconPackEntries: Array<{ key: string; name: string; source: string; crop_props: any }> = Array.isArray(appsData)
        ? appsData.map((icon: any, index: number) => ({
            key: String(index),
            name: icon?.name || getSuffixName(icon?.source || ''),
            source: icon?.source || '',
            crop_props: icon?.crop_props || DEFAULT_CROP_PROPS,
          }))
        : Object.entries(appsData || {}).map(([key, value]) => {
            if (value && typeof value === 'object') {
              const appItem = value as { name?: string; source?: string; crop_props?: any };
              return {
                key,
                name: appItem.name || key,
                source: String(appItem.source || ''),
                crop_props: appItem.crop_props || DEFAULT_CROP_PROPS,
              };
            }
            return {
              key: key,
              name: key,
              source: String(value || ''),
              crop_props: DEFAULT_CROP_PROPS,
            };
        });
      let cursorX = 0;
      let cursorY = 0;
      let col = 8;
      const renderNode:any = [];
      iconPackEntries.forEach((icon) => {
        const widthPx = ICON_WIDTH;
        const heightPx = ICON_WIDTH;
        const displayName = icon.name;
        const source = icon.source?.includes('http') || icon.source?.includes('base64') ? icon.source : `http://localhost:5100/appicons/${icon.source}`;

        const crop_props = icon.crop_props;
          const iconGroup = new Konva.Group({
            x: cursorX,
            y: cursorY,
            width: widthPx,
            height: heightPx,
            selected: true,
            cropable: true,
            title: displayName,
            editProps: {
                source,
                appname: displayName,
                radius: 39.96,
                crop_props: crop_props
            },
            // 回填到 data.apps 下对应项（对象 key 或数组索引）。
            snapshotDataPath: `apps.${icon.key}`,
            snapshotNodeId: nanoid(),
          });
          const rect = this.createRect({ w: widthPx, h: heightPx });
          const iconImage = this.createSource({ w: widthPx, h: heightPx, source, crop_props, radius: 39.96 });
          this.backgroundImageNodes.set(iconGroup, iconImage);
          iconGroup.add(rect, iconImage);
          renderNode.push(iconGroup);
          col--;
          if (!col) {
            col = 8;
            cursorX = 0;
            cursorY += heightPx + this.gap;
          } else {
            cursorX += widthPx + this.gap;
          }
          this.node.add(iconGroup);
      });
      this.createFullBox({});

      this.render();
   }
  }