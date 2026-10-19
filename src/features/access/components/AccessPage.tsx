import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@/shared/components/feedback';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import { useCheckCurrentAccessMutation, useListAccessBindingsQuery, useListAccessRolesQuery, useListClusterAccessBindingsQuery } from '../services/accessApi';

export function AccessPage() {
  const roles = useListAccessRolesQuery(); const bindings = useListAccessBindingsQuery(); const clusterBindings = useListClusterAccessBindingsQuery();
  const [check, result] = useCheckCurrentAccessMutation();
  const [verb, setVerb] = useState('get'); const [resource, setResource] = useState('resources'); const [namespace, setNamespace] = useState('default');
  const error = roles.error || bindings.error || clusterBindings.error;
  const refresh = () => { void roles.refetch(); void bindings.refetch(); void clusterBindings.refetch(); };
  if (roles.isLoading || bindings.isLoading || clusterBindings.isLoading) return <LoadingState message="Loading access policies..." />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={refresh} />;
  return <div className="space-y-6">
    <PageHeader icon={<ShieldCheck />} title="Access control" description="Inspect server roles, namespace and cluster bindings, and check your current permissions." onRefresh={refresh} />
    <Card><CardHeader><CardTitle>Check my access</CardTitle></CardHeader><CardContent>
      <form className="grid gap-3 md:grid-cols-4" onSubmit={(event) => { event.preventDefault(); void check({ verb, resource, namespace }); }}>
        <Select label="Action" value={verb} onChange={(e) => setVerb(e.target.value)}>{['get', 'list', 'create', 'update', 'delete'].map((v) => <option key={v}>{v}</option>)}</Select>
        <Input label="Resource type" value={resource} onChange={(e) => setResource(e.target.value)} required />
        <Input label="Namespace" value={namespace} onChange={(e) => setNamespace(e.target.value)} />
        <Button type="submit" loading={result.isLoading}>Check permission</Button>
      </form>
      {result.error && <p role="alert" className="mt-3 text-red-400">{errorMessage(result.error)}</p>}
      {result.data && <p role="status" className="mt-3">{result.data.allowed ? 'Allowed' : 'Denied'} — {result.data.reason}</p>}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Roles ({roles.data?.roles.length ?? 0})</CardTitle></CardHeader><CardContent>
      <ul className="space-y-3">{roles.data?.roles.map((role) => <li key={role.name} className="rounded border border-slate-700 p-3"><strong>{role.displayName || role.name}</strong><p className="text-sm text-slate-300">{role.name} · {role.scope} · {role.rulesCount} rules</p><p>{role.description}</p></li>)}</ul>
      {!roles.data?.roles.length && <p>No roles registered.</p>}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Role bindings</CardTitle></CardHeader><CardContent><ul className="space-y-3">
      {[...(bindings.data?.bindings ?? []), ...(clusterBindings.data?.bindings ?? [])].map((binding) => <li key={binding.id || binding.name} className="rounded border border-slate-700 p-3"><strong>{binding.name}</strong><p>{binding.namespace || 'Cluster'} → {binding.roleRef.name}</p><p className="text-sm text-slate-300">{binding.subjects.map((s) => `${s.kind}: ${s.name}`).join(', ')}</p></li>)}
    </ul>{!bindings.data?.bindings.length && !clusterBindings.data?.bindings.length && <p>No explicit bindings registered.</p>}</CardContent></Card>
  </div>;
}
