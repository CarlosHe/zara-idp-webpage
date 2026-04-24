import { useState } from 'react';
import {
  useListTeamsQuery,
  useDeleteTeamMutation,
} from '@/features/teams/services/teamsApi';
import type { Team } from '@/shared/types';

interface UseTeamsDashboardResult {
  items: Team[];
  loading: boolean;
  error: unknown;
  refetch: () => void;
  deleting: boolean;
  isFormOpen: boolean;
  editingTeam: Team | null;
  deletingTeam: Team | null;
  openCreate: () => void;
  openEdit: (team: Team) => void;
  closeForm: () => void;
  startDelete: (team: Team) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
}

export function useTeamsDashboard(): UseTeamsDashboardResult {
  const { data: items = [], isLoading: loading, error, refetch } = useListTeamsQuery();
  const [deleteTeam, deleteState] = useDeleteTeamMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  const openCreate = () => {
    setEditingTeam(null);
    setIsFormOpen(true);
  };

  const openEdit = (team: Team) => {
    setEditingTeam(team);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const confirmDelete = async () => {
    if (deletingTeam?.id) {
      await deleteTeam(deletingTeam.id).unwrap().catch(() => undefined);
      setDeletingTeam(null);
    }
  };

  return {
    items: Array.isArray(items) ? items : [],
    loading,
    error,
    refetch,
    deleting: deleteState.isLoading,
    isFormOpen,
    editingTeam,
    deletingTeam,
    openCreate,
    openEdit,
    closeForm,
    startDelete: setDeletingTeam,
    cancelDelete: () => setDeletingTeam(null),
    confirmDelete,
  };
}
