import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import type { HomeQuickLink } from '../types/home';

interface QuickLinksCardProps {
  items: HomeQuickLink[];
  onAction: (widget: string, kind: string, id?: string) => void;
}

// Sprint-24 / L-2403 — the quick-links card always renders. For new
// developers without dynamic evidence the recommender feeds it from
// the Golden Path registry so the home page is never empty.
export function QuickLinksCard({ items, onAction }: QuickLinksCardProps) {
  return (
    <Card role="region" aria-label="Quick links">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-emerald-400" aria-hidden />
          <span>Quick links</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">No quick links available.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {items.map((item) => (
              <li key={`${item.kind}:${item.id}`}>
                <Link
                  to={item.action.path || '#'}
                  onClick={() =>
                    onAction('quickLinks', item.action.kind, item.id)
                  }
                  className="flex h-full items-center gap-2 rounded-md border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-100 hover:border-emerald-500/60 hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <span className="font-medium">{item.title}</span>
                  {item.description ? (
                    <span className="truncate text-xs text-slate-400">
                      — {item.description}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
