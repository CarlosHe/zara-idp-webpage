import { useState } from 'react';
import { Button, Input, Modal, Alert, Select } from '@/shared/components/ui';
import {
  useCreateClusterMutation,
  useUpdateClusterMutation,
} from '@/features/clusters/services/clustersApi';
import { errorMessage } from '@/shared/lib/api';
import type { ClusterView } from '../types';

interface ClusterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cluster?: ClusterView | null;
}

const PROVIDER_OPTIONS = [
  { value: 'aws', label: 'AWS' },
  { value: 'gcp', label: 'Google Cloud' },
  { value: 'azure', label: 'Azure' },
  { value: 'on-prem', label: 'On-Premises' },
];

const ENVIRONMENT_OPTIONS = [
  { value: 'development', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
];

export function ClusterFormModal({ isOpen, onClose, cluster }: ClusterFormModalProps) {
  const [createCluster, createState] = useCreateClusterMutation();
  const [updateCluster, updateState] = useUpdateClusterMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const saveError =
    errorMessage(createState.error) || errorMessage(updateState.error) || null;

  // Initial state derived once; the parent re-keys the modal on cluster
  // change so re-mount does the reset.
  const [formData, setFormData] = useState<{
    name: string;
    displayName: string;
    provider: string;
    environment: string;
    region: string;
  }>(() => ({
    name: cluster?.name || '',
    displayName: cluster?.displayName || '',
    provider: cluster?.provider || 'aws',
    environment: cluster?.environment || 'development',
    region: cluster?.region || '',
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (cluster?.id) {
        await updateCluster({
          id: cluster.id,
          data: {
            displayName: formData.displayName,
            environment: formData.environment,
          },
        }).unwrap();
      } else {
        await createCluster({
          name: formData.name,
          displayName: formData.displayName,
          provider: formData.provider,
          environment: formData.environment,
          region: formData.region,
        }).unwrap();
      }
      onClose();
    } catch {
      // Error surfaces via derived `saveError` above.
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={cluster ? 'Edit Cluster' : 'Create Cluster'}>
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
          placeholder="prod-us-east-1"
          required
          disabled={!!cluster}
        />

        <Input
          id="displayName"
          label="Display Name"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          placeholder="Production US East 1"
        />

        <Select
          id="provider"
          label="Provider"
          value={formData.provider}
          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
          options={PROVIDER_OPTIONS}
          disabled={!!cluster}
        />

        <Select
          id="environment"
          label="Environment"
          value={formData.environment}
          onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
          options={ENVIRONMENT_OPTIONS}
        />

        <Input
          id="region"
          label="Region"
          value={formData.region}
          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
          placeholder="us-east-1"
          required
          disabled={!!cluster}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {cluster ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
