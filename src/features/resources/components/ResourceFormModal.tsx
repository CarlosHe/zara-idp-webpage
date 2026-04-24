import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useUpdateResourceMutation } from '@/features/resources/services/resourcesApi';
import { errorMessage } from '@/shared/lib/api';
import {
  Select,
  Input,
  Button,
  Modal,
  Alert,
} from '@/shared/components/ui';
import type { ResourceKind, Resource } from '@/shared/types';
import { kindOptions } from './constants';

interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
}

export function ResourceFormModal({ isOpen, onClose, resource }: ResourceFormModalProps) {
  const [updateResource, updateState] = useUpdateResourceMutation();
  const loading = updateState.isLoading;
  const [error, setError] = useState<string | null>(null);

  const initialFormData = {
    kind: resource.kind,
    name: resource.metadata?.name || '',
    namespace: resource.metadata?.namespace || 'default',
    spec: JSON.stringify(resource.spec || {}, null, 2),
    labels: Object.entries(resource.metadata?.labels || {}).map(([key, value]) => ({ key, value: String(value) })),
  };

  const [formData, setFormData] = useState(initialFormData);
  const [prevResourceId, setPrevResourceId] = useState<string | undefined>(resource?.id);

  if (resource?.id !== prevResourceId) {
    setPrevResourceId(resource?.id);
    setFormData(initialFormData);
    setError(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let spec: Record<string, unknown> = {};
    try {
      spec = JSON.parse(formData.spec);
    } catch {
      setError('Invalid JSON in spec field');
      return;
    }

    const labels: Record<string, string> = {};
    formData.labels.forEach(({ key, value }) => {
      if (key && typeof value === 'string') labels[key] = value;
    });

    try {
      await updateResource({
        key: {
          kind: resource.kind,
          namespace: resource.metadata?.namespace || resource.namespace || '',
          name: resource.metadata?.name || resource.name || '',
        },
        body: {
          spec,
          metadata: { labels },
        },
      }).unwrap();
      onClose();
    } catch (err) {
      setError(errorMessage(err as Parameters<typeof errorMessage>[0]) || 'Failed to update resource');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Resource">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert type="error" title="Error">
            {error}
          </Alert>
        )}

        <Select
          id="kind"
          label="Kind"
          value={formData.kind}
          onChange={(e) => setFormData({ ...formData, kind: e.target.value as ResourceKind })}
          disabled={!!resource}
          required
        >
          <option value="">Select Kind</option>
          {kindOptions.slice(1).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        <Input id="name" label="Name" value={formData.name} disabled />

        <Input id="namespace" label="Namespace" value={formData.namespace} disabled />

        <div>
          <label htmlFor="spec" className="block text-sm font-medium text-gray-300 mb-2">
            Spec (JSON)
          </label>
          <textarea
            id="spec"
            rows={8}
            value={formData.spec}
            onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder='{&#10;  "replicas": 3,&#10;  "image": "nginx:latest"&#10;}'
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Labels</label>
          {formData.labels.map((label, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <Input
                placeholder="key"
                value={label.key}
                onChange={(e) => {
                  const newLabels = [...formData.labels];
                  newLabels[index].key = e.target.value;
                  setFormData({ ...formData, labels: newLabels });
                }}
              />
              <Input
                placeholder="value"
                value={label.value}
                onChange={(e) => {
                  const newLabels = [...formData.labels];
                  newLabels[index].value = e.target.value;
                  setFormData({ ...formData, labels: newLabels });
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFormData({
                    ...formData,
                    labels: formData.labels.filter((_, i) => i !== index),
                  });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setFormData({
                ...formData,
                labels: [...formData.labels, { key: '', value: '' }],
              });
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Label
          </Button>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Update
          </Button>
        </div>
      </form>
    </Modal>
  );
}
