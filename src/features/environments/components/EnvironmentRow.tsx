import { Badge } from '@/shared/components/ui';
import type { Environment } from '../types/environments';
import {
  HEALTH_TONE,
  KIND_LABEL,
  SOURCE_LABEL,
  STATE_TONE,
  formatAge,
  formatDate,
  formatMoneyMinor,
  formatTTL,
} from './format';

interface EnvironmentRowProps {
  env: Environment;
  now?: Date;
  onDestroy?: (env: Environment) => void;
  onExtend?: (env: Environment) => void;
}

// Sprint 27 / L-2705 — a single environment row.
//
// Renders the slug, owner / team, kind / source, lifecycle state,
// health, age, TTL, optional cost projection, and the safe action
// cards (destroy, extend). Mutating actions are buttons that hand off
// to the parent component — the row itself never mutates.
export function EnvironmentRow({ env, now, onDestroy, onExtend }: EnvironmentRowProps) {
  const evalNow = now ?? new Date();
  const isTerminal = env.state === 'destroyed' || env.state === 'destroying';
  return (
    <li
      className="rounded border border-slate-800 bg-slate-900/40 p-4 space-y-2"
      data-testid={`env-row-${env.id}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium text-slate-100" data-testid={`env-slug-${env.id}`}>
          {env.slug}
        </span>
        <Badge className={STATE_TONE[env.state]} data-testid={`env-state-${env.id}`}>
          {env.state}
        </Badge>
        <Badge className={HEALTH_TONE[env.health]} data-testid={`env-health-${env.id}`}>
          {env.health}
        </Badge>
        <Badge variant="outline">{KIND_LABEL[env.kind]}</Badge>
        <Badge variant="outline">{SOURCE_LABEL[env.source]}</Badge>
        {env.catalogEntity ? (
          <span className="text-xs text-slate-400">{env.catalogEntity}</span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 md:grid-cols-4">
        <span>
          <span className="text-slate-500">Owner:</span> {env.owner}
        </span>
        <span>
          <span className="text-slate-500">Team:</span> {env.team}
        </span>
        <span>
          <span className="text-slate-500">Age:</span> {formatAge(env.createdAt, evalNow)}
        </span>
        <span data-testid={`env-ttl-${env.id}`}>
          <span className="text-slate-500">TTL:</span> {formatTTL(env.expiresAt, evalNow)}
        </span>
        <span>
          <span className="text-slate-500">Created:</span> {formatDate(env.createdAt)}
        </span>
        <span>
          <span className="text-slate-500">Expires:</span> {formatDate(env.expiresAt)}
        </span>
        {env.latestSpend ? (
          <span data-testid={`env-spend-${env.id}`}>
            <span className="text-slate-500">Spend:</span>{' '}
            {formatMoneyMinor(
              env.latestSpend.minorUnits,
              env.latestSpend.currency,
            )}
          </span>
        ) : null}
        {env.latestSpend ? (
          <span>
            <span className="text-slate-500">Daily:</span>{' '}
            {formatMoneyMinor(
              env.latestSpend.projectedDailyMinorUnits,
              env.latestSpend.currency,
            )}
          </span>
        ) : null}
      </div>

      {env.resources.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          {env.resources.map((r) => (
            <span
              key={`${r.provider}/${r.identifier}`}
              className="rounded bg-slate-800 px-2 py-1"
            >
              {r.provider}/{r.identifier}
            </span>
          ))}
        </div>
      ) : null}

      {env.healthMessage ? (
        <p className="text-xs text-amber-200">{env.healthMessage}</p>
      ) : null}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={isTerminal}
          onClick={() => onExtend?.(env)}
          className="rounded border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          data-testid={`env-extend-${env.id}`}
        >
          Extend TTL
        </button>
        <button
          type="button"
          disabled={isTerminal}
          onClick={() => onDestroy?.(env)}
          className="rounded border border-red-600/40 bg-red-500/10 px-3 py-1 text-xs text-red-200 hover:bg-red-500/20 disabled:opacity-50"
          data-testid={`env-destroy-${env.id}`}
        >
          Destroy
        </button>
      </div>
    </li>
  );
}
