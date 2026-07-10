import React, { Children, CSSProperties, isValidElement, ReactNode } from 'react';

export type GridSpanLayoutItemProps = {
  children?: ReactNode;
  rowSpan?: number;
  colSpan?: number;
  rowStart?: number;
  colStart?: number;
  className?: string;
  style?: CSSProperties;
};

export type GridSpanLayoutProps = {
  rows: number;
  cols: number;
  gap?: number | string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

const toPositiveInt = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const result = Math.floor(parsed);
  return result > 0 ? result : fallback;
};

const GridSpanLayoutItem: React.FC<GridSpanLayoutItemProps> = ({ children }) => <>{children}</>;

type GridSpanLayoutComponent = React.FC<GridSpanLayoutProps> & {
  Item: React.FC<GridSpanLayoutItemProps>;
};

const GridSpanLayout = ((props: GridSpanLayoutProps) => {
  const {
    rows,
    cols,
    gap = 0,
    className,
    style,
    children,
  } = props;

  const safeRows = toPositiveInt(rows, 1);
  const safeCols = toPositiveInt(cols, 1);
  const childList = Children.toArray(children);

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        width: '100%',
        height: '100%',
        gridTemplateRows: `repeat(${safeRows}, minmax(0, 1fr))`,
        gridTemplateColumns: `repeat(${safeCols}, minmax(0, 1fr))`,
        gap,
        ...style,
      }}
    >
      {childList.map((child, index) => {
        if (!isValidElement(child)) return null;

        const itemProps = child.props as GridSpanLayoutItemProps;
        const rawRowStart = itemProps.rowStart;
        const rawColStart = itemProps.colStart;
        const rowStart = rawRowStart ? toPositiveInt(rawRowStart, 1) : undefined;
        const colStart = rawColStart ? toPositiveInt(rawColStart, 1) : undefined;

        const maxRowSpan = rowStart ? Math.max(1, safeRows - rowStart + 1) : safeRows;
        const maxColSpan = colStart ? Math.max(1, safeCols - colStart + 1) : safeCols;
        const rowSpan = Math.min(toPositiveInt(itemProps.rowSpan, 1), maxRowSpan);
        const colSpan = Math.min(toPositiveInt(itemProps.colSpan, 1), maxColSpan);

        return (
          <div
            key={child.key ?? `grid-item-${index}`}
            className={itemProps.className}
            style={{
              gridRow: rowStart ? `${rowStart} / span ${rowSpan}` : `span ${rowSpan}`,
              gridColumn: colStart ? `${colStart} / span ${colSpan}` : `span ${colSpan}`,
              minWidth: 0,
              minHeight: 0,
              ...itemProps.style,
            }}
          >
            {itemProps.children}
          </div>
        );
      })}
    </div>
  );
}) as GridSpanLayoutComponent;

GridSpanLayout.Item = GridSpanLayoutItem;

export default GridSpanLayout;
