// Sprint 27 / L-2705 — frontend types for the dev environments
// dashboard. Mirrors the backend `domain/environments` aggregate.

export type EnvironmentKind = 'dev' | 'preview' | 'staging';

export type EnvironmentState =
  | 'pending'
  | 'provisioning'
  | 'ready'
  | 'failed'
  | 'destroying'
  | 'destroyed';

export type EnvironmentHealth = 'unknown' | 'healthy' | 'degraded';

export type EnvironmentSource =
  | 'manual'
  | 'ci-github'
  | 'ci-gitlab'
  | 'ci-bitbucket'
  | 'golden-path';

export type TimelineEventKind =
  | 'created'
  | 'provisioning'
  | 'ready'
  | 'failed'
  | 'destroying'
  | 'destroyed'
  | 'ttl-extended'
  | 'health-change'
  | 'note'
  | 'resource'
  | 'cost';

export interface EnvironmentResource {
  kind: string;
  provider: string;
  identifier: string;
  url?: string;
}

export interface EnvironmentTimelineEvent {
  sequence: number;
  kind: TimelineEventKind;
  title: string;
  detail?: string;
  actor?: string;
  occurredAt: string;
  metadata?: Record<string, string>;
}

export interface EnvironmentSpend {
  minorUnits: number;
  currency: string;
  windowStart: string;
  windowEnd: string;
  projectedDailyMinorUnits: number;
}

export interface Environment {
  id: string;
  slug: string;
  kind: EnvironmentKind;
  state: EnvironmentState;
  health: EnvironmentHealth;
  healthMessage?: string;
  owner: string;
  team: string;
  catalogEntity?: string;
  source: EnvironmentSource;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  destroyedAt?: string | null;
  resources: EnvironmentResource[];
  timeline: EnvironmentTimelineEvent[];
  annotations?: Record<string, string>;
  latestSpend?: EnvironmentSpend | null;
  version: number;
}

export interface EnvironmentInventory {
  totalEnvironments: number;
  byState: Record<string, number>;
  byKind: Record<string, number>;
  bySource: Record<string, number>;
  staleCount: number;
  expiringSoonCount: number;
  projectedDailySpendMinorUnits: number;
  currency?: string;
}

export interface EnvironmentListResponse {
  environments: Environment[];
  inventory: EnvironmentInventory;
}

export interface ProvisionRequest {
  slug: string;
  kind: EnvironmentKind;
  owner: string;
  team: string;
  catalogEntity: string;
  source: EnvironmentSource;
  ttlHours: number;
  annotations?: Record<string, string>;
  resources?: EnvironmentResource[];
}

export interface ProvisionResponse {
  environment: Environment;
  changeSetId: string;
}

export interface DestroyRequest {
  reason?: string;
}

export interface DestroyResponse {
  environment: Environment;
  changeSetId?: string;
}

export interface ExtendRequest {
  newExpiresAt: string;
  reason?: string;
}
