import { Globe, Plus } from 'lucide-react';
import { Button, ConfirmModal } from '@/shared/components/ui';
import { PageHeader, LoadingState, ErrorState } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { useClusterDashboard } from '../hooks/useClusterDashboard';
import { ClusterFormModal } from './ClusterFormModal';
import { ClusterListView } from './ClusterListView';
import { ClusterDetailPanel } from './ClusterDetailPanel';
import { ClustersFilters } from './ClustersFilters';
import { ClustersStats } from './ClustersStats';

export function ClustersPage() {
  const {
    clusters,
    filteredClusters,
    stats,
    loading,
    error,
    saving,
    searchQuery,
    selectedEnvironment,
    selectedCluster,
    isFormOpen,
    editingCluster,
    deletingCluster,
    setSearchQuery,
    setSelectedEnvironment,
    setSelectedCluster,
    setIsFormOpen,
    setDeletingCluster,
    refetch,
    handleCreate,
    handleEdit,
    handleDelete,
  } = useClusterDashboard();

  if (loading) {
    return <LoadingState message="Loading clusters..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={errorMessage(error) || 'Failed to load clusters'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Globe className="h-6 w-6" />}
        iconClassName="text-cyan-400"
        title="Clusters"
        description="Multi-cluster management and resource distribution"
        onRefresh={refetch}
        refreshLabel="Sync All"
        actions={
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Cluster
          </Button>
        }
      />

      <ClustersStats totalClusters={clusters.length} stats={stats} />

      <ClustersFilters
        searchQuery={searchQuery}
        selectedEnvironment={selectedEnvironment}
        onSearchChange={setSearchQuery}
        onEnvironmentChange={setSelectedEnvironment}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <ClusterListView
            clusters={filteredClusters}
            selectedCluster={selectedCluster}
            onSelect={setSelectedCluster}
            onEdit={handleEdit}
            onDelete={setDeletingCluster}
          />
        </div>

        <div className="space-y-4">
          <ClusterDetailPanel cluster={selectedCluster} />
        </div>
      </div>

      {/* Form Modal — re-keyed on cluster change so it remounts with a
          fresh form state instead of syncing via useEffect. */}
      <ClusterFormModal
        key={editingCluster?.id ?? 'new'}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        cluster={editingCluster}
      />

      <ConfirmModal
        isOpen={!!deletingCluster}
        onClose={() => setDeletingCluster(null)}
        onConfirm={handleDelete}
        title="Delete Cluster"
        message={`Are you sure you want to delete the cluster "${deletingCluster?.displayName || deletingCluster?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
