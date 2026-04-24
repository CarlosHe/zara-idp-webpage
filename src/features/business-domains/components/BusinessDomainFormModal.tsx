import { useState } from 'react';
import { Alert, Button, Input, Modal } from '@/shared/components/ui';
import {
  useCreateBusinessDomainMutation,
  useUpdateBusinessDomainMutation,
} from '@/features/business-domains/services/businessDomainsApi';
import { errorMessage } from '@/shared/lib/api';
import type { BusinessDomain } from './types';

export interface BusinessDomainFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain?: BusinessDomain | null;
}

export function BusinessDomainFormModal({ isOpen, onClose, domain }: BusinessDomainFormModalProps) {
  const [createDomain, createState] = useCreateBusinessDomainMutation();
  const [updateDomain, updateState] = useUpdateBusinessDomainMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const saveError =
    errorMessage(createState.error) || errorMessage(updateState.error) || null;
  // Initial state derived once; the parent re-keys the modal on
  // domain change so re-mount does the reset.
  const [formData, setFormData] = useState(() => ({
    name: domain?.name || '',
    displayName: domain?.displayName || '',
    description: domain?.description || '',
    team: domain?.team || domain?.owner || '',
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (domain?.id) {
        await updateDomain({
          id: domain.id,
          data: {
            displayName: formData.displayName,
            description: formData.description,
            team: formData.team,
          },
        }).unwrap();
      } else {
        await createDomain({
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description,
          team: formData.team,
        }).unwrap();
      }
      onClose();
    } catch {
      // Error surfaces via derived `saveError` above.
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={domain ? 'Edit Domain' : 'Create Domain'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {saveError && (
          <Alert type="error" title="Error">
            {saveError}
          </Alert>
        )}

        <Input
          id="name"
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="payments"
          required
          disabled={!!domain}
        />

        <Input
          id="displayName"
          label="Display Name"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          placeholder="Payments Domain"
        />

        <Input
          id="description"
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Handles all payment processing"
        />

        <Input
          id="team"
          label="Owner Team"
          value={formData.team}
          onChange={(e) => setFormData({ ...formData, team: e.target.value })}
          placeholder="payments-team"
          required
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {domain ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
