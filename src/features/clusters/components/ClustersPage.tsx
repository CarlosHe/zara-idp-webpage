import { useState, useMemo } from 'react';
import {
  Server,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Cpu,
  HardDrive,
  Search,
  ChevronRight,
  Cloud,
  Boxes,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Badge,
  Modal,
  ConfirmModal,
  Alert,
  Select,
} from '@/shared/components/ui';
import { PageHeader, DataEmptyState, LoadingState, ErrorState, StatCard } from '@/shared/components/feedback';
import { cn } from '@/shared/utils';
import {
  useListClustersQuery,
  useCreateClusterMutation,
  useUpdateClusterMutation,
  useDeleteClusterMutation,
} from '@/features/clusters/services/clustersApi';
import type { Cluster as ClusterType } from '@/features/clusters/store/clusterTypes';
import { errorMessage } from '@/shared/lib/api';

interface Cluster {
  id: string;
  name: string;
  displayName: string;
  provider: 'aws' | 'gcp' | 'azure' | 'on-prem';
  region: string;
  environment: 'production' | 'staging' | 'development';
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  version: string;
  nodeCount: number;
  resourceCount: number;
  cpu: { used: number; total: number };
  memory: { used: number; total: number };
  lastSyncAt: string;
  endpoints: {
    api: string;
    argocd?: string;
  };
}

// Cluster Form Modal
interface ClusterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cluster?: Cluster | null;
}

