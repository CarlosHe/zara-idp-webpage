import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import type { CostFinding } from '../types/cost';
import { SEVERITY_TONE, formatMoney } from './costFormat';

interface FindingsCardProps {
  findings: CostFinding[];
}

// Sprint-26 / L-2604 + L-2605 — cost findings card. Each row links
// the cost domain to the catalog via `entityKey`; the remediation
// inbox (Sprint 31) consumes the same shape.
export function FindingsCard({ findings }: FindingsCardProps) {
  return (
    <Card data-testid="cost-findings">
      <CardHeader>
        <CardTitle className="text-sm uppercase text-slate-400">
          Cost findings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {findings.length === 0 ? (
          <p className="text-sm text-slate-400">No findings.</p>
        ) : (
          <ul className="space-y-3">
            {findings.slice(0, 12).map((f, idx) => (
              <li
                key={`${f.code}-${f.entityKey}-${idx}`}
                className="rounded border border-slate-800 bg-slate-900/40 p-3"
                data-testid={`cost-finding-${f.code}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{f.code}</Badge>
                    <Badge className={SEVERITY_TONE[f.severity]}>
                      {f.severity}
                    </Badge>
                  </div>
                  <span className="font-mono text-emerald-200 text-xs">
                    {formatMoney(f.amount)}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{f.title}</p>
                <p className="text-xs text-slate-500 mt-1">{f.entityKey}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
