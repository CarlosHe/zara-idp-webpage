import { Link } from 'react-router-dom';
import { Box, Sparkles } from 'lucide-react';
import { ROUTES } from '@/shared/config';
import {
  Button,
  ConfirmModal,
  Alert,
  DriftReportModal,
} from '@/shared/components/ui';
import { PageHeader, ErrorState } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { ResourceFilterBar } from './ResourceFilterBar';
import { ResourceListView } from './ResourceListView';
import { ResourceFormModal } from './ResourceFormModal';
import { useResourcesDashboard } from './useResourcesDashboard';

export function ResourcesPage() {
  const {
    items,
    namespaces,
    filters,
    loading,
    error,
    refetch,
    isFormOpen,
    setIsFormOpen,
    editingResource,
    deletingResource,
    setDeletingResource,
    isDriftModalOpen,
    driftReport,
    driftError,
    isReconciling,
    deleteLoading,
    handleKindChange,
    handleNamespaceChange,
    handleClearFilters,
    handleDetectDrift,
    handleReconcile,
    handleReconcileFromModal,
    handleCloseDriftModal,
    handleEdit,
    handleDelete,
  } = useResourcesDashboard();

  if (error) {
    return (
      <ErrorState message={errorMessage(error) || 'Failed to load resources'} onRetry={refetch} />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Box className="h-6 w-6" />}
        iconClassName="text-purple-400"
        title="Resources"
        description="Browse and manage infrastructure resources"
        onRefresh={refetch}
        actions={
          <Link to={ROUTES.GOLDEN_PATHS}>
            <Button size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Create via Golden Path
            </Button>
          </Link>
        }
      />

      <ResourceFilterBar
        kindFilter={filters.kind}
        namespaceFilter={filters.namespace}
        namespaces={namespaces}
        onKindChange={handleKindChange}
        onNamespaceChange={handleNamespaceChange}
        onClearFilters={handleClearFilters}
      />

      <ResourceListView
        items={items}
        loading={loading}
        kindFilter={filters.kind}
        namespaceFilter={filters.namespace}
        onDetectDrift={handleDetectDrift}
        onReconcile={handleReconcile}
        onEdit={handleEdit}
        onDelete={setDeletingResource}
      />

      {editingResource && (
        <ResourceFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          resource={editingResource}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingResource}
        onClose={() => setDeletingResource(null)}
        onConfirm={handleDelete}
        title="Delete Resource"
        message={`Are you sure you want to delete ${deletingResource?.metadata?.name}? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteLoading}
      />

      <DriftReportModal
        isOpen={isDriftModalOpen}
        onClose={handleCloseDriftModal}
        driftReport={driftReport}
        onReconcile={handleReconcileFromModal}
        isReconciling={isReconciling}
      />

      {driftError && (
        <div className="fixed bottom-4 right-4 max-w-md z-50">
          <Alert type="error" title="Error">
            {driftError}
          </Alert>
        </div>
      )}
    </div>
  );
}
