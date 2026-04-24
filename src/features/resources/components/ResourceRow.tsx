import { Link } from 'react-router-dom';
import {
  Box,
  Pencil,
  Trash2,
  RefreshCw,
  GitCompare,
} from 'lucide-react';
import { ROUTES } from '@/shared/config';
import {
  StatusBadge,
  TableRow,
  TableCell,
  Button,
} from '@/shared/components/ui';
import { formatRelativeTime } from '@/shared/utils';
import type { Resource, HealthStatus } from '@/shared/types';
import { kindIcons } from './constants';

interface ResourceRowProps {
  resource: Resource;
  onDetectDrift: (resource: Resource) => void;
  onReconcile: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
}

export function ResourceRow({
  resource,
  onDetectDrift,
  onReconcile,
  onEdit,
  onDelete,
}: ResourceRowProps) {
  const KindIcon = kindIcons[resource.kind] || Box;
  const namespace = resource.metadata?.namespace || resource.namespace || '';
  const name = resource.metadata?.name || resource.name || '';

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <KindIcon className="h-4 w-4 text-gray-400" aria-hidden />
          <span className="font-mono text-sm">{resource.kind}</span>
        </div>
      </TableCell>
      <TableCell>
        <Link
          to={ROUTES.RESOURCES.DETAIL(resource.kind, namespace, name)}
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          {name}
        </Link>
      </TableCell>
      <TableCell>
        <Link
          to={`${ROUTES.RESOURCES.LIST}?namespace=${namespace}`}
          className="text-gray-400 hover:text-gray-300"
        >
          {namespace}
        </Link>
      </TableCell>
      <TableCell>
        <StatusBadge
          type="health"
          status={(resource.status || 'Unknown') as HealthStatus}
        />
      </TableCell>
      <TableCell>
        <span className="text-gray-400 text-sm">v{resource.version}</span>
      </TableCell>
      <TableCell>
        <span className="text-gray-400 text-sm">
          {formatRelativeTime(resource.updatedAt)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
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
      </TableCell>
    </TableRow>
  );
}
