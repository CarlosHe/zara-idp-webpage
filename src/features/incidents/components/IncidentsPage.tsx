import { useState } from 'react';
import { Siren } from 'lucide-react';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import {
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { useListIncidentsQuery } from '../services/incidentsApi';
import type { Incident, IncidentState } from '../types/incidents';
import { SEVERITY_TONE, STATE_LABEL, STATE_TONE } from './IncidentUtils';
import { IncidentDetail } from './IncidentDetail';

const STATE_FILTERS: Array<IncidentState | ''> = [
  '',
  'open',
  'acknowledged',
  'mitigated',
  'resolved',
];

// Sprint-25 / L-2507 — incident console. List on the left,
// timeline detail on the right. The console drives every transition
// through the use case (no direct mutation) so PagerDuty replays and
// human acks share the same audit trail.
export function IncidentsPage() {
  const [state, setState] = useState<IncidentState | ''>('open');
  const [selected, setSelected] = useState<string | null>(null);
  const { data, isFetching, error, refetch } = useListIncidentsQuery({
    state,
    limit: 50,
  });

  const incidents = data?.incidents ?? [];

  if (isFetching && !data) {
    return <LoadingState message="Loading incidents..." />;
  }
  if (error && !data) {
    return (
      <ErrorState
        message={errorMessage(error) || 'Failed to load incidents'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div
      className="space-y-6 animate-fade-in"
      aria-label="Incident console"
      data-testid="incidents-page"
    >
      <PageHeader
        icon={<Siren className="h-6 w-6" />}
        iconClassName="text-red-400"
        title="Incidents"
        description="Open incidents, timeline, owners, runbooks, and rollback candidates."
        onRefresh={refetch}
        actions={
          <div className="flex items-center gap-2" role="tablist">
            {STATE_FILTERS.map((filter) => (
              <button
                type="button"
                key={filter || 'all'}
                role="tab"
                aria-selected={state === filter}
                onClick={() => setState(filter)}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
                  state === filter
                    ? 'border-red-400 bg-red-500/20 text-red-200'
                    : 'border-slate-600 bg-slate-900 text-slate-300'
                }`}
                data-testid={`incidents-filter-${filter || 'all'}`}
              >
                {filter ? STATE_LABEL[filter] : 'All'}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          role="region"
          aria-label="Incident list"
          className="lg:col-span-1"
          data-testid="incidents-list"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">{incidents.length}</Badge>
              Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <p className="text-sm text-slate-400">
                No incidents match the current filter.
              </p>
            ) : (
              <ul className="space-y-2">
                {incidents.map((inc) => (
                  <li key={inc.id}>
                    <IncidentRow
                      inc={inc}
                      active={selected === inc.id}
                      onClick={() => setSelected(inc.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {selected ? (
            <IncidentDetail id={selected} />
          ) : (
            <Card role="region" aria-label="Incident detail">
              <CardContent>
                <p className="py-8 text-center text-sm text-slate-400">
                  Select an incident to view its timeline and runbooks.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface IncidentRowProps {
  inc: Incident;
  active: boolean;
  onClick: () => void;
}

function IncidentRow({ inc, active, onClick }: IncidentRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-testid={`incident-${inc.id}`}
      className={`w-full rounded-md border px-3 py-2 text-left transition ${
        active
          ? 'border-red-400 bg-slate-800/70'
          : 'border-slate-700/60 bg-slate-800/30 hover:border-red-500/40'
      }`}
    >
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`rounded-full border px-2 py-0.5 uppercase ${SEVERITY_TONE[inc.severity]}`}
        >
          {inc.severity}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 ${STATE_TONE[inc.state]}`}
        >
          {STATE_LABEL[inc.state]}
        </span>
        <span className="ml-auto text-[11px] text-slate-500">
          {inc.updatedAt}
        </span>
      </div>
      <div className="mt-1 truncate text-sm text-slate-100">{inc.title}</div>
      {inc.affected.length > 0 ? (
        <div className="mt-1 truncate text-[11px] text-slate-400">
          {inc.affected.map((a) => a.name).join(', ')}
        </div>
      ) : null}
    </button>
  );
}
