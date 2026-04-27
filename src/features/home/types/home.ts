// Sprint-24 / L-2401..L-2407 — frontend types for the personalised
// home snapshot. The shape mirrors the backend `domain/home.Snapshot`
// 1:1 so the API contract stays in lockstep across stacks.
//
// Anything optional on the backend is also optional here. Slices are
// always defined (the backend never returns null).

export type HomePersona =
  | 'developer'
  | 'platform'
  | 'sre'
  | 'security'
  | 'manager';

export type HomeSeverity = 'info' | 'warning' | 'critical';

export interface HomeActionRef {
  kind: string;
  id: string;
  path: string;
}

export interface HomeApprovalItem {
  id: string;
  changeSetId?: string;
  title: string;
  risk: string;
  severity: HomeSeverity;
  environment?: string;
  requestedBy?: string;
  namespace?: string;
  waitingForYou: boolean;
  createdAt: string;
  action: HomeActionRef;
}

export interface HomeAlertItem {
  id: string;
  source: string;
  title: string;
  message: string;
  severity: HomeSeverity;
  namespace?: string;
  createdAt: string;
  action: HomeActionRef;
}

export interface HomeActivityItem {
  id: string;
  kind: string;
  title: string;
  actor?: string;
  namespace?: string;
  status?: string;
  occurredAt: string;
  action: HomeActionRef;
}

export interface HomeServiceCard {
  name: string;
  namespace?: string;
  owner?: string;
  lifecycle?: string;
  health: HomeSeverity;
  action: HomeActionRef;
}

export interface HomeQuickLink {
  id: string;
  kind: string;
  title: string;
  description?: string;
  action: HomeActionRef;
}

export interface HomeRecommendation {
  id: string;
  kind: string;
  title: string;
  reason: string;
  severity: HomeSeverity;
  score: number;
  action: HomeActionRef;
}

export interface HomeCounts {
  approvals: number;
  alerts: number;
  criticalAlerts: number;
  activity: number;
  services: number;
  quickLinks: number;
  recommendations: number;
}

export interface HomeSnapshot {
  persona: HomePersona;
  subject: string;
  generatedAt: string;
  approvals: HomeApprovalItem[];
  alerts: HomeAlertItem[];
  activity: HomeActivityItem[];
  services: HomeServiceCard[];
  quickLinks: HomeQuickLink[];
  recommendations: HomeRecommendation[];
  counts: HomeCounts;
  degraded: string[];
}

export interface HomeActionEvent {
  widget: string;
  kind: string;
  id?: string;
}
