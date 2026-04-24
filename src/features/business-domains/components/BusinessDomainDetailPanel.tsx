import { Building2, ChevronRight, Database, Users } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { getTierColor, type BusinessDomain } from './types';

export interface BusinessDomainDetailPanelProps {
  domain: BusinessDomain | null;
  domains: BusinessDomain[];
  onSelect: (domain: BusinessDomain) => void;
}

export function BusinessDomainDetailPanel({
  domain,
  domains,
  onSelect,
}: BusinessDomainDetailPanelProps) {
  if (!domain) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Select a domain to view details</p>
        </CardContent>
      </Card>
    );
  }

  const tierLabel =
    domain.tier === 1 ? 'Critical' : domain.tier === 2 ? 'Important' : 'Standard';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-400" />
            {domain.displayName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase">Owner Team</label>
            <p className="text-white mt-1">{domain.owner}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase">Service Level</label>
            <div className="mt-1">
              <Badge className={getTierColor(domain.tier)}>
                Tier {domain.tier} - {tierLabel}
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase">Health Overview</label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Healthy</span>
                <span className="text-sm font-medium text-emerald-400">
                  {domain.healthySummary.healthy}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Degraded</span>
                <span className="text-sm font-medium text-amber-400">
                  {domain.healthySummary.degraded}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Unhealthy</span>
                <span className="text-sm font-medium text-red-400">
                  {domain.healthySummary.unhealthy}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Teams ({domain.teams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {domain.teams.length > 0 ? (
            <div className="space-y-2">
              {domain.teams.map((team) => (
                <div
                  key={team}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50"
                >
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-200">{team}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No teams assigned</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dependencies ({domain.dependencies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {domain.dependencies.length > 0 ? (
            <div className="space-y-2">
              {domain.dependencies.map((dep) => {
                const depDomain = domains.find((d) => d.id === dep);
                return (
                  <button
                    key={dep}
                    onClick={() => {
                      const found = domains.find((d) => d.id === dep);
                      if (found) onSelect(found);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                  >
                    <Database className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-slate-200">
                      {depDomain?.displayName || dep}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-600 ml-auto" />
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No dependencies</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
