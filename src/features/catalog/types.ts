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
