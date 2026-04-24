import { Link } from 'react-router-dom';
import { User, Bot, Cpu, CheckCircle, XCircle, ShieldBan } from 'lucide-react';
import { TableRow, TableCell } from '@/shared/components/ui';
import { ROUTES } from '@/shared/config';
import { cn, formatDateTime } from '@/shared/utils';
import type { AuditEntry } from '@/shared/types';

interface AuditRowProps {
  entry: AuditEntry;
}

const actorIcons: Record<string, typeof User> = {
  user: User,
  system: Bot,
  automation: Cpu,
};

const resultConfig: Record<string, { icon: typeof CheckCircle; color: string }> = {
  success: { icon: CheckCircle, color: 'text-emerald-400' },
  failure: { icon: XCircle, color: 'text-red-400' },
  blocked: { icon: ShieldBan, color: 'text-yellow-400' },
};

export function AuditRow({ entry }: AuditRowProps) {
  const ActorIcon = actorIcons[entry.actorType] || User;
  const ResultIcon = resultConfig[entry.result]?.icon || CheckCircle;
  const resultColor = resultConfig[entry.result]?.color || 'text-slate-400';

  return (
    <TableRow>
      <TableCell>
        <span className="text-slate-400 text-sm font-mono">
          {formatDateTime(entry.timestamp)}
        </span>
      </TableCell>
      <TableCell>
        <Link
          to={ROUTES.AUDIT.DETAIL(entry.id)}
          className="font-medium hover:text-blue-400 transition-colors"
        >
          {entry.action}
        </Link>
      </TableCell>
      <TableCell>
        <span className="text-slate-400">
          {entry.resourceKind}/{entry.resourceNamespace}/{entry.resourceName}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <ActorIcon className="h-4 w-4 text-slate-500" />
          <span className="text-slate-300">{entry.actor}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className={cn('flex items-center gap-1', resultColor)}>
          <ResultIcon className="h-4 w-4" />
          <span className="capitalize text-sm">{entry.result}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}
