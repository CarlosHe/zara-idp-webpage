// Sprint 28 / L-2805 — TypeScript shapes for the executive analytics
// dashboard. Mirror the REST DTOs declared in
// `internal/adapters/rest/handlers_analytics_dora.go` 1:1.

export type MetricScope = 'platform' | 'domain' | 'team' | 'service';

export interface AnalyticsWindow {
  windowStart: string;
  windowEnd: string;
}

export interface DORAMetricsDTO extends AnalyticsWindow {
  scope: MetricScope;
  key?: string;
  leadTimeMsP50: number;
  leadTimeMsP95: number;
  deployFrequencyPerDay: number;
  changeFailureRate: number;
  mttrMs: number;
  sampleSize: number;
}

export interface CatalogQualityDTO extends AnalyticsWindow {
  scope: MetricScope;
  key?: string;
  total: number;
  missingOwner: number;
  missingDocs: number;
  missingSlo: number;
  missingRunbook: number;
  missingApiDoc: number;
  staleEntities: number;
  percentClean: number;
}

export interface ApprovalSLADTO extends AnalyticsWindow {
  scope: MetricScope;
  key?: string;
  requested: number;
  granted: number;
  rejected: number;
  breached: number;
  breachRate: number;
  latencyMsP50: number;
  latencyMsP95: number;
  latencyMsP99: number;
}

export interface RemediationEffectivenessDTO extends AnalyticsWindow {
  scope: MetricScope;
  key?: string;
  proposed: number;
  accepted: number;
  rejected: number;
  reverted: number;
  acceptanceRate: number;
  regressionRate: number;
  timeSavedMs: number;
}

export type RecommendationSeverity = 'info' | 'warning' | 'critical';

export type RecommendationKind =
  | 'dora_improve'
  | 'catalog_fix'
  | 'approval_sla'
  | 'remediation'
  | 'adoption';

export interface RecommendationDTO {
  id: string;
  kind: RecommendationKind;
  severity: RecommendationSeverity;
  scope: MetricScope;
  key?: string;
  title: string;
  detail?: string;
  score: number;
  source: string;
  generatedAt: string;
}

export interface RecommendationsResponse {
  items: RecommendationDTO[];
}

export interface AnalyticsQuery {
  scope?: MetricScope;
  key?: string;
  from?: string;
  to?: string;
}
