import Konva from 'konva';
import BaseNode, { pt, WIDGET_BORDER_RADIUS, WHITE_PIXEL_DATA_URL } from "./WidgetBaseNode";
// import mockdata from './mockdata.json';

const ICON_WIDTH = 180

function getSuffixName(filename: string): string {
    const base = filename.replace(/\.[^.]+$/, ''); // 去扩展名
    const idx = base.lastIndexOf('_');
    return idx >= 0 ? base.slice(idx + 1) : '';
}
export default class IconPack extends BaseNode {
    constructor(options: any) {
      super(options);
      this.node.setAttr('title', 'Icon Pack');
      this.node.setAttr('editProps', { name: 'Icon Pack' });
      this.init();
    }

   init() {
      // mock数据
      const icon_pack = this.dataJson;
      let cursorX = 0;
      let cursorY = 0;
      let col = 8;
      const renderNode:any = [];
      icon_pack.forEach((icon: string) => {
        const widthPx = ICON_WIDTH;
        const heightPx = ICON_WIDTH;
        const source = `http://localhost:5100/appicons2/${icon}`;

        const crop_props = {
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            translateX: 0,
            translateY: 0,
          };
          const iconGroup = new Konva.Group({
            x: cursorX,
            y: cursorY,
            width: widthPx,
            height: heightPx,
            selected: true,
            cropable: true,
            editProps: {
                source,
                name: icon,
                crop_props: crop_props
            },
          });
          const rect = this.createRect({ w: widthPx, h: heightPx, radius: 39.96 });
          const iconImage = this.createSource({ w: widthPx, h: heightPx, source, crop_props });
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