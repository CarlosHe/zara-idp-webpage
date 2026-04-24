import { useCallback, useMemo, useState } from 'react';
import {
  useListClustersQuery,
  useDeleteClusterMutation,
} from '@/features/clusters/services/clustersApi';
import type { Cluster as ClusterType } from '@/features/clusters/store/clusterTypes';
import type { ClusterStats, ClusterView } from '../types';

interface UseClusterDashboardResult {
  clusters: ClusterView[];
  filteredClusters: ClusterView[];
  stats: ClusterStats;
  loading: boolean;
  error: unknown;
  saving: boolean;
  searchQuery: string;
  selectedEnvironment: string | null;
  selectedCluster: ClusterView | null;
  isFormOpen: boolean;
  editingCluster: ClusterView | null;
  deletingCluster: ClusterView | null;
  setSearchQuery: (value: string) => void;
  setSelectedEnvironment: (value: string | null) => void;
  setSelectedCluster: (cluster: ClusterView | null) => void;
  setIsFormOpen: (open: boolean) => void;
  setDeletingCluster: (cluster: ClusterView | null) => void;
  refetch: () => void;
  handleCreate: () => void;
  handleEdit: (cluster: ClusterView) => void;
  handleDelete: () => Promise<void>;
}

function mapClusters(reduxClusters: ClusterType[]): ClusterView[] {
  return (reduxClusters || []).map((c: ClusterType) => ({
    id: c.id || c.metadata?.name || c.name || '',
    name: c.metadata?.name || c.name || '',
    displayName: c.spec?.displayName || c.displayName || c.metadata?.name || c.name || '',
    provider: (c.spec?.provider || c.provider || 'on-prem') as ClusterView['provider'],
    region: c.spec?.region || c.region || 'unknown',
    environment: (c.spec?.environment ||
      c.environment ||
      'development') as ClusterView['environment'],
    status: (c.status?.health || 'unknown') as ClusterView['status'],
    version: c.spec?.version || 'unknown',
    nodeCount: c.status?.nodeCount || 0,
    resourceCount: c.status?.resourceCount || 0,
    cpu: c.status?.cpu || { used: 0, total: 100 },
    memory: c.status?.memory || { used: 0, total: 100 },
    lastSyncAt: c.status?.lastSyncAt || c.createdAt || new Date().toISOString(),
    endpoints: { api: c.spec?.endpoints?.api ?? '', argocd: c.spec?.endpoints?.argocd },
  }));
}

export function useClusterDashboard(): UseClusterDashboardResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<ClusterView | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCluster, setEditingCluster] = useState<ClusterView | null>(null);
  const [deletingCluster, setDeletingCluster] = useState<ClusterView | null>(null);

  const {
    data: reduxClusters = [],
    isLoading: loading,
    error,
    refetch,
  } = useListClustersQuery({ environment: selectedEnvironment ?? undefined });
  const [deleteCluster, deleteState] = useDeleteClusterMutation();
  const saving = deleteState.isLoading;

  const clusters = useMemo(() => mapClusters(reduxClusters), [reduxClusters]);

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

  const stats = useMemo<ClusterStats>(() => {
    const totalNodes = clusters.reduce((sum, c) => sum + c.nodeCount, 0);
    const totalResources = clusters.reduce((sum, c) => sum + c.resourceCount, 0);
    const healthyClusters = clusters.filter((c) => c.status === 'healthy').length;
    const prodClusters = clusters.filter((c) => c.environment === 'production').length;
    return { totalNodes, totalResources, healthyClusters, prodClusters };
  }, [clusters]);

  const handleCreate = useCallback(() => {
    setEditingCluster(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((cluster: ClusterView) => {
    setEditingCluster(cluster);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (deletingCluster?.id) {
      await deleteCluster(deletingCluster.id).unwrap().catch(() => undefined);
      setDeletingCluster(null);
      if (selectedCluster?.id === deletingCluster.id) {
        setSelectedCluster(null);
      }
    }
  }, [deleteCluster, deletingCluster, selectedCluster]);

  return {
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
  };
}
