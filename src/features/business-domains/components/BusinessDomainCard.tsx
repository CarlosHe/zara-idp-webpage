import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Globe,
  Pencil,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { Badge, Card, CardContent } from '@/shared/components/ui';
import { cn } from '@/shared/utils';
import {
  getHealthPercentage,
  getTierColor,
  type BusinessDomain,
} from './types';

export interface BusinessDomainCardProps {
  domain: BusinessDomain;
  isSelected: boolean;
  onSelect: (domain: BusinessDomain) => void;
  onEdit: (domain: BusinessDomain) => void;
  onDelete: (domain: BusinessDomain) => void;
}

export function BusinessDomainCard({
  domain,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: BusinessDomainCardProps) {
  const healthPercentage = getHealthPercentage(domain);

  const handleSelectKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(domain);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Select domain ${domain.displayName}`}
      onClick={() => onSelect(domain)}
      onKeyDown={handleSelectKey}
      className="relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
    >
      <Card
        className={cn(
          'transition-all cursor-pointer hover:bg-slate-700/50',
          isSelected && 'ring-2 ring-purple-500',
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-white">{domain.displayName}</h3>
                <Badge className={getTierColor(domain.tier)}>Tier {domain.tier}</Badge>
              </div>
              <p className="text-sm text-slate-400 mb-3">{domain.description}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {domain.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-6 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {domain.teams.length} teams
                </span>
                <span className="flex items-center gap-1">
                  <Boxes className="h-3 w-3" />
                  {domain.resourceCount} resources
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {domain.dependencies.length} dependencies
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    'text-lg font-bold',
                    healthPercentage >= 90
                      ? 'text-emerald-400'
                      : healthPercentage >= 70
                        ? 'text-amber-400'
                        : 'text-red-400',
                  )}
                >
                  {healthPercentage}%
                </span>
                <span className="text-xs text-slate-400">health</span>
              </div>
              <div className="flex gap-1">
                <span className="flex items-center gap-0.5 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {domain.healthySummary.healthy}
                </span>
                <span className="flex items-center gap-0.5 text-xs text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  {domain.healthySummary.degraded}
                </span>
                <span className="flex items-center gap-0.5 text-xs text-red-400">
                  <XCircle className="h-3 w-3" />
                  {domain.healthySummary.unhealthy}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(domain);
          }}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-600 transition-colors bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Edit domain ${domain.displayName}`}
          title={`Edit domain ${domain.displayName}`}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(domain);
          }}
          className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Delete domain ${domain.displayName}`}
          title={`Delete domain ${domain.displayName}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
