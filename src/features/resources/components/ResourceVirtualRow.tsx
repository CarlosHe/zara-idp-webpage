import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Box, GitCompare, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { ROUTES } from '@/shared/config';
import { Button, StatusBadge } from '@/shared/components/ui';
import { formatRelativeTime } from '@/shared/utils';
import type { HealthStatus, Resource } from '@/shared/types';
import { kindIcons } from './constants';

interface ResourceVirtualRowProps {
  resource: Resource;
  style: CSSProperties;
  onDetectDrift: (resource: Resource) => void;
  onReconcile: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
}

// Div-based row used in virtualized mode. react-window wants absolutely
// positioned children with explicit heights, which is incompatible with
// `<tr>`/`<table>` flow. The layout is a 7-column grid that mirrors the
// non-virtualized `<ResourceRow>`.
export function ResourceVirtualRow({
  resource,
  style,
  onDetectDrift,
  onReconcile,
  onEdit,
  onDelete,
}: ResourceVirtualRowProps) {
  const KindIcon = kindIcons[resource.kind] || Box;
  const namespace = resource.metadata?.namespace || resource.namespace || '';
  const name = resource.metadata?.name || resource.name || '';

  return (
    <div
      role="row"
      style={style}
      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,.8fr)_minmax(0,.6fr)_minmax(0,.8fr)_minmax(0,1.4fr)] items-center gap-3 border-b border-slate-700/50 px-4 text-sm text-slate-300 hover:bg-slate-700/30"
    >
      <div role="cell" className="flex items-center gap-2 min-w-0">
        <KindIcon className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden />
        <span className="font-mono truncate">{resource.kind}</span>
      </div>
      <div role="cell" className="min-w-0">
        <Link
          to={ROUTES.RESOURCES.DETAIL(resource.kind, namespace, name)}
          className="text-blue-300 hover:text-blue-200 font-medium truncate inline-block max-w-full"
        >
          {name}
        </Link>
      </div>
      <div role="cell" className="min-w-0">
        <Link
          to={`${ROUTES.RESOURCES.LIST}?namespace=${namespace}`}
          className="text-gray-300 hover:text-gray-200 truncate inline-block max-w-full"
        >
          {namespace}
        </Link>
      </div>
      <div role="cell">
        <StatusBadge type="health" status={(resource.status || 'Unknown') as HealthStatus} />
      </div>
      <div role="cell">
        <span className="text-gray-400">v{resource.version}</span>
      </div>
      <div role="cell">
        <span className="text-gray-400">{formatRelativeTime(resource.updatedAt)}</span>
      </div>
      <div role="cell" className="flex justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDetectDrift(resource)}
          aria-label={`Detect drift on ${resource.kind} ${name}`}
          title="Detect Drift"
        >
          <GitCompare className="h-3 w-3" aria-hidden />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onReconcile(resource)}
          aria-label={`Reconcile ${resource.kind} ${name}`}
          title="Reconcile"
        >
          <RefreshCw className="h-3 w-3" aria-hidden />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(resource)}
          aria-label={`Edit ${resource.kind} ${name}`}
          title="Edit"
        >
          <Pencil className="h-3 w-3" aria-hidden />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDelete(resource)}
          aria-label={`Delete ${resource.kind} ${name}`}
          title="Delete"
        >
          <Trash2 className="h-3 w-3" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
