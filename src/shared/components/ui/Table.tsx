import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/shared/utils';

interface TableProps extends ComponentPropsWithoutRef<'table'> {
  wrapperClassName?: string;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, wrapperClassName, ...rest }, ref) => (
    <div className={cn('overflow-x-auto', wrapperClassName)}>
      <table ref={ref} className={cn('w-full text-sm', className)} {...rest} />
    </div>
  ),
);
Table.displayName = 'Table';

const TableHeader = forwardRef<HTMLTableSectionElement, ComponentPropsWithoutRef<'thead'>>(
  ({ className, ...rest }, ref) => (
    <thead
      ref={ref}
      className={cn('bg-slate-800/50 border-b border-slate-700', className)}
      {...rest}
    />
  ),
);
TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<HTMLTableSectionElement, ComponentPropsWithoutRef<'tbody'>>(
  ({ className, ...rest }, ref) => (
    <tbody
      ref={ref}
      className={cn('divide-y divide-slate-700/50', className)}
      {...rest}
    />
  ),
);
TableBody.displayName = 'TableBody';

type TableRowProps = ComponentPropsWithoutRef<'tr'>;

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, onClick, ...rest }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'transition-colors hover:bg-slate-700/30',
        onClick ? 'cursor-pointer' : undefined,
        className,
      )}
      onClick={onClick}
      {...rest}
    />
  ),
);
TableRow.displayName = 'TableRow';

const TableHead = forwardRef<HTMLTableCellElement, ComponentPropsWithoutRef<'th'>>(
  ({ className, ...rest }, ref) => (
    <th
      ref={ref}
      scope="col"
      className={cn(
        'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400',
        className,
      )}
      {...rest}
    />
  ),
);
TableHead.displayName = 'TableHead';

const TableCell = forwardRef<HTMLTableCellElement, ComponentPropsWithoutRef<'td'>>(
  ({ className, ...rest }, ref) => (
    <td ref={ref} className={cn('px-4 py-3 text-slate-300', className)} {...rest} />
  ),
);
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
export type { TableProps, TableRowProps };
