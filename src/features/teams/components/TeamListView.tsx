import { Users, Plus } from 'lucide-react';
import { errorMessage } from '@/shared/lib/api';
import { Button, ConfirmModal } from '@/shared/components/ui';
import {
  PageHeader,
  DataEmptyState,
  LoadingState,
  ErrorState,
} from '@/shared/components/feedback';
import { useTeamsDashboard } from '@/features/teams/hooks/useTeamsDashboard';
import { TeamCard } from './TeamCard';
import { TeamFormModal } from './TeamFormModal';

export function TeamListView() {
  const {
    items,
    loading,
    error,
    refetch,
    deleting,
    isFormOpen,
    editingTeam,
    deletingTeam,
    openCreate,
    openEdit,
    closeForm,
    startDelete,
    cancelDelete,
    confirmDelete,
  } = useTeamsDashboard();

  if (error) {
    return (
      <ErrorState
        message={errorMessage(error) || 'Failed to load teams'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Users className="h-6 w-6" />}
        iconClassName="text-indigo-400"
        title="Teams"
        description="Manage team ownership and on-call information"
        onRefresh={refetch}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        }
      />

      {loading ? (
        <LoadingState message="Loading teams..." iconClassName="text-indigo-400" />
      ) : items.length === 0 ? (
        <DataEmptyState
          icon={<Users className="h-6 w-6 text-slate-500" />}
          title="No teams found"
          description="Teams will appear here once configured."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={openEdit}
              onDelete={startDelete}
            />
          ))}
        </div>
      )}

      {/* Form Modal — re-keyed on team change so it remounts with a
          fresh form state instead of syncing via useEffect. */}
      <TeamFormModal
        key={editingTeam?.id ?? 'new'}
        isOpen={isFormOpen}
        onClose={closeForm}
        team={editingTeam}
      />

      <ConfirmModal
        isOpen={!!deletingTeam}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Team"
        message={`Are you sure you want to delete the team "${
          deletingTeam?.spec.displayName || deletingTeam?.metadata.name
        }"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
