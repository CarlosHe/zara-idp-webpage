export interface Cluster {
  id: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
  };
  spec: {
    displayName: string;
    provider: string;
    region: string;
    environment: string;
    version?: string;
    endpoints?: {
      api?: string;
      argocd?: string;
      dashboard?: string;
    };
    labels?: Record<string, string>;
  };
  status: {
    health: string;
    nodeCount: number;
    resourceCount: number;
    cpu: { used: number; total: number };
    memory: { used: number; total: number };
    lastSyncAt: string;
  };
  createdAt: string;
  updatedAt: string;
  // Backward-compat fields preserved while pages still read them directly.
  name?: string;
  namespace?: string;
  displayName?: string;
  provider?: string;
  environment?: string;
  region?: string;
  labels?: Record<string, string>;
}
