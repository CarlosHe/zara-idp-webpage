import { useMemo, useState } from 'react';
import { Sparkles, ShieldCheck, RotateCcw, Lock, Workflow } from 'lucide-react';
import { PageHeader } from '@/shared/components/feedback';
import { Alert, Skeleton, Button } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import {
  useExecuteGoldenPathMutation,
  useListGoldenPathsQuery,
} from '../services/goldenPathsApi';
import type {
  GoldenPathExecuteResponse,
  GoldenPathSummary,
} from '../types';

// Sprint-19 / L-1908 — Marketplace + parameterise + dry-run flow.
//
// The view fetches the registry, lets the user pick a path, fills in
// parameters, runs a dry-run that surfaces the action plan, declared
// secrets, rollback plan, and policy preview, and finally executes
// (or stops if policy blocks). Approval/output handoff is delegated
// to the existing `/changesets` and `/audit` shells via the response
// payload returned by the backend.
export function GoldenPathMarketplace() {
  const list = useListGoldenPathsQuery();
  const [selectedID, setSelectedID] = useState<string | null>(null);

  const selected = useMemo(
    () => list.data?.find((p) => p.id === selectedID) ?? null,
    [list.data, selectedID],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Sparkles className="h-6 w-6" />}
        iconClassName="text-yellow-400"
        title="Golden Path Marketplace"
        description="Browse, parameterise, dry-run, and execute Zara Golden Paths"
      />

      {list.isLoading ? (
        <Skeleton className="h-32" />
      ) : list.isError ? (
        <Alert type="error" title="Failed to load Golden Paths">
          {errorMessage(list.error)}
        </Alert>
      ) : (list.data ?? []).length === 0 ? (
        <Alert type="info" title="No Golden Paths registered yet">
          The Golden Path registry is reachable but no paths are published.
        </Alert>
      ) : !selected ? (
        <MarketplaceList paths={list.data ?? []} onSelect={(id) => setSelectedID(id)} />
      ) : (
        <PathDetail path={selected} onBack={() => setSelectedID(null)} />
      )}
    </div>
  );
}

interface MarketplaceListProps {
  paths: GoldenPathSummary[];
  onSelect: (id: string) => void;
}

function MarketplaceList({ paths, onSelect }: MarketplaceListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {paths.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p.id)}
          className="text-left rounded-lg border border-slate-700 bg-slate-800/50 p-4 hover:border-yellow-500/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/60"
        >
          <div className="flex items-center gap-2 text-yellow-400">
            <Workflow className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">
              {p.category || 'service'} · v{p.version}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-slate-100">{p.name}</h3>
          <p className="mt-1 text-sm text-slate-400 line-clamp-3">{p.description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
            <Badge>{`${p.actions.length} actions`}</Badge>
            {p.secrets && p.secrets.length > 0 && <Badge>{`${p.secrets.length} secrets`}</Badge>}
            {p.policy?.previewBeforeExecute && <Badge>policy preview</Badge>}
            {p.hasRollbackPlan && <Badge>rollback plan</Badge>}
          </div>
        </button>
      ))}
    </div>
  );
}

interface PathDetailProps {
  path: GoldenPathSummary;
  onBack: () => void;
}

