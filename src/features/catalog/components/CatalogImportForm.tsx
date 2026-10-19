import { useState } from 'react';
import { Alert, Button, Input, Modal, Textarea } from '@/shared/components/ui';
import { useImportCatalogEntitiesMutation } from '../services/catalogApi';
import type { CatalogRegistration } from '../types';
import { parseCatalogImport } from '../catalogImport';

export function CatalogImportForm({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<CatalogRegistration[]>([]);
  const [error, setError] = useState('');
  const [updateExisting, setUpdateExisting] = useState(false);
  const [runImport, state] = useImportCatalogEntitiesMutation();
  const setInput = (value: string) => { setText(value); setPreview([]); setError(''); state.reset(); };
  return <Modal isOpen title="Import catalog inventory" onClose={() => { if (!state.isLoading) onClose(); }} size="xl" closeOnOverlayClick={!state.isLoading}>
    <div className="space-y-4">
      <p>Register a metadata snapshot in the catalog. This does not deploy infrastructure or connect to AWS. Existing registrations are skipped by default.</p>
      <label className="flex items-center gap-2"><input type="checkbox" checked={updateExisting} disabled={state.isLoading} onChange={(event) => setUpdateExisting(event.target.checked)} />Refresh specifications and relationships of existing registrations</label>
      <Input label="Inventory JSON file" type="file" accept="application/json,.json" disabled={state.isLoading} onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { setInput(''); setError('Inventory file must be smaller than 10 MB.'); return; }
        try { setInput(await file.text()); } catch { setError('Unable to read inventory file.'); }
      }} />
      <Textarea label="Inventory JSON" rows={8} value={text} disabled={state.isLoading} onChange={(event) => setInput(event.target.value)} />
      {error && <Alert type="error">{error}</Alert>}
      <Button variant="secondary" disabled={state.isLoading} onClick={() => {
        try { setPreview(parseCatalogImport(text)); setError(''); } catch (err) { setPreview([]); setError((err as Error).message); }
      }}>Preview inventory</Button>
      {preview.length > 0 && <section aria-label="Inventory preview" className="space-y-3">
        <p>{preview.length} registrations across {new Set(preview.map((e) => e.namespace)).size} namespaces</p>
        <p>{Object.entries(preview.reduce<Record<string, number>>((counts, e) => { counts[e.kind] = (counts[e.kind] ?? 0) + 1; return counts; }, {})).map(([kind, count]) => `${kind}: ${count}`).join(' · ')}</p>
        <Button loading={state.isLoading} disabled={state.isSuccess && state.data?.failures.length === 0} onClick={async () => {
          try { await runImport({ entities: preview, updateExisting }).unwrap(); } catch { setError('Import failed. Retry to resume; existing registrations are preserved by default.'); }
        }}>Register inventory</Button>
      </section>}
      {state.isLoading && <p role="status">Registering inventory. Keep this dialog open until the import completes.</p>}
      {state.data && <div role="status">
        <p>{state.data.created} created, {state.data.updated} updated, {state.data.skipped} skipped, {state.data.failures.length} failed</p>
        {state.data.failures.length > 0 && <ul>{state.data.failures.map((failure) => <li key={failure}>{failure}</li>)}</ul>}
      </div>}
    </div>
  </Modal>;
}
