import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import {
  setKindFilter,
  setNamespaceFilter,
  clearFilters,
} from '@/features/resources/store/resourcesSlice';
import {
  useListResourcesQuery,
  useDeleteResourceMutation,
  useLazyDetectDriftQuery,
  useReconcileResourceMutation,
} from '@/features/resources/services/resourcesApi';
import { useListNamespacesQuery } from '@/features/namespaces/services/namespacesApi';
import { errorMessage } from '@/shared/lib/api';
import type { Resource, ResourceKind, DriftReport } from '@/shared/types';

export function useResourcesDashboard() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useAppSelector((state) => state.resources.filters);

  const {
    data: items = [],
    isLoading: loading,
    error,
    refetch,
  } = useListResourcesQuery({ kind: filters.kind });
  const { data: namespaces = [] } = useListNamespacesQuery();
  const [deleteResource, deleteState] = useDeleteResourceMutation();
  const [triggerDetectDrift] = useLazyDetectDriftQuery();
  const [reconcileResource, reconcileState] = useReconcileResourceMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);

  const [isDriftModalOpen, setIsDriftModalOpen] = useState(false);
  const [driftReport, setDriftReport] = useState<DriftReport | null>(null);
  const [driftError, setDriftError] = useState<string | null>(null);
  const isReconciling = reconcileState.isLoading;

  const namespaceParam = searchParams.get('namespace');
  const kindParam = searchParams.get('kind');

  // Hydrate filters from URL query params on mount / URL change.
  useEffect(() => {
    if (namespaceParam) dispatch(setNamespaceFilter(namespaceParam));
    if (kindParam) dispatch(setKindFilter(kindParam as ResourceKind));
  }, [dispatch, namespaceParam, kindParam]);

  const handleKindChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    dispatch(setKindFilter(value ? (value as ResourceKind) : null));
    if (value) {
      searchParams.set('kind', value);
    } else {
      searchParams.delete('kind');
    }
    setSearchParams(searchParams);
  };

  const handleNamespaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    dispatch(setNamespaceFilter(value || null));
    if (value) {
      searchParams.set('namespace', value);
    } else {
      searchParams.delete('namespace');
    }
    setSearchParams(searchParams);
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchParams({});
  };

  const handleDetectDrift = async (resource: Resource) => {
    setDriftError(null);
    setDriftReport(null);

    try {
      const report = await triggerDetectDrift({ resourceId: resource.id }).unwrap();
      setDriftReport(report);
      setIsDriftModalOpen(true);
    } catch (err) {
      setDriftError(errorMessage(err as Parameters<typeof errorMessage>[0]) || 'Failed to detect drift');
    }
  };

  const handleReconcile = async (resource: Resource) => {
    setDriftError(null);

    try {
      const response = await reconcileResource({ resourceId: resource.id }).unwrap();
      setIsDriftModalOpen(false);
      setDriftReport(null);
      // The mutation already invalidates Resource/LIST so the list
      // refetches automatically. We just need the user-facing toast.
      alert(`Reconciliation started: ${response.message}`);
    } catch (err) {
      setDriftError(errorMessage(err as Parameters<typeof errorMessage>[0]) || 'Failed to reconcile resource');
    }
  };

  const handleReconcileFromModal = () => {
    if (driftReport) {
      const resource = items.find((r) => r.id === driftReport.resource_id);
      if (resource) {
        handleReconcile(resource);
      }
    }
  };

  const handleCloseDriftModal = () => {
    setIsDriftModalOpen(false);
    setDriftReport(null);
    setDriftError(null);
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingResource) {
      await deleteResource({ id: deletingResource.id }).unwrap().catch(() => undefined);
      setDeletingResource(null);
    }
  };

  // Apply filters
  let filteredItems = items;
  if (filters.namespace) {
    filteredItems = filteredItems.filter(
      (r) => (r.metadata?.namespace || r.namespace) === filters.namespace,
    );
  }

  return {
    // data
    items: filteredItems,
    namespaces,
    filters,
    loading,
    error,
    refetch,
    // modals
    isFormOpen,
    setIsFormOpen,
    editingResource,
    deletingResource,
    setDeletingResource,
    isDriftModalOpen,
    driftReport,
    driftError,
    isReconciling,
    deleteLoading: deleteState.isLoading,
    // handlers
    handleKindChange,
    handleNamespaceChange,
    handleClearFilters,
    handleDetectDrift,
    handleReconcile,
    handleReconcileFromModal,
    handleCloseDriftModal,
    handleEdit,
    handleDelete,
  };
}
