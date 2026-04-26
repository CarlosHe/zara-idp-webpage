import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/shared/components/ui';
import type { Scorecard } from '../types';
import { lifecycleVariant } from './severityBadge';

interface ScorecardListProps {
  scorecards: Scorecard[];
  selected: Scorecard | null;
  onSelect: (scorecard: Scorecard) => void;
}

export function ScorecardList({ scorecards, selected, onSelect }: ScorecardListProps) {
  if (scorecards.length === 0) {
    return (
      <EmptyState
        title="No scorecards yet"
        description="Create the first scorecard with the rule builder on the right."
      />
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scorecards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {scorecards.map((sc) => {
          const isActive = selected?.slug === sc.slug;
          return (
            <button
              key={sc.slug}
              type="button"
              onClick={() => onSelect(sc)}
              aria-pressed={isActive}
              className={
                'w-full text-left rounded border px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ' +
                (isActive
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-slate-700 hover:border-slate-500')
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-100">{sc.title}</span>
                <Badge variant={lifecycleVariant(sc.lifecycle)}>{sc.lifecycle}</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">slug: {sc.slug}</p>
              <p className="text-xs text-slate-400">
                {sc.rules.length} rule{sc.rules.length === 1 ? '' : 's'} · owner {sc.owner}
              </p>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
