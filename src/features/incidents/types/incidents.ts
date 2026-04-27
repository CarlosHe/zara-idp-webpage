// Sprint-25 / L-2505..L-2507 — frontend types for the incident console.
// Mirrors the backend `domain/incidents` aggregate 1:1.

export type IncidentSeverity = 'sev1' | 'sev2' | 'sev3' | 'sev4';

export type IncidentState = 'open' | 'acknowledged' | 'mitigated' | 'resolved';

export type IncidentEventKind =
  | 'opened'
  | 'acknowledged'
  | 'mitigated'
  | 'resolved'
  | 'note'
  | 'changeset'
  | 'telemetry'
  | 'runbook';

export interface AffectedService {
  name: string;
  namespace?: string;
  owner?: string;
}

export interface IncidentTimelineEvent {
  sequence: number;
  kind: IncidentEventKind;
  title: string;
  message?: string;
  actor?: string;
  occurredAt: string;
  references?: Record<string, string>;
}

export interface Incident {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  severity: IncidentSeverity;
  state: IncidentState;
  source: string;
  externalId?: string;
  affected: AffectedService[];
  owners: string[];
  tags: string[];
  openedAt: string;
  acknowledgedAt?: string;
  mitigatedAt?: string;
  resolvedAt?: string;
  updatedAt: string;
  sloImpact?: string;
  linkedChangeSets: string[];
  runbooks: string[];
  timeline: IncidentTimelineEvent[];
  mttrSeconds?: number;
}

export interface IncidentListResponse {
  incidents: Incident[];
}
