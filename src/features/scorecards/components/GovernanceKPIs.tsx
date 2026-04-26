import { Card, CardContent, CardHeader, CardTitle, LoadingState } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import { useGovernanceKPIsQuery } from '../services/scorecardsApi';

// `GovernanceKPIs` (Sprint 22 / L-2209) is the headline panel: active
// scorecards, draft scorecards, archived scorecards, active waivers,
// expired waivers — the platform-team's daily glance.
export function GovernanceKPIs() {
  const { data, isLoading, error } = useGovernanceKPIsQuery();

  if (isLoading) {
    return <LoadingState message="Loading governance KPIs..." />;
  }
  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-red-400">{errorMessage(error) || 'Failed to load KPIs'}</p>
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Governance KPIs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4" data-testid="governance-kpis">
          <KPI label="Active scorecards" value={data.scorecards.active} accent="text-emerald-300" />
          <KPI label="Draft scorecards" value={data.scorecards.draft} accent="text-yellow-300" />
          <KPI label="Archived scorecards" value={data.scorecards.archived} accent="text-slate-300" />
          <KPI label="Active waivers" value={data.waivers.active} accent="text-cyan-300" />
          <KPI label="Expired waivers" value={data.waivers.expired} accent="text-red-300" />
        </div>
      </CardContent>
    </Card>
  );
}

interface KPIProps {
  label: string;
  value: number;
  accent: string;
}

function KPI({ label, value, accent }: KPIProps) {
  return (
    <div className="rounded border border-slate-700 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-3xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}