function ClusterFormModal({ isOpen, onClose, cluster }: ClusterFormModalProps) {
  const [createCluster, createState] = useCreateClusterMutation();
  const [updateCluster, updateState] = useUpdateClusterMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const saveError =
    errorMessage(createState.error) || errorMessage(updateState.error) || null;
  // Initial state derived once; the parent re-keys the modal on
  // cluster change so re-mount does the reset.
  const [formData, setFormData] = useState<{
    name: string;
    displayName: string;
    provider: string;
    environment: string;
    region: string;
  }>(() => ({
    name: cluster?.name || '',
    displayName: cluster?.displayName || '',
    provider: cluster?.provider || 'aws',
    environment: cluster?.environment || 'development',
    region: cluster?.region || '',
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (cluster?.id) {
        await updateCluster({
          id: cluster.id,
          data: {
            displayName: formData.displayName,
            environment: formData.environment,
          },
        }).unwrap();
      } else {
        await createCluster({
          name: formData.name,
          displayName: formData.displayName,
          provider: formData.provider,
          environment: formData.environment,
          region: formData.region,
        }).unwrap();
      }
      onClose();
    } catch {
      // Error surfaces via derived `saveError` above.
    }
  };

  const providerOptions = [
    { value: 'aws', label: 'AWS' },
    { value: 'gcp', label: 'Google Cloud' },
    { value: 'azure', label: 'Azure' },
    { value: 'on-prem', label: 'On-Premises' },
  ];

  const environmentOptions = [
    { value: 'development', label: 'Development' },
    { value: 'staging', label: 'Staging' },
    { value: 'production', label: 'Production' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={cluster ? 'Edit Cluster' : 'Create Cluster'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {saveError && (
          <Alert type="error" title="Error">
            {saveError}
          </Alert>
        )}
        
        <Input
          id="name"
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="prod-us-east-1"
          required
          disabled={!!cluster}
        />
        
        <Input
          id="displayName"
          label="Display Name"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          placeholder="Production US East 1"
        />

        <Select
          id="provider"
          label="Provider"
          value={formData.provider}
          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
          options={providerOptions}
          disabled={!!cluster}
        />

        <Select
          id="environment"
          label="Environment"
          value={formData.environment}
          onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
          options={environmentOptions}
        />

        <Input
          id="region"
          label="Region"
          value={formData.region}
          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
          placeholder="us-east-1"
          required
          disabled={!!cluster}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {cluster ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ClustersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null);
  const [deletingCluster, setDeletingCluster] = useState<Cluster | null>(null);

  const {
    data: reduxClusters = [],
    isLoading: loading,
    error,
    refetch,
  } = useListClustersQuery({ environment: selectedEnvironment ?? undefined });
  const [deleteCluster, deleteState] = useDeleteClusterMutation();
  const saving = deleteState.isLoading;

  // Map Redux state to local Cluster interface
  const clusters: Cluster[] = useMemo(() => {
    return (reduxClusters || []).map((c: ClusterType) => ({
      id: c.id || c.metadata?.name || c.name || '',
      name: c.metadata?.name || c.name || '',
      displayName: c.spec?.displayName || c.displayName || c.metadata?.name || c.name || '',
      provider: (c.spec?.provider || c.provider || 'on-prem') as Cluster['provider'],
      region: c.spec?.region || c.region || 'unknown',
      environment: (c.spec?.environment || c.environment || 'development') as Cluster['environment'],
      status: (c.status?.health || 'unknown') as Cluster['status'],
      version: c.spec?.version || 'unknown',
      nodeCount: c.status?.nodeCount || 0,
      resourceCount: c.status?.resourceCount || 0,
      cpu: c.status?.cpu || { used: 0, total: 100 },
      memory: c.status?.memory || { used: 0, total: 100 },
      lastSyncAt: c.status?.lastSyncAt || c.createdAt || new Date().toISOString(),
      endpoints: { api: c.spec?.endpoints?.api ?? '', argocd: c.spec?.endpoints?.argocd },
    }));
  }, [reduxClusters]);

  const loadClusters = () => {
    refetch();
  };

  const handleCreate = () => {
    setEditingCluster(null);
    setIsFormOpen(true);
  };

  const handleEdit = (cluster: Cluster) => {
    setEditingCluster(cluster);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingCluster?.id) {
      await deleteCluster(deletingCluster.id).unwrap().catch(() => undefined);
      setDeletingCluster(null);
      if (selectedCluster?.id === deletingCluster.id) {
        setSelectedCluster(null);
      }
    }
  };

  const filteredClusters = useMemo(() => {
    return clusters.filter((cluster) => {
      const matchesSearch =
        !searchQuery ||
        cluster.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cluster.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cluster.provider.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [searchQuery, clusters]);

  const stats = useMemo(() => {
    const totalNodes = clusters.reduce((sum, c) => sum + c.nodeCount, 0);
    const totalResources = clusters.reduce((sum, c) => sum + c.resourceCount, 0);
    const healthyClusters = clusters.filter((c) => c.status === 'healthy').length;
    const prodClusters = clusters.filter((c) => c.environment === 'production').length;

    return { totalNodes, totalResources, healthyClusters, prodClusters };
  }, [clusters]);

  const getStatusIcon = (status: Cluster['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: Cluster['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'degraded':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'unhealthy':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getProviderIcon = (provider: Cluster['provider']) => {
    switch (provider) {
      case 'aws':
        return <Cloud className="h-4 w-4 text-orange-400" />;
      case 'gcp':
        return <Cloud className="h-4 w-4 text-blue-400" />;
      case 'azure':
        return <Cloud className="h-4 w-4 text-cyan-400" />;
      default:
        return <Server className="h-4 w-4 text-slate-400" />;
    }
  };

  const getEnvColor = (env: Cluster['environment']) => {
    switch (env) {
      case 'production':
        return 'bg-red-500/20 text-red-400';
      case 'staging':
        return 'bg-amber-500/20 text-amber-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (loading) {
    return <LoadingState message="Loading clusters..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={errorMessage(error) || 'Failed to load clusters'}
        onRetry={loadClusters}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        icon={<Globe className="h-6 w-6" />}
        iconClassName="text-cyan-400"
        title="Clusters"
        description="Multi-cluster management and resource distribution"
        onRefresh={loadClusters}
        refreshLabel="Sync All"
        actions={
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Cluster
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Globe className="h-5 w-5 text-cyan-400" />}
          iconBgColor="bg-cyan-500/20"
          value={clusters.length}
          label="Total Clusters"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          iconBgColor="bg-emerald-500/20"
          value={stats.healthyClusters}
          label="Healthy Clusters"
        />
        <StatCard
          icon={<Server className="h-5 w-5 text-blue-400" />}
          iconBgColor="bg-blue-500/20"
          value={stats.totalNodes}
          label="Total Nodes"
        />
        <StatCard
          icon={<Boxes className="h-5 w-5 text-purple-400" />}
          iconBgColor="bg-purple-500/20"
          value={stats.totalResources}
          label="Total Resources"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search clusters by name, region, or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedEnvironment === null ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedEnvironment(null)}
          >
            All
          </Button>
          <Button
            variant={selectedEnvironment === 'production' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedEnvironment('production')}
          >
            Production
          </Button>
          <Button
            variant={selectedEnvironment === 'staging' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedEnvironment('staging')}
          >
            Staging
          </Button>
          <Button
            variant={selectedEnvironment === 'development' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedEnvironment('development')}
          >
            Development
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cluster List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredClusters.length === 0 ? (
            <DataEmptyState
              icon={<Globe className="h-8 w-8 text-slate-500" />}
              title="No clusters found"
              description="No clusters match your current filters."
            />
          ) : (
            filteredClusters.map((cluster) => (
              <div key={cluster.id} className="relative" onClick={() => setSelectedCluster(cluster)}>
                <Card
                  className={cn(
                    'transition-all cursor-pointer hover:bg-slate-700/50',
                    selectedCluster?.id === cluster.id && 'ring-2 ring-cyan-500'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getProviderIcon(cluster.provider)}
                          <h3 className="font-semibold text-white">{cluster.displayName}</h3>
                          <Badge className={getStatusColor(cluster.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(cluster.status)}
                              {cluster.status}
                            </span>
                          </Badge>
                          <Badge className={getEnvColor(cluster.environment)}>
                            {cluster.environment}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                          <span>{cluster.provider.toUpperCase()}</span>
                          <span>{cluster.region}</span>
                          <span>{cluster.version}</span>
                        </div>

                        {/* Resource bars */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Cpu className="h-3 w-3" /> CPU
                              </span>
                              <span className="text-slate-300">{cluster.cpu.used}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  cluster.cpu.used > 80
                                    ? 'bg-red-500'
                                    : cluster.cpu.used > 60
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                )}
                                style={{ width: `${cluster.cpu.used}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-400 flex items-center gap-1">
                                <HardDrive className="h-3 w-3" /> Memory
                              </span>
                              <span className="text-slate-300">{cluster.memory.used}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  cluster.memory.used > 80
                                    ? 'bg-red-500'
                                    : cluster.memory.used > 60
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                )}
                                style={{ width: `${cluster.memory.used}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Server className="h-3 w-3" />
                            {cluster.nodeCount} nodes
                          </span>
                          <span className="flex items-center gap-1">
                            <Boxes className="h-3 w-3" />
                            {cluster.resourceCount}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {formatRelativeTime(cluster.lastSyncAt)}
                        </span>
                        <ChevronRight className="h-5 w-5 text-slate-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(cluster); }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-600 transition-colors bg-slate-800/80"
                    title="Edit cluster"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingCluster(cluster); }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors bg-slate-800/80"
                    title="Delete cluster"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cluster Details */}
        <div className="space-y-4">
          {selectedCluster ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getProviderIcon(selectedCluster.provider)}
                    {selectedCluster.displayName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase">Provider</label>
                      <p className="text-white mt-1">{selectedCluster.provider.toUpperCase()}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase">Region</label>
                      <p className="text-white mt-1">{selectedCluster.region}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase">Version</label>
                      <p className="text-white mt-1">{selectedCluster.version}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase">Environment</label>
                      <p className="text-white mt-1 capitalize">{selectedCluster.environment}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedCluster.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(selectedCluster.status)}
                          {selectedCluster.status}
                        </span>
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase">Last Sync</label>
                    <p className="text-white mt-1">{formatRelativeTime(selectedCluster.lastSyncAt)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Resource Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300 flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-blue-400" />
                        CPU Usage
                      </span>
                      <span className="text-sm font-medium text-white">{selectedCluster.cpu.used}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          selectedCluster.cpu.used > 80
                            ? 'bg-red-500'
                            : selectedCluster.cpu.used > 60
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        )}
                        style={{ width: `${selectedCluster.cpu.used}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300 flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-purple-400" />
                        Memory Usage
                      </span>
                      <span className="text-sm font-medium text-white">{selectedCluster.memory.used}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          selectedCluster.memory.used > 80
                            ? 'bg-red-500'
                            : selectedCluster.memory.used > 60
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        )}
                        style={{ width: `${selectedCluster.memory.used}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Nodes</span>
                      <span className="text-white">{selectedCluster.nodeCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-slate-400">Resources</span>
                      <span className="text-white">{selectedCluster.resourceCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Endpoints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase">API Server</label>
                    <p className="text-blue-400 text-sm mt-1 truncate">{selectedCluster.endpoints.api}</p>
                  </div>
                  {selectedCluster.endpoints.argocd && (
                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase">ArgoCD</label>
                      <p className="text-blue-400 text-sm mt-1 truncate">{selectedCluster.endpoints.argocd}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Globe className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a cluster to view details</p>
              </CardContent>
            </Card>
          )}
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

      {/* Delete Confirmation */}
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
