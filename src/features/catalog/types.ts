import type { ResourceKind } from '@/shared/types';

export interface CatalogRelationship {
  type: string;
  targetKind: ResourceKind;
  targetName: string;
  namespace: string;
}

export interface CatalogEntity {
  id: string;
  key: string;
  kind: ResourceKind;
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: Record<string, unknown>;
  relationships: CatalogRelationship[];
  version: number;
  generation: number;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogListParams {
  namespace?: string;
  kind?: string;
  limit?: number;
  offset?: number;
}

export type QualitySeverity = 'high' | 'medium' | 'low';

export interface QualityFinding {
  code: string;
  severity: QualitySeverity;
  message: string;
  field?: string;
  entityKey: string;
}

export interface CatalogGraphOwner {
  source: string;
  ref: string;
  kind?: string;
  namespace?: string;
  type?: string;
}

export interface CatalogGraphRelationship {
  type: string;
  kind: string;
  namespace: string;
  name: string;
}

export interface CatalogGraphResponse {
  entity: CatalogEntity;
  owners: CatalogGraphOwner[];
  dependencies: CatalogGraphRelationship[];
  dependents: CatalogGraphRelationship[];
  quality: {
    score: number;
    findings: QualityFinding[];
  };
}
