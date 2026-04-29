// Sprint 31 / L-3104 — TypeScript shapes for the remediation inbox.
//
// Mirrors the REST DTO declared in
// `internal/adapters/rest/handlers_remediation.go`. Closed-set fields
// (status, source, risk) ship as union types so component logic can
// narrow without runtime checks.

export type RemediationSource =
  | 'scorecard'
  | 'cost'
  | 'incident'
  | 'docs'
  | 'drift'
  | 'slo';

export type RemediationStatus =
  | 'pending'
  | 'scheduled'
  | 'approved'
  | 'executed'
  | 'rolled_back'
  | 'rejected'
  | 'expired';

export type RemediationRisk = 'low' | 'medium' | 'high' | 'critical';

export interface RemediationFinding {
  source: RemediationSource;
  code: string;
  entityKey: string;
  severity?: string;
}

export interface RemediationOwner {
  team?: string;
  subject?: string;
}

export interface RemediationImpact {
  description?: string;
  savingsCents?: number;
  coverage?: number;
}

export interface RemediationChangeSet {
  id: string;
  url?: string;
  title?: string;
}

export interface RemediationHistoryEvent {
  at: string;
  from?: string;
  to: string;
  actor?: string;
  reason?: string;
}

export interface RemediationProposal {
  id: string;
  tenant: string;
  title: string;
  summary?: string;
  source: RemediationSource;
  finding: RemediationFinding;
  risk: RemediationRisk;
  owner: RemediationOwner;
  status: RemediationStatus;
  followups?: string[];
  impact: RemediationImpact;
  changeSet?: RemediationChangeSet;
  batchId?: string;
  scheduledFor?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  history: RemediationHistoryEvent[];
  version: number;
}

export interface RemediationListResponse {
  items: RemediationProposal[];
}

export interface RemediationBatchResponse {
  batchId: string;
  items: RemediationProposal[];
}

export interface RemediationListFilters {
  status?: RemediationStatus;
  source?: RemediationSource;
  owner?: string;
  batchId?: string;
  minRisk?: RemediationRisk;
}
