import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Box,
  Database,
  Folder,
  KeyRound,
  FileJson,
  Network,
  Globe,
  Pencil,
  Trash2,
  Sparkles,
  Plus,
  RefreshCw,
  GitCompare,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { ROUTES } from '@/shared/config';
import {
  setKindFilter,
  setNamespaceFilter,
  clearFilters,
} from '@/features/resources/store/resourcesSlice';
import {
  useListResourcesQuery,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
  useLazyDetectDriftQuery,
  useReconcileResourceMutation,
} from '@/features/resources/services/resourcesApi';
import { useListNamespacesQuery } from '@/features/namespaces/services/namespacesApi';
import { errorMessage } from '@/shared/lib/api';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatusBadge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Select,
  Input,
  Button,
  Modal,
  ConfirmModal,
  Alert,
  DriftReportModal,
} from '@/shared/components/ui';
import { PageHeader, DataEmptyState, LoadingState, ErrorState } from '@/shared/components/feedback';
import { formatRelativeTime } from '@/shared/utils';
import type { ResourceKind, Resource, HealthStatus, DriftReport } from '@/shared/types';

const kindIcons: Record<string, typeof Box> = {
  Application: Box,
  PostgresDatabase: Database,
  PostgresSchema: Folder,
  PostgresRole: KeyRound,
  Namespace: Folder,
  Secret: KeyRound,
  Policy: FileJson,
  RuntimePolicy: FileJson,
  BusinessDomain: Network,
  Cluster: Globe,
  Team: Box,
};

const kindOptions = [
  { value: '', label: 'All Kinds' },
  { value: 'Application', label: 'Application' },
  { value: 'PostgresDatabase', label: 'Postgres Database' },
  { value: 'PostgresSchema', label: 'Postgres Schema' },
  { value: 'PostgresRole', label: 'Postgres Role' },
  { value: 'Namespace', label: 'Namespace' },
  { value: 'Secret', label: 'Secret' },
  { value: 'Policy', label: 'Policy' },
  { value: 'RuntimePolicy', label: 'Runtime Policy' },
  { value: 'BusinessDomain', label: 'Business Domain' },
  { value: 'Cluster', label: 'Cluster' },
  { value: 'Team', label: 'Team' },
];

// Resource Form Modal (Edit Only)
interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
}