function PathDetail({ path, onBack }: PathDetailProps) {
  const [execute, executeState] = useExecuteGoldenPathMutation();
  const [params, setParams] = useState<Record<string, string>>(() => initialParams(path));
  const [response, setResponse] = useState<GoldenPathExecuteResponse | null>(null);
  const [mode, setMode] = useState<'dry-run' | 'execute' | null>(null);

  const isFormValid = useMemo(
    () => path.parameters.every((p) => !p.required || (params[p.name] ?? '').trim() !== ''),
    [path.parameters, params],
  );

  const handleSubmit = async (dryRun: boolean) => {
    setMode(dryRun ? 'dry-run' : 'execute');
    try {
      const result = await execute({ id: path.id, parameters: params, dryRun }).unwrap();
      setResponse(result);
    } catch {
      setResponse(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back to marketplace
        </Button>
        <div className="text-xs text-slate-400">
          Path <code className="text-slate-200">{path.id}</code> v{path.version}
        </div>
      </div>

      <h2 className="text-xl font-semibold text-slate-100">{path.name}</h2>
      <p className="text-sm text-slate-400">{path.description}</p>

      <ParamsForm path={path} values={params} onChange={setParams} />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={!isFormValid || executeState.isLoading}
          onClick={() => void handleSubmit(true)}
        >
          Dry-run
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={!isFormValid || executeState.isLoading || isBlocked(response)}
          onClick={() => void handleSubmit(false)}
        >
          Execute
        </Button>
      </div>

      {executeState.isError && (
        <Alert type="error" title="Execution failed">
          {errorMessage(executeState.error)}
        </Alert>
      )}

      {response && <ExecutionResult response={response} mode={mode ?? 'dry-run'} />}
    </div>
  );
}

interface ParamsFormProps {
  path: GoldenPathSummary;
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}

function ParamsForm({ path, values, onChange }: ParamsFormProps) {
  if (path.parameters.length === 0) {
    return <p className="text-sm text-slate-400">This Golden Path requires no parameters.</p>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {path.parameters.map((p) => (
        <label key={p.name} className="block text-sm">
          <span className="text-slate-200">
            {p.label || p.name}
            {p.required && <span className="text-red-400"> *</span>}
          </span>
          {p.type === 'select' ? (
            <select
              className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
              value={values[p.name] ?? ''}
              onChange={(e) => onChange({ ...values, [p.name]: e.target.value })}
            >
              <option value="">Select…</option>
              {(p.options ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
              type="text"
              placeholder={p.example}
              value={values[p.name] ?? ''}
              onChange={(e) => onChange({ ...values, [p.name]: e.target.value })}
            />
          )}
          {p.description && (
            <span className="mt-1 block text-xs text-slate-400">{p.description}</span>
          )}
        </label>
      ))}
    </div>
  );
}

interface ExecutionResultProps {
  response: GoldenPathExecuteResponse;
  mode: 'dry-run' | 'execute';
}

function ExecutionResult({ response, mode }: ExecutionResultProps) {
  const blocked = response.policyPreview?.Decision === 'blocked';
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">
          {blocked ? 'Blocked by policy preview' : `${mode === 'dry-run' ? 'Dry-run' : 'Execution'} complete`}
        </h3>
        {response.executionId && (
          <code className="text-xs text-slate-500">execId: {response.executionId}</code>
        )}
      </div>
      {response.message && <p className="text-sm text-slate-300">{response.message}</p>}
      {response.policyPreview && (
        <PolicyBadge
          decision={response.policyPreview.Decision}
          risk={response.policyPreview.Risk}
          findings={response.policyPreview.Findings ?? []}
        />
      )}
      {(response.declaredSecrets ?? []).length > 0 && (
        <Section title="Declared secrets" icon={<Lock className="h-4 w-4 text-amber-300" />}>
          <ul className="text-xs text-slate-300 list-disc list-inside">
            {(response.declaredSecrets ?? []).map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </Section>
      )}
      {(response.actionPlan ?? []).length > 0 && (
        <Section title="Action plan" icon={<Workflow className="h-4 w-4 text-yellow-400" />}>
          <ul className="text-xs text-slate-300 space-y-1">
            {(response.actionPlan ?? []).map((a) => (
              <li key={a.ID} className="flex items-center gap-2">
                <code className="text-slate-200">{a.ID}</code>
                <span className="text-slate-500">·</span>
                <code className="text-slate-400">{a.Kind}</code>
                {a.Irreversible && <span className="text-amber-300">irreversible</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}
      {(response.rollbackPlan ?? []).length > 0 && (
        <Section title="Rollback plan" icon={<RotateCcw className="h-4 w-4 text-emerald-400" />}>
          <ul className="text-xs text-slate-300 space-y-1">
            {(response.rollbackPlan ?? []).map((r) => (
              <li key={r.ActionID} className="flex items-center gap-2">
                <code className="text-slate-200">{r.ActionID}</code>
                <span className="text-slate-500">→</span>
                <code className="text-slate-400">{r.Kind || 'irreversible'}</code>
                {r.Reason && <span className="text-slate-500">({r.Reason})</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function PolicyBadge({
  decision,
  risk,
  findings,
}: {
  decision: 'allowed' | 'blocked';
  risk?: string;
  findings: string[];
}) {
  const blocked = decision === 'blocked';
  return (
    <div
      className={`rounded-md px-3 py-2 text-xs ${
        blocked
          ? 'bg-red-500/10 border border-red-500/40 text-red-200'
          : 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-200'
      }`}
    >
      <div className="flex items-center gap-2 font-semibold">
        <ShieldCheck className="h-4 w-4" />
        Policy {decision} {risk && <span className="text-slate-300">· risk {risk}</span>}
      </div>
      {findings.length > 0 && (
        <ul className="mt-1 list-disc list-inside text-slate-300">
          {findings.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
        {icon}
        {title}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-xs text-slate-200">{children}</span>
  );
}

function isBlocked(response: GoldenPathExecuteResponse | null): boolean {
  return response?.policyPreview?.Decision === 'blocked';
}

function initialParams(path: GoldenPathSummary): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of path.parameters) {
    if (p.default !== undefined && p.default !== null) {
      out[p.name] = String(p.default);
    }
  }
  return out;
}
