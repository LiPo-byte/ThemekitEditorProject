import GridSpanLayout from '@/pages/editor-xyflow/components/GridSpanLayout';

/** 单格固定 180×180；GAP_X/GAP_Y 使中、大精确贴合 */
const CELL = 180;
const GAP_X = 89;
const GAP_Y = 105;
const COLS = 4;
const ROWS = 6;
const PAD_TOP = 100;
const PAD_X = 50;
const PAD_BOTTOM = 50;

const GRID_W = COLS * CELL + (COLS - 1) * GAP_X;
const GRID_H = ROWS * CELL + (ROWS - 1) * GAP_Y;

const spanPxX = (n: number) => n * CELL + Math.max(0, n - 1) * GAP_X;
const spanPxY = (n: number) => n * CELL + Math.max(0, n - 1) * GAP_Y;

type DemoBlockProps = {
  label: string;
  designW: number;
  designH: number;
  colSpan: number;
  rowSpan: number;
  bg: string;
};

/** 槽位按占格算；内容按设计稿等比 contain 居中 */
function DemoBlock({ label, designW, designH, colSpan, rowSpan, bg }: DemoBlockProps) {
  const slotW = spanPxX(colSpan);
  const slotH = spanPxY(rowSpan);
  const scale = Math.min(slotW / designW, slotH / designH);
  const w = designW * scale;
  const h = designH * scale;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        border: '1px dashed rgba(0,0,0,0.25)',
        borderRadius: 12,
        background: 'rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          width: w,
          height: h,
          background: bg,
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: 1.35,
          padding: 8,
          boxSizing: 'border-box',
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 400, fontSize: 11, opacity: 0.85 }}>
          {designW}×{designH} → {colSpan}×{rowSpan}
        </span>
        <span style={{ fontWeight: 400, fontSize: 11, opacity: 0.75 }}>
          slot {slotW}×{slotH} · ×{scale.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export default function PreviewLong(props: any) {
  const data = props.data;
  if (!data) return null;

  const width = Number(data.width) > 0 ? Number(data.width) : 887;
  const height = Number(data.height) > 0 ? Number(data.height) : 1920;

  const innerW = width - PAD_X * 2;
  const innerH = height - PAD_TOP - PAD_BOTTOM;
  // 设计网格宽 987 > 内容区 787，整体等比缩进 padding 内
  const fitScale = Math.min(innerW / GRID_W, innerH / GRID_H, 1);

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: PAD_TOP,
          left: PAD_X,
          right: PAD_X,
          bottom: PAD_BOTTOM,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: GRID_W * fitScale,
            height: GRID_H * fitScale,
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: GRID_W,
              height: GRID_H,
              transform: `scale(${fitScale})`,
              transformOrigin: '0 0',
            }}
          >
            <GridSpanLayout
              rows={ROWS}
              cols={COLS}
              gap={[GAP_X, GAP_Y]}
              style={{
                position: 'relative',
                zIndex: 2,
                width: GRID_W,
                height: GRID_H,
                // 锁定 1×1 = 180×180，不用 1fr 拉伸
                gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
                gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
              }}
            >

              {/* medium 329×155 → 4×2 */}
              {/* <GridSpanLayout.Item colSpan={4} rowSpan={2} colStart={1} rowStart={5}>
                <DemoBlock
                  label="medium"
                  designW={329}
                  designH={155}
                  colSpan={4}
                  rowSpan={2}
                  bg="#52c41a"
                />
              </GridSpanLayout.Item> */}

              {/* small 155×155 → 2×2（叠在左上示意；1×1 格仍是 180） */}
              {/* <GridSpanLayout.Item colSpan={2} rowSpan={2} colStart={1} rowStart={1}>
                <DemoBlock
                  label="small"
                  designW={155}
                  designH={155}
                  colSpan={2}
                  rowSpan={2}
                  bg="#fa8c16"
                />
              </GridSpanLayout.Item> */}
            </GridSpanLayout>
          </div>
        </div>
      </div>
    </div>
  );
}
