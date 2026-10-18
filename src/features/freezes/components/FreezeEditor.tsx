import { useState, type FormEvent } from 'react';
import { Alert, Button, Input, Modal, Textarea } from '@/shared/components/ui';
import type { Freeze, FreezeInput, FreezeScope } from '@/shared/types';
import { errorMessage } from '@/shared/lib/api';
import { useCreateFreezeMutation, useUpdateFreezeMutation } from '../services/freezesApi';

function localDate(value: string): string {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const entries = (value: string) => [...new Set(value.split(',').map((entry) => entry.trim()).filter(Boolean))];

export function FreezeEditor({ freeze, onClose }: { freeze?: Freeze; onClose: () => void }) {
  const [name, setName] = useState(freeze?.name ?? '');
  const [reason, setReason] = useState(freeze?.reason ?? '');
  const [description, setDescription] = useState(freeze?.description ?? '');
  const [start, setStart] = useState(() => localDate(freeze?.startTime ?? new Date().toISOString()));
  const [end, setEnd] = useState(() => localDate(freeze?.endTime ?? freeze?.expiresAt ?? new Date(Date.now() + 3_600_000).toISOString()));
  const [global, setGlobal] = useState(freeze?.scope.global ?? false);
  const [namespaces, setNamespaces] = useState(freeze?.scope.namespaces.join(', ') ?? '');
  const [teams, setTeams] = useState(freeze?.scope.teams.join(', ') ?? '');
  const [kinds, setKinds] = useState(freeze?.scope.kinds.join(', ') ?? '');
  const [message, setMessage] = useState('');
  const [create, creating] = useCreateFreezeMutation();
  const [update, updating] = useUpdateFreezeMutation();
  const busy = creating.isLoading || updating.isLoading;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const scope: FreezeScope = { global, namespaces: entries(namespaces), teams: entries(teams), kinds: entries(kinds) as FreezeScope['kinds'] };
    if (!global && !scope.namespaces.length && !scope.teams.length && !scope.kinds.length) {
      setMessage('Select a namespace, team, resource kind or global scope.'); return;
    }
    if (new Date(end).getTime() <= new Date(start).getTime()) {
      setMessage('End time must be after start time.'); return;
    }
    const body: FreezeInput = { name: name.trim(), reason: reason.trim(), description: description.trim(), scope,
      startTime: new Date(start).toISOString(), endTime: new Date(end).toISOString(), version: freeze?.version };
    try {
      if (freeze) await update({ id: freeze.id, body }).unwrap();
      else await create(body).unwrap();
      onClose();
    } catch (error) { setMessage(errorMessage(error) || 'Unable to save freeze.'); }
  }

  return <Modal isOpen onClose={busy ? () => {} : onClose} title={freeze ? 'Edit freeze' : 'Create freeze'} size="lg" className="max-h-[90vh] overflow-y-auto">
    <form onSubmit={submit} className="space-y-4">
      {message && <Alert type="error" title="Unable to save freeze">{message}</Alert>}
      <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={255} disabled={busy} />
      <Input label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} required disabled={busy} />
      <Textarea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Start time" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} required disabled={busy} />
        <Input label="End time" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} required disabled={busy} />
      </div>
      <label className="flex items-center gap-2 text-slate-200"><input type="checkbox" checked={global} onChange={(event) => setGlobal(event.target.checked)} disabled={busy} />Global scope — all resources</label>
      {!global && <div className="space-y-3">
        <p className="text-sm text-slate-400">Separate entries with commas. Any matching namespace, team or kind is frozen.</p>
        <Input label="Namespaces" value={namespaces} onChange={(event) => setNamespaces(event.target.value)} disabled={busy} />
        <Input label="Teams" value={teams} onChange={(event) => setTeams(event.target.value)} disabled={busy} />
        <Input label="Resource kinds" value={kinds} onChange={(event) => setKinds(event.target.value)} disabled={busy} />
      </div>}
      <p className="text-sm text-slate-400">Matching resources cannot be created, updated or deleted while this window is active.</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" loading={busy}>{freeze ? 'Save changes' : 'Create freeze'}</Button>
      </div>
    </form>
  </Modal>;
}
