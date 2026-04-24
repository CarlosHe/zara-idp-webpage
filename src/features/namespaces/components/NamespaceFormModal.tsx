import { useState } from 'react';
import { Button, Input, Modal } from '@/shared/components/ui';
import type { Namespace } from '@/shared/types';
import { NumberField, TextField } from './NamespaceFormFields';

interface NamespaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  namespace?: Namespace | null;
  onSubmit: (data: Partial<Namespace>) => Promise<void>;
}

type Tier = 'production' | 'staging' | 'development';

interface FormState {
  id: string;
  name: string;
  description: string;
  ownerTeam: string;
  ownerContact: string;
  ownerSlack: string;
  ownerOncall: string;
  contextDomain: string;
  contextTier: Tier;
  contextEnvironment: string;
  contextCostCenter: string;
  quotaDatabases: number;
  quotaRoles: number;
  quotaSchemas: number;
  quotaApplications: number;
  quotaSecrets: number;
  quotaStorageGB: number;
  quotaMaxConnections: number;
}

function buildInitialFormState(namespace?: Namespace | null): FormState {
  return {
    id: namespace?.id || '',
    name: namespace?.name || '',
    description: namespace?.description || '',
    ownerTeam: namespace?.owner?.team || '',
    ownerContact: namespace?.owner?.contact || '',
    ownerSlack: namespace?.owner?.slack || '',
    ownerOncall: namespace?.owner?.oncall || '',
    contextDomain: namespace?.context?.domain || '',
    contextTier: (namespace?.context?.tier as Tier) || 'development',
    contextEnvironment: namespace?.context?.environment || '',
    contextCostCenter: namespace?.context?.costCenter || '',
    quotaDatabases: namespace?.quotas?.databases || 10,
    quotaRoles: namespace?.quotas?.roles || 50,
    quotaSchemas: namespace?.quotas?.schemas || 20,
    quotaApplications: namespace?.quotas?.applications || 10,
    quotaSecrets: namespace?.quotas?.secrets || 100,
    quotaStorageGB: namespace?.quotas?.storageGB || 100,
    quotaMaxConnections: namespace?.quotas?.maxConnections || 100,
  };
}

function toNamespacePayload(form: FormState): Partial<Namespace> {
  return {
    name: form.name,
    description: form.description,
    owner: {
      team: form.ownerTeam,
      contact: form.ownerContact,
      slack: form.ownerSlack,
      oncall: form.ownerOncall,
    },
    context: {
      domain: form.contextDomain,
      tier: form.contextTier,
      environment: form.contextEnvironment,
      costCenter: form.contextCostCenter,
      tags: {},
    },
    quotas: {
      databases: form.quotaDatabases,
      roles: form.quotaRoles,
      schemas: form.quotaSchemas,
      applications: form.quotaApplications,
      secrets: form.quotaSecrets,
      storageGB: form.quotaStorageGB,
      maxConnections: form.quotaMaxConnections,
    },
  };
}

export function NamespaceFormModal({
  isOpen,
  onClose,
  namespace,
  onSubmit,
}: NamespaceFormModalProps) {
  const [formData, setFormData] = useState<FormState>(() => buildInitialFormState(namespace));
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(toNamespacePayload(formData));
      onClose();
    } catch (error) {
      console.error('Error submitting namespace:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={namespace ? 'Edit Namespace' : 'Create Namespace'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
          <Input
            value={formData.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="production"
            required
            disabled={!!namespace}
          />
          <p className="text-xs text-slate-400 mt-1">
            Namespace identifier (immutable after creation)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => update('description', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 min-h-[60px]"
            placeholder="Purpose and usage of this namespace..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Owner Team"
            value={formData.ownerTeam}
            onChange={(v) => update('ownerTeam', v)}
            placeholder="Platform Engineering"
            required
          />
          <TextField
            label="Owner Contact"
            value={formData.ownerContact}
            onChange={(v) => update('ownerContact', v)}
            placeholder="team@company.com"
            type="email"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Slack Channel"
            value={formData.ownerSlack}
            onChange={(v) => update('ownerSlack', v)}
            placeholder="#platform-eng"
          />
          <TextField
            label="On-Call"
            value={formData.ownerOncall}
            onChange={(v) => update('ownerOncall', v)}
            placeholder="platform-oncall"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tier</label>
            <select
              value={formData.contextTier}
              onChange={(e) => update('contextTier', e.target.value as Tier)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>
          <TextField
            label="Environment"
            value={formData.contextEnvironment}
            onChange={(v) => update('contextEnvironment', v)}
            placeholder="prod"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Domain"
            value={formData.contextDomain}
            onChange={(v) => update('contextDomain', v)}
            placeholder="core"
          />
          <TextField
            label="Cost Center"
            value={formData.contextCostCenter}
            onChange={(v) => update('contextCostCenter', v)}
            placeholder="CC-001"
          />
        </div>

        <div className="border-t border-slate-700 pt-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Resource Quotas</h4>
          <div className="grid grid-cols-3 gap-4">
            <NumberField label="Databases" value={formData.quotaDatabases} onChange={(v) => update('quotaDatabases', v)} />
            <NumberField label="Roles" value={formData.quotaRoles} onChange={(v) => update('quotaRoles', v)} />
            <NumberField label="Schemas" value={formData.quotaSchemas} onChange={(v) => update('quotaSchemas', v)} />
            <NumberField label="Applications" value={formData.quotaApplications} onChange={(v) => update('quotaApplications', v)} />
            <NumberField label="Secrets" value={formData.quotaSecrets} onChange={(v) => update('quotaSecrets', v)} />
            <NumberField label="Storage (GB)" value={formData.quotaStorageGB} onChange={(v) => update('quotaStorageGB', v)} />
            <NumberField label="Max Connections" value={formData.quotaMaxConnections} onChange={(v) => update('quotaMaxConnections', v)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : namespace ? 'Update Namespace' : 'Create Namespace'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

