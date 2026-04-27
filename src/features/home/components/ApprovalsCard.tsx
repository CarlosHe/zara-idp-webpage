import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import type { HomeApprovalItem } from '../types/home';
import { SEVERITY_LABEL, SEVERITY_TONE } from './HomeUtils';

interface ApprovalsCardProps {
  items: HomeApprovalItem[];
  onAction: (widget: string, kind: string, id?: string) => void;
}

// Sprint-24 / L-2405 — every card row links to the safe preview
// surface (`/approvals/:id`); the card never offers a direct mutation
// button. Engagement is recorded via `onAction`.
export function ApprovalsCard({ items, onAction }: ApprovalsCardProps) {
  return (
    <Card
      role="region"
      aria-label="Pending approvals waiting for you"
      data-testid="home-approvals-card"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-400" aria-hidden />
          <span>Approvals</span>
          <Badge variant="outline" aria-label={`${items.length} approvals`}>
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">
            No approvals waiting for you. Nice and quiet.
          </p>
        ) : (
          <ul className="space-y-3" data-testid="home-approvals-list">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.action.path}
                  onClick={() => onAction('approvals', item.action.kind, item.id)}
                  className="block rounded-md border border-slate-700/60 bg-slate-800/40 px-3 py-2 hover:border-blue-500/60 hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-slate-100">
                      {item.title}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${SEVERITY_TONE[item.severity]}`}
                      aria-label={`Severity ${SEVERITY_LABEL[item.severity]}`}
                    >
                      {SEVERITY_LABEL[item.severity]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.environment ?? 'unknown env'} •{' '}
                    {item.requestedBy ?? 'unknown'}
                    {item.waitingForYou ? ' • waiting for you' : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
