import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import type { BudgetEvaluation } from '../types/cost';
import { BUDGET_STATE_TONE, formatBP, formatMoney } from './costFormat';

interface BudgetsCardProps {
  budgets: BudgetEvaluation[];
}

// Sprint-26 / L-2603 + L-2605 — budgets card. Renders the latest
// evaluation per budget; warns + breach states are visually
// distinct and sorted to the top by the backend.
export function BudgetsCard({ budgets }: BudgetsCardProps) {
  return (
    <Card data-testid="cost-budgets">
      <CardHeader>
        <CardTitle className="text-sm uppercase text-slate-400">
          Budgets
        </CardTitle>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <p className="text-sm text-slate-400">
            No budgets defined yet — create one to surface chargeback
            warnings + remediation proposals.
          </p>
        ) : (
          <ul className="space-y-3">
            {budgets.map((b) => (
              <li
                key={b.budgetId}
                data-testid={`cost-budget-${b.budgetId}`}
                className="rounded border border-slate-800 bg-slate-900/40 p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="font-medium text-slate-100">
                      {b.budgetName}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                      {scopeSummary(b.scope)}
                    </span>
                  </div>
                  <Badge className={BUDGET_STATE_TONE[b.state]}>
                    {b.state}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>
                    {formatMoney(b.spend)} / {formatMoney(b.cap)}
                  </span>
                  <span className="font-mono text-slate-200">
                    {formatBP(b.utilisationBP)}
                  </span>
                </div>
                <div
                  className="mt-2 h-2 w-full rounded bg-slate-800 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={b.utilisationBP}
                  aria-valuemin={0}
                  aria-valuemax={10000}
                >
                  <div
                    className={`h-full ${stateBarTone(b.state)}`}
                    // eslint-disable-next-line no-restricted-syntax -- dynamic budget utilisation bar width
                    style={{ width: `${Math.min(100, b.utilisationBP / 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function scopeSummary(scope: BudgetEvaluation['scope']): string {
  return [scope.team, scope.service, scope.environment, scope.resource]
    .filter(Boolean)
    .join(' · ');
}

function stateBarTone(state: BudgetEvaluation['state']): string {
  if (state === 'breach') return 'bg-red-500/70';
  if (state === 'warning') return 'bg-amber-500/70';
  return 'bg-emerald-500/70';
}
