// Sprint-26 / L-2604..L-2607 — frontend types for the cost dashboards.
// Mirrors the backend `domain/cost` aggregate / Finding / Budget shapes.

export type CostDimension =
  | 'service'
  | 'team'
  | 'domain'
  | 'environment'
  | 'resource';

export type AnomalyKind =
  | 'spike'
  | 'rising'
  | 'idle'
  | 'budget'
  | 'missing';

export type AnomalySeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info';

export type BudgetState = 'healthy' | 'warning' | 'breach';

export type FindingSource = 'anomaly' | 'budget' | 'idle';

export interface CostAmount {
  value: number;
  minorUnits: number;
  currency: string;
}

export interface CostScope {
  service?: string;
  team?: string;
  domain?: string;
  environment?: string;
  resource?: string;
}

export interface ShowbackBucket {
  dimension: CostDimension;
  label: string;
  total: CostAmount;
  share: number;
}

export interface ChargebackRow {
  team?: string;
  domain?: string;
  service?: string;
  environment?: string;
  total: CostAmount;
}

export interface BudgetEvaluation {
  budgetId: string;
  budgetName: string;
  scope: CostScope;
  cap: CostAmount;
  spend: CostAmount;
  utilisationBP: number;
  warnThresholdBP: number;
  state: BudgetState;
}

export interface Anomaly {
  kind: AnomalyKind;
  severity: AnomalySeverity;
  scope: CostScope;
  periodStart: string;
  periodEnd: string;
  observed: CostAmount;
  baseline: CostAmount;
  zScore: number;
  message: string;
}

export interface CostFinding {
  code: string;
  entityKey: string;
  source: FindingSource;
  severity: AnomalySeverity;
  scope: CostScope;
  title: string;
  message: string;
  amount: CostAmount;
  evaluatedAt: string;
}

export interface CostImpact {
  entityKey: string;
  findings: number;
  worstSeverity: AnomalySeverity;
  total: CostAmount;
}

export interface CostDashboard {
  window: { since: string; until: string };
  currency: string;
  totalSpend: CostAmount;
  allocationsCount: number;
  showback: ShowbackBucket[];
  chargeback: ChargebackRow[];
  topServices: ShowbackBucket[];
  idleResources: ShowbackBucket[];
  budgets: BudgetEvaluation[];
  anomalies: Anomaly[];
  findings: CostFinding[];
  costImpacts: CostImpact[];
}

export interface CostBudget {
  id: string;
  name: string;
  scope: CostScope;
  period: 'monthly' | 'quarterly' | 'annual';
  cap: CostAmount;
  warnThresholdBP: number;
  createdAt: string;
  updatedAt: string;
  latestState?: BudgetState;
}

export interface CostBudgetListResponse {
  budgets: CostBudget[];
}

export interface CostFindingsResponse {
  findings: CostFinding[];
}

export interface CostRemediationPlan {
  findingCode: string;
  entityKey: string;
  kind: string;
  title: string;
  description: string;
  patch?: Record<string, unknown>;
  suggestedFollowups?: string[];
  requiresHumanReview?: boolean;
  estimatedSavings: CostAmount;
  proposedAt: string;
}

export interface CostRemediationsResponse {
  remediations: CostRemediationPlan[];
}

export interface BudgetUpsertRequest {
  id: string;
  name: string;
  scope: CostScope;
  period: 'monthly' | 'quarterly' | 'annual';
  capMinorUnits: number;
  currency: string;
  warnThresholdBP: number;
}
