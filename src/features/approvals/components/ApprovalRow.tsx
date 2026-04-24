import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/config';
import {
  StatusBadge,
  Button,
  TableRow,
  TableCell,
} from '@/shared/components/ui';
import { cn, formatRelativeTime } from '@/shared/utils';
import type { Approval } from '@/shared/types';

const OPERATION_COLORS: Record<string, string> = {
  create: 'text-emerald-400 bg-emerald-500/20',
  update: 'text-blue-400 bg-blue-500/20',
  delete: 'text-red-400 bg-red-500/20',
};

interface ApprovalRowProps {
  approval: Approval;
}

export function ApprovalRow({ approval }: ApprovalRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Link
          to={ROUTES.APPROVALS.DETAIL(approval.id)}
          className="hover:text-blue-400 transition-colors"
        >
          <span className="font-medium">{approval.resourceName}</span>
          <span className="text-slate-500 ml-2">
            {approval.resourceKind}/{approval.resourceNamespace}
          </span>
        </Link>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'px-2 py-0.5 rounded text-xs font-medium',
            OPERATION_COLORS[approval.operation],
          )}
        >
          {approval.operation.toUpperCase()}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-slate-400">{approval.requestedBy}</span>
      </TableCell>
      <TableCell>
        <StatusBadge status={approval.status} type="approval" />
      </TableCell>
      <TableCell>
        <span className="text-slate-500">{formatRelativeTime(approval.requestedAt)}</span>
      </TableCell>
      <TableCell>
        <span className="text-slate-500">{formatRelativeTime(approval.expiresAt)}</span>
      </TableCell>
      <TableCell>
        <Link to={ROUTES.APPROVALS.DETAIL(approval.id)}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  );
}
