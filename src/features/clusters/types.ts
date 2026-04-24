export interface ClusterView {
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

export interface ClusterStats {
  totalNodes: number;
  totalResources: number;
  healthyClusters: number;
  prodClusters: number;
}
