import { useMemo, useState } from 'react';
import {
  useListNamespacesQuery,
  useCreateNamespaceMutation,
  useUpdateNamespaceMutation,
  useDeleteNamespaceMutation,
} from '@/features/namespaces/services/namespacesApi';
import type { Namespace } from '@/shared/types';

interface NamespaceStats {
  total: number;
  active: number;
  totalDatabases: number;
  totalStorage: number;
}

interface UseNamespaceDashboardResult {
  namespaces: Namespace[];
  filteredNamespaces: Namespace[];
  stats: NamespaceStats;
  loading: boolean;
  error: unknown;
  refetch: () => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedTier: string;
  setSelectedTier: (value: string) => void;
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  editingNamespace: Namespace | null;
  startEditing: (ns: Namespace) => void;
  cancelEditing: () => void;
  deletingNamespace: Namespace | null;
  startDeleting: (ns: Namespace) => void;
  cancelDeleting: () => void;
  handleCreateNamespace: (data: Partial<Namespace>) => Promise<void>;
  handleUpdateNamespace: (data: Partial<Namespace>) => Promise<void>;
  handleDeleteNamespace: () => Promise<void>;
}

export function useNamespaceDashboard(): UseNamespaceDashboardResult {
  const { data: namespaces = [], isLoading: loading, error, refetch } = useListNamespacesQuery();
  const [createNamespace] = useCreateNamespaceMutation();
  const [updateNamespace] = useUpdateNamespaceMutation();
  const [deleteNamespace] = useDeleteNamespaceMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNamespace, setEditingNamespace] = useState<Namespace | null>(null);
  const [deletingNamespace, setDeletingNamespace] = useState<Namespace | null>(null);

  const filteredNamespaces = useMemo(() => {
    return namespaces.filter((ns) => {
      const matchesSearch =
        ns.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ns.owner.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ns.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier = selectedTier === 'all' || ns.context.tier === selectedTier;

      return matchesSearch && matchesTier;
    });
  }, [namespaces, searchQuery, selectedTier]);

  const stats = useMemo<NamespaceStats>(() => {
    const total = namespaces.length;
    const active = namespaces.filter((ns) => ns.status === 'active').length;
    const totalDatabases = namespaces.reduce((acc, ns) => acc + (ns.usage?.databases || 0), 0);
    const totalStorage = namespaces.reduce((acc, ns) => acc + (ns.usage?.storageGB || 0), 0);

    return { total, active, totalDatabases, totalStorage };
  }, [namespaces]);

  const handleCreateNamespace = async (data: Partial<Namespace>) => {
    await createNamespace(data as Parameters<typeof createNamespace>[0])
      .unwrap()
      .catch(() => undefined);
    setIsCreateModalOpen(false);
  };

  const handleUpdateNamespace = async (data: Partial<Namespace>) => {
    if (editingNamespace) {
      await updateNamespace({ id: editingNamespace.id, data }).unwrap().catch(() => undefined);
      setEditingNamespace(null);
    }
  };

  const handleDeleteNamespace = async () => {
    if (deletingNamespace) {
      await deleteNamespace(deletingNamespace.id).unwrap().catch(() => undefined);
      setDeletingNamespace(null);
    }
  };

  return {
    namespaces,
    filteredNamespaces,
    stats,
    loading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    selectedTier,
    setSelectedTier,
    isCreateModalOpen,
    openCreateModal: () => setIsCreateModalOpen(true),
    closeCreateModal: () => setIsCreateModalOpen(false),
    editingNamespace,
    startEditing: setEditingNamespace,
    cancelEditing: () => setEditingNamespace(null),
    deletingNamespace,
    startDeleting: setDeletingNamespace,
    cancelDeleting: () => setDeletingNamespace(null),
    handleCreateNamespace,
    handleUpdateNamespace,
    handleDeleteNamespace,
  };
}
