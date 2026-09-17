import type { Node as FlowNode } from '@xyflow/react';
import { nanoid } from 'nanoid';
import {
  PLATFORM_GROUP_STYLE,
  ROOT_GROUP_STYLE,
} from '../util/groupNodeStyle';

const GAP = 50;
const DEFAULT_SIZE_WIDTH = 396;
const DEFAULT_SIZE_HEIGHT = 484;
const WATCHTYPE_MAP_FLOWTYPE: any = {
    'Photos17': 'photo_watch_face_1_static',
    'Photos17_dynamic': 'photo_watch_face_1_dynamic',
    'Photos18': 'photo_watch_face_2',
    'Portraits': 'portraits_watch_face',
}

export const watchFaceConfig2Nodes: any = (config: any, elementKey?: any) => {
    const rootGroupId = elementKey || nanoid();
    const childNodes: any[] = [];
    let cursorX = GAP;
    let maxPlatformHeight = 0;

    const width = DEFAULT_SIZE_WIDTH;
    const height = DEFAULT_SIZE_HEIGHT;
    const watchData = config.watchface || config;
    const key = watchData.type;
    const platformGroupId = `${nanoid()}_${key}`;
    const platformWidth = width + GAP * 2;
    const platformHeight = height + GAP * 2;
    maxPlatformHeight = Math.max(maxPlatformHeight, platformHeight);

    childNodes.push({
        id: platformGroupId,
        type: 'platform_group',
        className: 'widget-group-node',
        position: { x: cursorX, y: GAP },
        data: {
            label: 'ios',
            themekitType: key,
        },
        parentId: rootGroupId,
        extent: 'parent',
        draggable: false,
        connectable: false,
        selectable: false,
        focusable: false,
        zIndex: 10,
        style: {
            width: platformWidth,
            height: platformHeight,
            ...PLATFORM_GROUP_STYLE.sticker,
        },
    });

    childNodes.push({
        id: nanoid(),
        type: WATCHTYPE_MAP_FLOWTYPE[watchData.type],
        data: {
            ...watchData,
            width,
            height,
            key,
        },
        position: { x: GAP, y: GAP },
        parentId: platformGroupId,
        extent: 'parent',
        draggable: false,
        selectable: false,
        connectable: false,
        focusable: false,
        style: {
          border: '2px solid transparent',
        },
    });

    cursorX += platformWidth + GAP;

    const rootNode = {
        id: rootGroupId,
        type: 'group',
        deleteable: true,
        position: { x: 0, y: 0 },
        data: {
            category: 'watchface',
        },
        packable: true,
        draggable: false,
        connectable: false,
        focusable: false,
        zIndex: 1,
        style: {
        width: cursorX,
        height: maxPlatformHeight + GAP * 2,
        ...ROOT_GROUP_STYLE.sticker,
        },
    };

    return {
        nodes: [rootNode, ...childNodes],
        rootNode,
    };
};