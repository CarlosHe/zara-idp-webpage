import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { User, Bot, Cpu, CheckCircle, XCircle, ShieldBan } from 'lucide-react';
import { ROUTES } from '@/shared/config';
import { cn, formatDateTime } from '@/shared/utils';
import type { AuditEntry } from '@/shared/types';

interface AuditVirtualRowProps {
  entry: AuditEntry;
  style: CSSProperties;
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

export function AuditVirtualRow({ entry, style }: AuditVirtualRowProps) {
  const ActorIcon = actorIcons[entry.actorType] || User;
  const ResultIcon = resultConfig[entry.result]?.icon || CheckCircle;
  const resultColor = resultConfig[entry.result]?.color || 'text-slate-400';

  return (
    <div
      role="row"
      style={style}
      className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,.8fr)] items-center gap-3 border-b border-slate-700/50 px-4 text-sm text-slate-300 hover:bg-slate-700/30"
    >
      <div role="cell" className="min-w-0">
        <span className="text-slate-400 text-sm font-mono truncate inline-block max-w-full">
          {formatDateTime(entry.timestamp)}
        </span>
      </div>
      <div role="cell" className="min-w-0">
        <Link
          to={ROUTES.AUDIT.DETAIL(entry.id)}
          className="font-medium hover:text-blue-300 transition-colors truncate inline-block max-w-full"
        >
          {entry.action}
        </Link>
      </div>
      <div role="cell" className="min-w-0">
        <span className="text-slate-400 truncate inline-block max-w-full">
          {entry.resourceKind}/{entry.resourceNamespace}/{entry.resourceName}
        </span>
      </div>
      <div role="cell" className="flex items-center gap-2 min-w-0">
        <ActorIcon className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden />
        <span className="text-slate-200 truncate">{entry.actor}</span>
      </div>
      <div role="cell" className={cn('flex items-center gap-1', resultColor)}>
        <ResultIcon className="h-4 w-4" aria-hidden />
        <span className="capitalize text-sm">{entry.result}</span>
      </div>
    </div>
  );
}
