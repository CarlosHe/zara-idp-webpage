import { Link } from 'react-router-dom';
import { Box, Sparkles } from 'lucide-react';
import { ROUTES } from '@/shared/config';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  buttonVariants,
  VIRTUALIZATION_THRESHOLD,
  VirtualList,
} from '@/shared/components/ui';
import { DataEmptyState, LoadingState } from '@/shared/components/feedback';
import { cn } from '@/shared/utils';
import type { Resource, ResourceKind } from '@/shared/types';
import { ResourceRow } from './ResourceRow';
import { ResourceVirtualRow } from './ResourceVirtualRow';

interface ResourceListViewProps {
  items: Resource[];
  loading: boolean;
  kindFilter: ResourceKind | null;
  namespaceFilter: string | null;
  onDetectDrift: (resource: Resource) => void;
  onReconcile: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
}

const COLUMNS = [
  { key: 'kind', label: 'Kind' },
  { key: 'name', label: 'Name' },
  { key: 'namespace', label: 'Namespace' },
  { key: 'status', label: 'Status' },
  { key: 'version', label: 'Version' },
  { key: 'updated', label: 'Updated' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
];

export function ResourceListView({
  items,
  loading,
  kindFilter,
  namespaceFilter,
  onDetectDrift,
  onReconcile,
  onEdit,
  onDelete,
}: ResourceListViewProps) {
  const hasFilters = Boolean(kindFilter || namespaceFilter);
  const isVirtualized = items.length >= VIRTUALIZATION_THRESHOLD;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resources ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingState message="Loading resources..." iconClassName="text-purple-400" />
        ) : items.length === 0 ? (
          <DataEmptyState
            icon={<Box className="h-12 w-12 text-purple-400" aria-hidden />}
            title="No resources found"
            description={
              hasFilters
                ? 'Try adjusting your filters'
                : 'Create your first resource using Golden Paths'
            }
            action={
              !hasFilters ? (
                <Link to={ROUTES.GOLDEN_PATHS} className={cn(buttonVariants())}>
                  <Sparkles className="h-4 w-4 mr-2" aria-hidden />
                  Go to Golden Paths
                </Link>
              ) : undefined
            }
          />
        ) : isVirtualized ? (
          <div role="table" aria-label={`${items.length} resources`} aria-rowcount={items.length}>
            <div
              role="row"
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,.8fr)_minmax(0,.6fr)_minmax(0,.8fr)_minmax(0,1.4fr)] gap-3 border-b border-slate-700 bg-slate-800/50 px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-400"
            >
              {COLUMNS.map((col) => (
                <div
                  key={col.key}
                  role="columnheader"
                  className={col.align === 'right' ? 'text-right' : undefined}
                >
                  {col.label}
                </div>
              ))}
            </div>
            <VirtualList
              items={items}
              rowHeight={64}
              height={640}
              ariaLabel={`${items.length} resources`}
              renderRow={(resource, _index, style) => (
                <ResourceVirtualRow
                  resource={resource}
                  style={style}
                  onDetectDrift={onDetectDrift}
                  onReconcile={onReconcile}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              )}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {COLUMNS.map((col) => (
                    <TableHead
                      key={col.key}
                      className={col.align === 'right' ? 'text-right' : undefined}
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((resource) => (
                  <ResourceRow
                    key={resource.id}
                    resource={resource}
                    onDetectDrift={onDetectDrift}
                    onReconcile={onReconcile}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
