import { useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';
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
import {
  useArchiveTenantMutation,
  useCreateTenantMutation,
  useListTenantsQuery,
  useReinstateTenantMutation,
  useSuspendTenantMutation,
} from '../services/tenantsApi';
import type { Tenant, TenantLifecycle } from '../types/tenants';

const LIFECYCLE_FILTERS: Array<TenantLifecycle | ''> = [
  '',
  'active',
  'suspended',
  'archived',
];

const LIFECYCLE_LABEL: Record<TenantLifecycle | '', string> = {
  '': 'All',
  active: 'Active',
  suspended: 'Suspended',
  archived: 'Archived',
};

const LIFECYCLE_TONE: Record<TenantLifecycle, string> = {
  active: 'border-emerald-400 bg-emerald-500/20 text-emerald-200',
  suspended: 'border-amber-400 bg-amber-500/20 text-amber-200',
  archived: 'border-slate-500 bg-slate-700/40 text-slate-300',
};

// Sprint 29 / L-2904 — tenant administration console.
//
// The page lists tenants with quick admin actions (suspend, reinstate,
// archive) and a "create tenant" panel. Every action goes through the
// REST surface which itself goes through the use-case layer; the UI
// never reaches a repository directly.
export function TenantsPage() {
  const [lifecycle, setLifecycle] = useState<TenantLifecycle | ''>('');
  const [search, setSearch] = useState('');
  const { data, isFetching, error, refetch } = useListTenantsQuery({
    lifecycle,
    q: search.trim() || undefined,
  });

  const [createDraft, setCreateDraft] = useState({
    id: '',
    slug: '',
    displayName: '',
    owner: '',
  });
  const [createTenant, createState] = useCreateTenantMutation();
  const [suspend] = useSuspendTenantMutation();
  const [reinstate] = useReinstateTenantMutation();
  const [archive] = useArchiveTenantMutation();

  const tenants = useMemo<Tenant[]>(() => data?.items ?? [], [data]);

  if (isFetching && !data) {
    return <LoadingState message="Loading tenants..." />;
  }
  if (error && !data) {
    return (
      <ErrorState
        message={errorMessage(error) || 'Failed to load tenants'}
        onRetry={refetch}
      />
    );
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !createDraft.id ||
      !createDraft.slug ||
      !createDraft.displayName ||
      !createDraft.owner
    ) {
      return;
    }
    try {
      await createTenant(createDraft).unwrap();
      setCreateDraft({ id: '', slug: '', displayName: '', owner: '' });
    } catch {
      // RTK error surface — handled inline below.
    }
  };

  return (
    <div
      className="space-y-6 animate-fade-in"
      aria-label="Tenant administration"
      data-testid="tenants-page"
    >
      <PageHeader
        icon={<Building2 className="h-6 w-6" />}
        iconClassName="text-indigo-400"
        title="Tenants"
        description="Multi-tenant administration: lifecycle, admins, quotas, and SLO snapshots."
        onRefresh={refetch}
        actions={
          <div className="flex flex-wrap items-center gap-2" role="tablist">
            {LIFECYCLE_FILTERS.map((filter) => (
              <button
                type="button"
                key={filter || 'all'}
                role="tab"
                aria-selected={lifecycle === filter}
                onClick={() => setLifecycle(filter)}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
                  lifecycle === filter
                    ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200'
                    : 'border-slate-600 bg-slate-900 text-slate-300'
                }`}
                data-testid={`tenants-filter-${filter || 'all'}`}
              >
                {LIFECYCLE_LABEL[filter]}
              </button>
            ))}
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search slug or name…"
              className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1 text-sm text-slate-100"
              data-testid="tenants-search"
              aria-label="Search tenants"
            />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          role="region"
          aria-label="Tenant list"
          className="lg:col-span-2"
          data-testid="tenants-list"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">{tenants.length}</Badge>
              Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <p className="text-sm text-slate-400">
                No tenants match the current filter.
              </p>
            ) : (
              <ul className="space-y-2">
                {tenants.map((t) => (
                  <li key={t.id}>
                    <TenantRow
                      tenant={t}
                      onSuspend={() => suspend({ id: t.id, reason: 'admin' })}
                      onReinstate={() => reinstate({ id: t.id })}
                      onArchive={() => archive({ id: t.id, reason: 'admin' })}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card
          role="region"
          aria-label="Create tenant"
          data-testid="tenants-create-card"
        >
          <CardHeader>
            <CardTitle>Create tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleCreate}>
              <Field
                label="ID"
                value={createDraft.id}
                onChange={(v) => setCreateDraft((d) => ({ ...d, id: v }))}
                placeholder="acme"
                testId="tenants-create-id"
              />
              <Field
                label="Slug"
                value={createDraft.slug}
                onChange={(v) => setCreateDraft((d) => ({ ...d, slug: v }))}
                placeholder="acme"
                testId="tenants-create-slug"
              />
              <Field
                label="Display name"
                value={createDraft.displayName}
                onChange={(v) =>
                  setCreateDraft((d) => ({ ...d, displayName: v }))
                }
                placeholder="Acme Industries"
                testId="tenants-create-display"
              />
              <Field
                label="Owner email"
                type="email"
                value={createDraft.owner}
                onChange={(v) => setCreateDraft((d) => ({ ...d, owner: v }))}
                placeholder="owner@acme.io"
                testId="tenants-create-owner"
              />
              <button
                type="submit"
                disabled={createState.isLoading}
                className="w-full rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-600"
                data-testid="tenants-create-submit"
              >
                {createState.isLoading ? 'Creating…' : 'Create tenant'}
              </button>
              {createState.error ? (
                <p className="text-xs text-red-400">
                  {errorMessage(createState.error) ||
                    'Failed to create tenant'}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TenantRow({
  tenant,
  onSuspend,
  onReinstate,
  onArchive,
}: {
  tenant: Tenant;
  onSuspend: () => void;
  onReinstate: () => void;
  onArchive: () => void;
}) {
  return (
    <article
      className="rounded-lg border border-slate-700 bg-slate-900/60 p-4"
      data-testid={`tenants-row-${tenant.id}`}
    >
      <header className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            {tenant.displayName}{' '}
            <span className="text-xs text-slate-400">/{tenant.slug}</span>
          </h3>
          <p className="text-xs text-slate-400">
            {tenant.owner} · {tenant.admins.length} admins
          </p>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${LIFECYCLE_TONE[tenant.lifecycle]}`}
        >
          {tenant.lifecycle}
        </span>
      </header>
      {tenant.reason ? (
        <p className="mt-2 text-xs text-amber-300">Reason: {tenant.reason}</p>
      ) : null}
      <footer className="mt-3 flex flex-wrap gap-2">
        {tenant.lifecycle === 'active' ? (
          <button
            type="button"
            onClick={onSuspend}
            className="rounded-md border border-amber-500 px-2 py-0.5 text-xs text-amber-200"
            data-testid={`tenants-suspend-${tenant.id}`}
          >
            Suspend
          </button>
        ) : null}
        {tenant.lifecycle === 'suspended' ? (
          <button
            type="button"
            onClick={onReinstate}
            className="rounded-md border border-emerald-500 px-2 py-0.5 text-xs text-emerald-200"
            data-testid={`tenants-reinstate-${tenant.id}`}
          >
            Reinstate
          </button>
        ) : null}
        {tenant.lifecycle !== 'archived' ? (
          <button
            type="button"
            onClick={onArchive}
            className="rounded-md border border-slate-500 px-2 py-0.5 text-xs text-slate-300"
            data-testid={`tenants-archive-${tenant.id}`}
          >
            Archive
          </button>
        ) : null}
      </footer>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  testId?: string;
}) {
  return (
    <label className="block text-xs text-slate-300">
      <span className="mb-1 block uppercase tracking-wide">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
        data-testid={testId}
      />
    </label>
  );
}
