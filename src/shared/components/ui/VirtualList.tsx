import { type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { List, type RowComponentProps } from 'react-window';
import { cn } from '@/shared/utils';

// VIRTUALIZATION_THRESHOLD — below this row count we render every row
// eagerly because the overhead of windowing is not worth it. 100 is the
// REFACTOR-PLAN target; every production list we have stays well under.
export const VIRTUALIZATION_THRESHOLD = 100;

interface VirtualListProps<Row> {
  items: ReadonlyArray<Row>;
  rowHeight: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
  renderRow: (row: Row, index: number, style: CSSProperties) => ReactNode;
  // Fallback when the list is short enough to skip windowing.
  children?: (renderRow: (row: Row, index: number) => ReactNode) => ReactNode;
}

// VirtualList renders `items` as virtual rows via react-window once the
// list crosses VIRTUALIZATION_THRESHOLD. Below that we hand the render
// callback back to the caller so the plain HTML table (with <thead>
// sticky, keyboard nav, etc.) keeps working — windowing a 5-row table
// loses every accessibility affordance for no measurable gain.
export function VirtualList<Row>({
  items,
  rowHeight,
  height = 560,
  className,
  ariaLabel,
  renderRow,
  children,
}: VirtualListProps<Row>) {
  if (items.length < VIRTUALIZATION_THRESHOLD) {
    if (!children) return null;
    return <>{children((row, index) => renderRow(row, index, {}))}</>;
  }

  const RowComponent = ({
    index,
    style,
    items: rows,
  }: RowComponentProps<{ items: ReadonlyArray<Row> }>): ReactElement | null => {
    const row = rows[index];
    if (row === undefined) return null;
    return <>{renderRow(row, index, style)}</>;
  };

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={cn('overflow-hidden rounded-md', className)}
      style={
        // dynamic viewport height is runtime data; Tailwind cannot
        // compile `h-[${n}px]` at build time.
        // eslint-disable-next-line no-restricted-syntax
        { height }
      }
    >
      <List
        rowCount={items.length}
        rowHeight={rowHeight}
        rowComponent={RowComponent}
        rowProps={{ items }}
        defaultHeight={height}
        overscanCount={5}
      />
    </div>
  );
}
