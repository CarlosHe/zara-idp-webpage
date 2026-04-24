import { useState } from 'react';
import {
  useCreateTeamMutation,
  useUpdateTeamMutation,
} from '@/features/teams/services/teamsApi';
import { errorMessage } from '@/shared/lib/api';
import { Alert, Button, Input, Modal } from '@/shared/components/ui';
import type { Team } from '@/shared/types';

interface TeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: Team | null;
}

export function TeamFormModal({ isOpen, onClose, team }: TeamFormModalProps) {
  const [createTeam, createState] = useCreateTeamMutation();
  const [updateTeam, updateState] = useUpdateTeamMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const saveError =
    errorMessage(createState.error) || errorMessage(updateState.error) || null;

  // Initial state derived once; the parent re-keys the modal on team
  // change so re-mount does the reset.
  const [formData, setFormData] = useState(() => ({
    metadata: { name: team?.metadata?.name || '' },
    spec: {
      displayName: team?.spec?.displayName || '',
      channels: { general: team?.spec?.channels?.general || '' },
    },
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (team?.id) {
        await updateTeam({
          id: team.id,
          data: {
            displayName: formData.spec.displayName,
            slackChannel: formData.spec.channels.general,
          },
        }).unwrap();
      } else {
        await createTeam({
          name: formData.metadata.name,
          displayName: formData.spec.displayName,
          slackChannel: formData.spec.channels.general,
        }).unwrap();
      }
      onClose();
    } catch {
      // Error surfaces via `saveError` derived from mutation state above.
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={team ? 'Edit Team' : 'Create Team'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {saveError && (
          <Alert type="error" title="Error">
            {saveError}
          </Alert>
        )}

        <Input
          id="name"
          label="Name"
          value={formData.metadata.name}
          onChange={(e) =>
            setFormData({
              ...formData,
              metadata: { ...formData.metadata, name: e.target.value },
            })
          }
          placeholder="platform-team"
          required
          disabled={!!team}
        />

        <Input
          id="displayName"
          label="Display Name"
          value={formData.spec.displayName}
          onChange={(e) =>
            setFormData({
              ...formData,
              spec: { ...formData.spec, displayName: e.target.value },
            })
          }
          placeholder="Platform Engineering Team"
          required
        />

        <Input
          id="channels.general"
          label="Channel"
          value={formData.spec.channels.general}
          onChange={(e) =>
            setFormData({
              ...formData,
              spec: {
                ...formData.spec,
                channels: { general: e.target.value },
              },
            })
          }
          placeholder="#platform-team"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {team ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
