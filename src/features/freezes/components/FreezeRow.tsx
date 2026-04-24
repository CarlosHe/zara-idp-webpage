import { Link } from 'react-router-dom';
import { Snowflake } from 'lucide-react';
import { ROUTES } from '@/shared/config';
import {
  Badge,
  TableRow,
  TableCell,
} from '@/shared/components/ui';
import { cn, formatRelativeTime } from '@/shared/utils';
import type { Freeze } from '@/shared/types';

interface FreezeRowProps {
  freeze: Freeze;
  inactive?: boolean;
}

export function FreezeRow({ freeze, inactive }: FreezeRowProps) {
  const scopeLabels: string[] = [];

  if (freeze.scope.global) {
    scopeLabels.push('Global');
  } else {
    if (freeze.scope.namespaces.length > 0) {
      scopeLabels.push(`${freeze.scope.namespaces.length} namespace(s)`);
    }
    if (freeze.scope.teams.length > 0) {
      scopeLabels.push(`${freeze.scope.teams.length} team(s)`);
    }
    if (freeze.scope.kinds.length > 0) {
      scopeLabels.push(`${freeze.scope.kinds.length} kind(s)`);
    }
  }

  return (
    <TableRow className={cn(inactive && 'opacity-60')}>
      <TableCell>
        <Link
          to={ROUTES.FREEZES.DETAIL(freeze.id)}
          className="font-medium hover:text-blue-400 transition-colors flex items-center gap-2"
        >
          {freeze.active && <Snowflake className="h-4 w-4 text-cyan-400" />}
          {freeze.name}
        </Link>
      </TableCell>
      <TableCell>
        <span className="text-slate-400">{freeze.reason}</span>
      </TableCell>
      <TableCell>
        <span className="text-slate-400">{freeze.createdBy}</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {scopeLabels.map((label, i) => (
            <Badge key={i} variant="outline">
              {label}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        {freeze.expiresAt ? (
          <span className="text-slate-400">{formatRelativeTime(freeze.expiresAt)}</span>
        ) : (
          <span className="text-slate-400">No expiration</span>
        )}
      </TableCell>
    </TableRow>
  );
}
