export interface BusinessDomain {
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
    description: string;
    ownership: {
      team: string;
      techLead?: string;
      productOwner?: string;
      costCenter?: string;
    };
    boundaries: {
      namespaces: string[];
      resourceKinds?: string[];
    };
    sla?: {
      tier: string;
      availability?: string;
      rto?: string;
      rpo?: string;
    };
    compliance?: {
      frameworks?: string[];
      dataClassification?: string;
    };
    dependencies?: Array<{
      domain: string;
      type?: string;
      direction?: string;
    }>;
    tags?: string[];
  };
  status: {
    resourceCount: number;
    teamCount: number;
    healthSummary: {
      healthy: number;
      degraded: number;
      unhealthy: number;
    };
    lastUpdated: string;
  };
  createdAt: string;
  updatedAt: string;
  // Backward-compat fields preserved while pages still read them directly.
  name?: string;
  namespace?: string;
  displayName?: string;
  description?: string;
  team?: string;
  labels?: Record<string, string>;
}
