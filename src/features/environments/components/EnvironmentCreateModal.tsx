import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Input, Modal, Select } from '@/shared/components/ui';
import { ROUTES } from '@/shared/config';
import { errorMessage } from '@/shared/lib/api';
import { useGetMeQuery } from '@/features/auth/services/authApi';
import { useListNamespacesQuery } from '@/features/namespaces/services/namespacesApi';
import { useProvisionEnvironmentMutation } from '../services/environmentsApi';
import type { EnvironmentKind } from '../types/environments';

export function EnvironmentCreateModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [slug, setSlug] = useState('');
  const [namespace, setNamespace] = useState('');
  const [team, setTeam] = useState('');
  const [kind, setKind] = useState<EnvironmentKind>('dev');
  const [ttl, setTTL] = useState(24);
  const [image, setImage] = useState('nginx:1.27-alpine');
  const [port, setPort] = useState(80);
  const { data: principal } = useGetMeQuery();
  const namespaces = useListNamespacesQuery();
  const [provision, state] = useProvisionEnvironmentMutation();
  return <Modal isOpen onClose={onClose} title="Create environment">
    <form className="space-y-4" onSubmit={async (event) => {
      event.preventDefault();
      if (!namespace || !principal) return;
      const resourcesYaml = JSON.stringify({ apiVersion: 'zara.io/v1', kind: 'Application', metadata: { name: slug, namespace, labels: { team } }, spec: {
        name: slug, namespace, image, replicas: 1, platform: 'kubernetes', port, cpu: '100m', memory: '64Mi',
      } });
      try {
        const result = await provision({ slug, kind, owner: principal.email || principal.subject, team, catalogEntity: '', source: 'manual', ttlHours: ttl, resourcesYaml }).unwrap();
        onClose(); if (result.changeSetId) navigate(ROUTES.CHANGESETS.DETAIL(result.changeSetId));
      } catch { /* Preserve the form and surface the server failure. */ }
    }}>
      {state.error && <Alert type="error">{errorMessage(state.error)}</Alert>}
      {namespaces.error && <Alert type="error">{errorMessage(namespaces.error)}</Alert>}
      <Input label="Environment name" value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z][a-z0-9-]*" />
      <Select label="Namespace" value={namespace} onChange={(e) => setNamespace(e.target.value)} required>
        <option value="">Choose namespace</option>
        {(namespaces.data ?? []).map((n) => <option key={n.id} value={n.name}>{n.name}</option>)}
      </Select>
      <Input label="Team" value={team} onChange={(e) => setTeam(e.target.value)} required />
      <Select label="Environment kind" value={kind} onChange={(e) => setKind(e.target.value as EnvironmentKind)}>
        <option value="dev">Development</option><option value="preview">Preview</option><option value="staging">Staging</option>
      </Select>
      <Input label="TTL hours" type="number" min={1} max={168} value={ttl} onChange={(e) => setTTL(Number(e.target.value))} required />
      <Input label="Container image" value={image} onChange={(e) => setImage(e.target.value)} required />
      <Input label="Container port" type="number" min={1} max={65535} value={port} onChange={(e) => setPort(Number(e.target.value))} required />
      <p className="text-sm text-slate-300">Creates a managed Application with one replica. Review and approve the ChangeSet when required. Track readiness and request teardown from Environments.</p>
      <Button type="submit" loading={state.isLoading} disabled={!namespace || !principal}>Request environment</Button>
    </form>
  </Modal>;
}
