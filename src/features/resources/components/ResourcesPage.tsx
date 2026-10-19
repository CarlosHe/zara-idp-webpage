import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Sparkles } from 'lucide-react';
import { ROUTES } from '@/shared/config';
import {
  buttonVariants,
  Button,
  ConfirmModal,
  Alert,
  DriftReportModal,
} from '@/shared/components/ui';
import { PageHeader, ErrorState } from '@/shared/components/feedback';
import { cn } from '@/shared/utils';
import { errorMessage } from '@/shared/lib/api';
import { ResourceFilterBar } from './ResourceFilterBar';
import { ResourceListView } from './ResourceListView';
import { useResourcesDashboard } from './useResourcesDashboard';

const ResourceFormModal = lazy(() => import('./ResourceFormModal').then((module) => ({default: module.ResourceFormModal})));

const ManifestApplyModal = lazy(() => import('./ManifestApplyModal'));

export function ResourcesPage() {
 const [applying, setApplying] = useState(false);
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
    cascadeDelete,
    setCascadeDelete,
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
          <div className="flex gap-2"><Button onClick={() => setApplying(true)}>Apply manifests</Button><Link
            to={ROUTES.GOLDEN_PATHS}
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            <Sparkles className="h-4 w-4 mr-2" aria-hidden />
            Create via Golden Path
          </Link></div>
        }
      />

      {applying && <Suspense fallback={null}><ManifestApplyModal onClose={() => setApplying(false)} /></Suspense>}

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

      {editingResource && isFormOpen && (
        <Suspense fallback={null}><ResourceFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          resource={editingResource}
        /></Suspense>
      )}

      <ConfirmModal
        isOpen={!!deletingResource}
        onClose={() => { setDeletingResource(null); setCascadeDelete(false); }}
        onConfirm={handleDelete}
        title="Delete Resource"
        message={<span>Request deletion of {deletingResource?.metadata?.name}. Approval may be required before the workers remove the infrastructure.<label className="mt-3 flex items-center gap-2"><input type="checkbox" checked={cascadeDelete} onChange={(event) => setCascadeDelete(event.target.checked)} />Also delete dependent resources (administrator)</label>{driftError && <span role="alert" className="mt-3 block text-red-300">{driftError}</span>}</span>}
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
