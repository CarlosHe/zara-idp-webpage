import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, Bell, CheckSquare } from 'lucide-react';
import { Badge, TableRow, TableCell } from '@/shared/components/ui';
import { ROUTES } from '@/shared/config';
import { cn } from '@/shared/utils';
import type { RuntimePolicy } from '@/shared/types';

type ActionConfig = { icon: typeof Shield; color: string };

const ACTION_CONFIG: Record<string, ActionConfig> = {
  freeze: { icon: AlertTriangle, color: 'text-cyan-400 bg-cyan-500/20' },
  deny: { icon: Shield, color: 'text-red-400 bg-red-500/20' },
  warn: { icon: Bell, color: 'text-yellow-400 bg-yellow-500/20' },
  notify: { icon: Bell, color: 'text-blue-400 bg-blue-500/20' },
  requireApproval: { icon: CheckSquare, color: 'text-purple-400 bg-purple-500/20' },
};

const DEFAULT_ACTION_COLOR = 'text-slate-400 bg-slate-500/20';

export interface PolicyRowProps {
  policy: RuntimePolicy;
  disabled?: boolean;
}

export function PolicyRow({ policy, disabled }: PolicyRowProps) {
  const config = ACTION_CONFIG[policy.action.type];
  const ActionIcon = config?.icon ?? Shield;
  const actionColor = config?.color ?? DEFAULT_ACTION_COLOR;

  return (
    <TableRow className={cn(disabled && 'opacity-60')}>
      <TableCell>
        <Link
          to={ROUTES.POLICIES.DETAIL(policy.namespace, policy.name)}
          className="font-medium hover:text-blue-400 transition-colors"
        >
          {policy.name}
        </Link>
        <p className="text-xs text-slate-500">{policy.namespace}</p>
      </TableCell>
      <TableCell>
        <span className="text-slate-400">{policy.description}</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {policy.triggers.map((trigger, i) => (
            <Badge key={i} variant="outline">
              {trigger.type}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
            actionColor,
          )}
        >
          <ActionIcon className="h-3 w-3" />
          {policy.action.type}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-slate-400">
          {policy.scope.namespaces.length > 0
            ? `${policy.scope.namespaces.length} ns`
            : 'All namespaces'}
        </span>
      </TableCell>
    </TableRow>
  );
}
