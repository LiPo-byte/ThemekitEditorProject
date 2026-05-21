import React, { useEffect, useState } from 'react';
import { ReactFlow, Background, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';

type WidgetSize = 'small' | 'medium' | 'large';

const SIZE_CONFIG: Record<
  WidgetSize,
  {
    width: number;
    padding: string;
    radius: number;
    timeSize: number;
    weekdaySize: number;
    dateSize: number;
    weekdayMargin: number;
    dateMargin: number;
  }
> = {
  small: {
    width: 180,
    padding: '16px 18px',
    radius: 14,
    timeSize: 40,
    weekdaySize: 13,
    dateSize: 11,
    weekdayMargin: 8,
    dateMargin: 4,
  },
  medium: {
    width: 240,
    padding: '22px 24px',
    radius: 16,
    timeSize: 56,
    weekdaySize: 16,
    dateSize: 12,
    weekdayMargin: 10,
    dateMargin: 5,
  },
  large: {
    width: 320,
    padding: '28px 32px',
    radius: 20,
    timeSize: 72,
    weekdaySize: 20,
    dateSize: 14,
    weekdayMargin: 14,
    dateMargin: 6,
  },
};

const useStyles = createStyles(({ css }) => ({
  stage: css`
    width: 100%;
    height: 100%;
  `,
  widget: css`
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    color: #ffffff;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      sans-serif;
    user-select: none;
  `,
  time: css`
    font-weight: 600;
    letter-spacing: 2px;
    line-height: 1;
  `,
  weekday: css`
    font-weight: 500;
    color: #f9fafb;
  `,
  date: css`
    color: #9ca3af;
    letter-spacing: 1px;
  `,
}));

const WEEKDAY_MAP = ['日', '一', '二', '三', '四', '五', '六'];

const useNow = () => {
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
};

const WidgetNode = (prop: any) => {
  const { styles } = useStyles();
  const now = useNow();
  const size: WidgetSize = prop?.data?.size || 'large';
  const config = SIZE_CONFIG[size];

  return (
    <div
      className={styles.widget}
      style={{
        width: config.width,
        padding: config.padding,
        borderRadius: config.radius,
      }}
    >
      <div className={styles.time} style={{ fontSize: config.timeSize }}>
        {now.format('HH:mm')}
      </div>
      <div
        className={styles.weekday}
        style={{
          fontSize: config.weekdaySize,
          marginTop: config.weekdayMargin,
        }}
      >
        星期{WEEKDAY_MAP[now.day()]}
      </div>
      <div
        className={styles.date}
        style={{ fontSize: config.dateSize, marginTop: config.dateMargin }}
      >
        {now.format('M月D日')}
      </div>
    </div>
  );
};

const EditorCanvas: React.FC = () => {
  const { styles } = useStyles();
  return (
    <div className={styles.stage}>
      <ReactFlow
          defaultNodes={[
            {
              id: 'widget-large',
              type: 'widgetNode',
              position: { x: 0, y: 0 },
              data: { size: 'large' },
            },
            {
              id: 'widget-medium',
              type: 'widgetNode',
              position: { x: 380, y: 0 },
              data: { size: 'medium' },
            },
            {
              id: 'widget-small',
              type: 'widgetNode',
              position: { x: 680, y: 0 },
              data: { size: 'small' },
            },
          ]}
          nodeTypes={{
              widgetNode: WidgetNode,
          }}
          nodesDraggable={false}
          fitView
      >
          <Background color="#ccc" variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </div>
  );
};

export default EditorCanvas;
