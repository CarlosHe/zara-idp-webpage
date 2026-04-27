import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import type { HomeRecommendation } from '../types/home';
import { SEVERITY_LABEL, SEVERITY_TONE } from './HomeUtils';

interface RecommendationsCardProps {
  items: HomeRecommendation[];
  onAction: (widget: string, kind: string, id?: string) => void;
}

// Sprint-24 / L-2402+L-2405 — surfaces the deterministic ranked
// recommendations from the backend recommender. Each item links to a
// safe-handoff surface (Golden Path, doc, scorecard, approval).
export function RecommendationsCard({ items, onAction }: RecommendationsCardProps) {
  return (
    <Card
      role="region"
      aria-label="Recommended next steps"
      data-testid="home-recommendations-card"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" aria-hidden />
          <span>Recommended for you</span>
          <Badge
            variant="outline"
            aria-label={`${items.length} recommendations`}
          >
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">
            No recommendations right now.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.action.path || '#'}
                  onClick={() =>
                    onAction('recommendations', item.action.kind, item.id)
                  }
                  className="block rounded-md border border-slate-700/60 bg-slate-800/40 px-3 py-2 hover:border-purple-500/60 hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-slate-100">
                      {item.title}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${SEVERITY_TONE[item.severity]}`}
                      aria-label={`Severity ${SEVERITY_LABEL[item.severity]}`}
                    >
                      {item.kind.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {item.reason}
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
