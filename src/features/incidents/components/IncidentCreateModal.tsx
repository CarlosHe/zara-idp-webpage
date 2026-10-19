import { useState } from 'react';
import { Alert, Button, Input, Modal, Select } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import { useOpenIncidentMutation } from '../services/incidentsApi';
import type { IncidentSeverity } from '../types/incidents';

export function IncidentCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('sev3');
  const [service, setService] = useState('');
  const [namespace, setNamespace] = useState('');
  const [open, state] = useOpenIncidentMutation();
  return <Modal isOpen onClose={onClose} title="Open incident">
    <form className="space-y-4" onSubmit={async (event) => {
      event.preventDefault();
      try {
        const incident = await open({ slug, title, summary, severity, affected: service.trim() ? [{ name: service.trim(), namespace: namespace.trim() }] : [] }).unwrap();
        onCreated(incident.id);
      } catch { /* Keep the draft while displaying the API error. */ }
    }}>
      {state.error && <Alert type="error">{errorMessage(state.error)}</Alert>}
      <Input label="Incident slug" required pattern="[a-z][a-z0-9-]*" value={slug} onChange={(event) => setSlug(event.target.value)} />
      <Input label="Incident title" required value={title} onChange={(event) => setTitle(event.target.value)} />
      <Input label="Incident summary" value={summary} onChange={(event) => setSummary(event.target.value)} />
      <Select label="Severity" value={severity} onChange={(event) => setSeverity(event.target.value as IncidentSeverity)}>
        {(['sev1', 'sev2', 'sev3', 'sev4'] as const).map((value) => <option key={value} value={value}>{value.toUpperCase()}</option>)}
      </Select>
      <Input label="Affected service" value={service} onChange={(event) => setService(event.target.value)} />
      <Input label="Affected namespace" value={namespace} onChange={(event) => setNamespace(event.target.value)} />
      <Button type="submit" loading={state.isLoading}>Create incident</Button>
    </form>
  </Modal>;
}
