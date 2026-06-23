/**
 * 编辑器场景快照契约（P0 阶段先定契约，配合后续 serialize / loadSnapshot 使用）。
 *
 * 设计要点：
 * - 后端只把它当 JSON blob 存、不解析字段，所以这里就是单一来源。
 * - 字段不兼容时升 schemaVersion，并配套在前端写 migrate(old) -> V_new。
 * - nodeId / snapshotNodeId 仅在一份 snapshot 内部使用（节点寻址），不要求全局唯一。
 */

export const SNAPSHOT_SCHEMA_VERSION = 1 as const;

export type SnapshotNodeType = 'time' | 'iconpack';
export type SnapshotCategory = 'widget' | 'iconpack';

export type SnapshotTransform = {
  x: number;
  y: number;
};

export type SnapshotV1 = {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  meta: {
    name: string;
    /** 后端会回写，前端 serialize 时可不传 */
    createdAt?: string;
    updatedAt?: string;
  };
  stage: {
    backgroundColor: string;
    theme: 'light' | 'dark';
    showBackgroundDecorations: boolean;
    showAxis: boolean;
    /** 视图状态可选，用于回到上次视角；不存也行 */
    view?: { scale: number; x: number; y: number };
  };
  /** 顺序即 z-order */
  nodes: SnapshotNode[];
};

export type SnapshotNode = {
  /** 节点类型，对应 EditorCore 的 add 入口（addWidget / addIconPack 等） */
  type: SnapshotNodeType;
  category: SnapshotCategory;
  /** widget 实例 id（widget 根节点的 snapshotNodeId），nanoid 生成 */
  id: string;
  /** widget 在 stage 世界坐标的位置 */
  transform: SnapshotTransform;
  /** 构造时的业务 data，原样存原样回传 */
  data: unknown;
  /**
   * 与 data 同形结构的编辑态数据快照（只替换可编辑字段值，不改结构）。
   * load 时可按同一路径结构回填。
   */
  editPropsPatch?: unknown;
};
