// Sprint 29 / L-2904 — DTOs mirroring the REST contract for the
// tenant admin surface.

export type TenantLifecycle = 'active' | 'suspended' | 'archived';

export interface Tenant {
  id: string;
  slug: string;
  displayName: string;
  owner: string;
  admins: string[];
  lifecycle: TenantLifecycle;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  suspendedAt?: string;
  archivedAt?: string;
  version: number;
}

export interface TenantList {
  items: Tenant[];
  count: number;
}

export interface TenantQuotaLimit {
  key: string;
  limit: number;
}

export interface TenantQuota {
  tenantId: string;
  limits: TenantQuotaLimit[];
  updatedAt: string;
  version: number;
}

export interface TenantSLO {
  tenantId: string;
  lifecycle: TenantLifecycle;
  activeQuotas: number;
  costBudgetUSDcts: number;
  costSpendUSDcts: number;
  namespaceCount: number;
  incidentsOpen: number;
  updatedAt: string;
}

export interface TenantSLOList {
  items: TenantSLO[];
  count: number;
}
