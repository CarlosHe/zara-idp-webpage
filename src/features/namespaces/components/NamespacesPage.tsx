import { FolderTree, Plus } from 'lucide-react';
import { Button, ConfirmModal } from '@/shared/components/ui';
import { LoadingState, PageHeader } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { useNamespaceDashboard } from '../hooks/useNamespaceDashboard';
import { NamespaceFormModal } from './NamespaceFormModal';
import { NamespaceListView } from './NamespaceListView';
import { NamespaceStats } from './NamespaceStats';

export function NamespacesPage() {
  const dashboard = useNamespaceDashboard();

  if (dashboard.loading) {
    return <LoadingState message="Loading namespaces..." />;
  }

  if (dashboard.error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            Error loading namespaces: {errorMessage(dashboard.error) || 'unknown error'}
          </p>
          <Button onClick={dashboard.refetch}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Namespaces"
        description="Manage multi-tenant namespaces with resource quotas and ownership"
        icon={<FolderTree className="h-6 w-6" />}
        actions={
          <Button onClick={dashboard.openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Create Namespace
          </Button>
        }
      />

      <NamespaceStats
        total={dashboard.stats.total}
        active={dashboard.stats.active}
        totalDatabases={dashboard.stats.totalDatabases}
        totalStorage={dashboard.stats.totalStorage}
      />

      <NamespaceListView
        namespaces={dashboard.filteredNamespaces}
        searchQuery={dashboard.searchQuery}
        onSearchQueryChange={dashboard.setSearchQuery}
        selectedTier={dashboard.selectedTier}
        onSelectedTierChange={dashboard.setSelectedTier}
        onCreate={dashboard.openCreateModal}
        onEdit={dashboard.startEditing}
        onDelete={dashboard.startDeleting}
      />

      <NamespaceFormModal
        isOpen={dashboard.isCreateModalOpen}
        onClose={dashboard.closeCreateModal}
        onSubmit={dashboard.handleCreateNamespace}
      />

      {dashboard.editingNamespace && (
        <NamespaceFormModal
          isOpen={true}
          onClose={dashboard.cancelEditing}
          namespace={dashboard.editingNamespace}
          onSubmit={dashboard.handleUpdateNamespace}
        />
      )}

      {dashboard.deletingNamespace && (
        <ConfirmModal
          isOpen={true}
          onClose={dashboard.cancelDeleting}
          onConfirm={dashboard.handleDeleteNamespace}
          title="Delete Namespace"
          message={`Are you sure you want to delete the namespace "${dashboard.deletingNamespace.name}"? This action cannot be undone and will affect all resources in this namespace.`}
          confirmText="Delete Namespace"
          variant="danger"
        />
      )}
    </div>
  );
}
