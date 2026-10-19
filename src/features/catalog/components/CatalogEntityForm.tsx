import { useState } from 'react';
import { Alert, Button, Input, Modal, Select, Textarea } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import { useCreateCatalogEntityMutation, useUpdateCatalogEntityMutation } from '../services/catalogApi';
import type { CatalogEntity } from '../types';

export function CatalogEntityForm({ entity, onClose }: { entity?: CatalogEntity; onClose: () => void }) {
  const [kind, setKind] = useState<string>(entity?.kind ?? 'Application');
  const [namespace, setNamespace] = useState(entity?.metadata.namespace ?? 'default');
  const [name, setName] = useState(entity?.metadata.name ?? '');
  const [spec, setSpec] = useState(JSON.stringify(entity?.spec ?? { owner: '', description: '', lifecycle: 'development' }, null, 2));
  const [validation, setValidation] = useState('');
  const [create, createState] = useCreateCatalogEntityMutation();
  const [update, updateState] = useUpdateCatalogEntityMutation();
  return <Modal isOpen onClose={onClose} title={entity ? 'Edit catalog entity' : 'Register catalog entity'}>
    <form className="space-y-4" onSubmit={async (event) => {
      event.preventDefault(); setValidation('');
      let parsed: unknown;
      try { parsed = JSON.parse(spec); } catch { setValidation('Specification must be valid JSON.'); return; }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) { setValidation('Specification must be a JSON object.'); return; }
      const body = { kind, namespace: namespace.trim(), name: name.trim(), spec: parsed as Record<string, unknown> };
      try { if (entity) await update(body).unwrap(); else await create(body).unwrap(); onClose(); } catch { /* Keep the draft and API error. */ }
    }}>
      {(validation || createState.error || updateState.error) && <Alert type="error">{validation || errorMessage(createState.error || updateState.error)}</Alert>}
      <Select label="Kind" value={kind} onChange={(e) => setKind(e.target.value)} disabled={!!entity}>
        {['Application', 'Service', 'API', 'System', 'Domain', 'Group', 'User', 'Resource', 'DocSet', 'Environment', 'Location'].map((k) => <option key={k}>{k}</option>)}
      </Select>
      <Input label="Namespace" value={namespace} onChange={(e) => setNamespace(e.target.value)} required disabled={!!entity} />
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required disabled={!!entity} />
      <Textarea label="Specification JSON" value={spec} onChange={(e) => setSpec(e.target.value)} rows={9} required />
      <p className="text-sm text-slate-300">Register ownership and documentation in the catalog. Provision infrastructure from Resources or Golden Paths.</p>
      <Button type="submit" loading={createState.isLoading || updateState.isLoading}>{entity ? 'Save entity' : 'Register entity'}</Button>
    </form>
  </Modal>;
}
