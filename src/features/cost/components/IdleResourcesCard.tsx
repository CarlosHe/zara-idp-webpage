import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import type { ShowbackBucket } from '../types/cost';
import { formatMoney } from './costFormat';

interface IdleResourcesCardProps {
  buckets: ShowbackBucket[];
}

// Sprint-26 / L-2605 — idle resource shortlist. Drives the
// `cost.idle-resource` remediation handoff.
export function IdleResourcesCard({ buckets }: IdleResourcesCardProps) {
  return (
    <Card data-testid="cost-idle-resources">
      <CardHeader>
        <CardTitle className="text-sm uppercase text-slate-400">
          Idle resources
        </CardTitle>
      </CardHeader>
      <CardContent>
        {buckets.length === 0 ? (
          <p className="text-sm text-slate-400">No idle resources detected.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {buckets.map((b, idx) => (
              <li
                key={`${b.label}-${idx}`}
                className="flex items-center justify-between"
                data-testid={`cost-idle-${b.label}`}
              >
                <span>{b.label || '—'}</span>
                <span className="font-mono text-sky-200">
                  {formatMoney(b.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