function ResourceFormModal({ isOpen, onClose, resource }: ResourceFormModalProps) {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.resources);
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
      const result = await dispatch(updateResource({
        kind: resource.kind,
        namespace: resource.metadata?.namespace || resource.namespace || '',
        name: resource.metadata?.name || resource.name || '',
        data: {
          spec,
          metadata: { labels },
        },
      }));
      if (!result.type.endsWith('/rejected')) {
        onClose();
      } else {
        setError('Failed to update resource');
      }
    } catch (err) {
      setError((err as Error).message);
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

        <Input
          id="name"
          label="Name"
          value={formData.name}
          disabled
        />

        <Input
          id="namespace"
          label="Namespace"
          value={formData.namespace}
          disabled
        />

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
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Labels
          </label>
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

export function ResourcesPage() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, loading, error, filters } = useAppSelector((state) => state.resources);
  const { items: namespaces } = useAppSelector((state) => state.namespaces);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);
  
  // Drift detection and reconcile state
  const [isDriftModalOpen, setIsDriftModalOpen] = useState(false);
  const [driftReport, setDriftReport] = useState<DriftReport | null>(null);
  const [, setIsLoadingDrift] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [driftError, setDriftError] = useState<string | null>(null);

  const namespaceParam = searchParams.get('namespace');
  const kindParam = searchParams.get('kind');

  useEffect(() => {
    dispatch(fetchNamespaces());
  }, [dispatch]);

  useEffect(() => {
    if (namespaceParam) {
      dispatch(setNamespaceFilter(namespaceParam));
    }
    if (kindParam) {
      dispatch(setKindFilter(kindParam as ResourceKind));
    }
  }, [dispatch, namespaceParam, kindParam]);

  useEffect(() => {
    dispatch(fetchResources());
  }, [dispatch, filters.kind]);

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
    setIsLoadingDrift(true);
    setDriftError(null);
    setDriftReport(null);
    
    try {
      const report = await api.detectDrift(resource.id);
      setDriftReport(report);
      setIsDriftModalOpen(true);
    } catch (err) {
      setDriftError((err as Error).message || 'Failed to detect drift');
    } finally {
      setIsLoadingDrift(false);
    }
  };

  const handleReconcile = async (resource: Resource) => {
    setIsReconciling(true);
    setDriftError(null);
    
    try {
      const response = await api.reconcileResource(resource.id);
      // Close drift modal and refresh resources
      setIsDriftModalOpen(false);
      setDriftReport(null);
      dispatch(fetchResources());
      // Show success message
      alert(`Reconciliation started: ${response.message}`);
    } catch (err) {
      setDriftError((err as Error).message || 'Failed to reconcile resource');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleReconcileFromModal = () => {
    if (driftReport) {
      const resource = items.find(r => r.id === driftReport.resource_id);
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
      await dispatch(deleteResource({
        id: deletingResource.id,
      }));
      setDeletingResource(null);
    }
  };

  // Apply filters
  let filteredItems = items;
  if (filters.namespace) {
    filteredItems = filteredItems.filter((r) => 
      (r.metadata?.namespace || r.namespace) === filters.namespace
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchResources())} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Box className="h-6 w-6" />}
        iconClassName="text-purple-400"
        title="Resources"
        description="Browse and manage infrastructure resources"
        onRefresh={() => dispatch(fetchResources())}
        actions={
          <Link to={ROUTES.GOLDEN_PATHS}>
            <Button size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Create via Golden Path
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              id="kind-filter"
              label="Resource Kind"
              value={filters.kind || ''}
              onChange={handleKindChange}
            >
              {kindOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>

            <Select
              id="namespace-filter"
              label="Namespace"
              value={filters.namespace || ''}
              onChange={handleNamespaceChange}
            >
              <option value="">All Namespaces</option>
              {namespaces.map((ns) => (
                <option key={ns.name} value={ns.name}>
                  {ns.name}
                </option>
              ))}
            </Select>

            <div className="flex items-end">
              <Button variant="secondary" onClick={handleClearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Resources ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState message="Loading resources..." iconClassName="text-purple-400" />
          ) : filteredItems.length === 0 ? (
            <DataEmptyState
              icon={<Box className="h-12 w-12 text-purple-400" />}
              title="No resources found"
              description={
                filters.kind || filters.namespace
                  ? 'Try adjusting your filters'
                  : 'Create your first resource using Golden Paths'
              }
              action={
                !filters.kind && !filters.namespace ? (
                  <Link to={ROUTES.GOLDEN_PATHS}>
                    <Button>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Go to Golden Paths
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kind</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((resource) => {
                    const KindIcon = kindIcons[resource.kind] || Box;
                    return (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <KindIcon className="h-4 w-4 text-gray-400" />
                            <span className="font-mono text-sm">{resource.kind}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            to={ROUTES.RESOURCES.DETAIL(
                              resource.kind,
                              resource.metadata?.namespace || resource.namespace || '',
                              resource.metadata?.name || resource.name || '',
                            )}
                            className="text-blue-400 hover:text-blue-300 font-medium"
                          >
                            {resource.metadata?.name || resource.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`${ROUTES.RESOURCES.LIST}?namespace=${resource.metadata?.namespace || resource.namespace}`}
                            className="text-gray-400 hover:text-gray-300"
                          >
                            {resource.metadata?.namespace || resource.namespace}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <StatusBadge 
                            type="health" 
                            status={(resource.status || 'Unknown') as HealthStatus} 
                          />
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-400 text-sm">v{resource.version}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-400 text-sm">
                            {formatRelativeTime(resource.updatedAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDetectDrift(resource)}
                              title="Detect Drift"
                            >
                              <GitCompare className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleReconcile(resource)}
                              title="Reconcile"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEdit(resource)}
                              title="Edit"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setDeletingResource(resource)}
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
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
        loading={loading}
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
