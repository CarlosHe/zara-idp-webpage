// Sprint-17 / L-1710 — types for the catalog-source management UI.
//
// The shapes mirror the REST DTOs declared in
// `zara-control-plane/internal/adapters/rest/handlers_catalog_sources.go`.

export type CatalogSourceProvider =
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'file'
  | 'http';

export interface CatalogSourceStatus {
  lastSyncAt?: string;
  lastSyncOk: boolean;
  lastErrorMessage?: string;
  lastChangeSetId?: string;
  lastRecordsCount: number;
  lastErrorsCount: number;
  requiresApproval: boolean;
}

export interface CatalogSource {
  id: string;
  provider: CatalogSourceProvider;
  owner?: string;
  url?: string;
  description?: string;
  manifestGlobs: string[];
  createdAt: string;
  status: CatalogSourceStatus;
}

export interface CatalogSyncError {
  repository?: string;
  path: string;
  cause: string;
}

export interface CatalogSyncResponse {
  sourceId: string;
  provider: CatalogSourceProvider;
  changesetId?: string;
  requiresApproval: boolean;
  records: number;
  message: string;
  errors?: CatalogSyncError[];
  status: CatalogSourceStatus;
  nextSteps?: string;
}
