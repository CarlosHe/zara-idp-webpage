// Sprint-22 / L-2201..L-2209 — frontend types for scorecards, waivers,
// remediation plans and governance KPIs. The shapes mirror the
// control-plane DTOs so the page does not have to redefine them in
// every component.

export type ScorecardSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info';

export type ScorecardLifecycle = 'draft' | 'active' | 'archived';

export type ScorecardPredicateKind =
  | 'spec.string.present'
  | 'spec.string.equals'
  | 'spec.map.not_empty'
  | 'relationship.exists'
  | 'relationship.type'
  | 'metadata.label.present'
  | 'metadata.annotation.present'
  | 'spec.lifecycle.atleast';

export interface ScorecardRule {
  code: string;
  predicate: ScorecardPredicateKind;
  field?: string;
  value?: string;
  severity: ScorecardSeverity;
  message: string;
  remediationCode?: string;
}

export interface Scorecard {
  id: string;
  slug: string;
  title: string;
  owner: string;
  description?: string;
  lifecycle: ScorecardLifecycle;
  appliesToKinds?: string[] | null;
  rules: ScorecardRule[];
  createdAt: string;
  updatedAt: string;
}

export interface ScorecardFinding {
  entityKey: string;
  scorecardSlug: string;
  code: string;
  severity: ScorecardSeverity;
  predicate: ScorecardPredicateKind;
  field?: string;
  message: string;
  remediationCode?: string;
  waived?: boolean;
  waiverId?: string;
}

export interface ScorecardEvaluation {
  entityKey: string;
  scorecardSlug: string;
  score: number;
  effectiveScore: number;
  blockedFindings: number;
  findings: ScorecardFinding[];
}

export type WaiverStatus = 'pending' | 'approved' | 'revoked';

export interface Waiver {
  id: string;
  entityKey: string;
  scorecardSlug: string;
  ruleCode: string;
  reason: string;
  owner: string;
  status: WaiverStatus;
  expiresAt: string;
  approvedBy?: string;
  approvedAt?: string;
  revokedBy?: string;
  revokedAt?: string;
  revokeReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RemediationPlan {
  findingCode: string;
  entityKey: string;
  kind: string;
  title: string;
  description: string;
  patch?: Record<string, unknown>;
  suggestedFollowups?: string[];
  requiresHumanReview?: boolean;
}

export interface PermissionSuggestion {
  code: string;
  message: string;
}

export interface PermissionProposal {
  manifest: string;
  subject: { kind: string; name: string; namespace?: string };
  suggestions: PermissionSuggestion[];
}

export interface GovernanceKPIs {
  scorecards: {
    active: number;
    draft: number;
    archived: number;
    total: number;
  };
  waivers: {
    active: number;
    expired: number;
    total: number;
  };
}
