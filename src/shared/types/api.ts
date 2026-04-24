// API Types - matches the Go backend types
export type ResourceKind =
  | 'Application'
  | 'Database'
  | 'Namespace'
  | 'Secret'
  | 'ConfigMap'
  | 'Service'
  | 'Ingress'
  | 'Team'
  | 'RuntimePolicy'
  | 'BusinessDomain'
  | 'Policy'
  | 'Approval';

export type HealthStatus = 'Healthy' | 'Progressing' | 'Degraded' | 'Unknown' | 'Suspended';

export type SyncStatus = 'Synced' | 'OutOfSync' | 'Unknown';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type EventSeverity = 'info' | 'warning' | 'critical';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Resource {
  id: string;
  kind: ResourceKind;
  metadata: {
    name: string;
    namespace: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
  };
  spec: Record<string, unknown>;
  status: string;
  provider?: string;
  version: number;
  generation?: number;
  createdAt: string;
  updatedAt: string;
  conditions?: Array<{
    type: string;
    status: string;
    reason?: string;
    message?: string;
  }>;
  health?: {
    status: string;
    lastCheck?: string;
  };
  // Legacy fields for backward compatibility
  namespace?: string;
  name?: string;
  healthStatus?: HealthStatus;
  syncStatus?: SyncStatus;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  ownership?: ResourceOwnership;
}

export interface ResourceOwnership {
  teamRef: string;
  serviceOwner: string;
  dataOwner: string;
  criticality: 'high' | 'medium' | 'low';
  tier: number;
  costCenter: string;
}

export interface ResourceEvent {
  id: string;
  type: 'Normal' | 'Warning';
  reason: string;
  message: string;
  count: number;
  firstTimestamp: string;
  lastTimestamp: string;
}

export interface ResourceDependency {
  sourceKind: ResourceKind;
  sourceNamespace: string;
  sourceName: string;
  targetKind: ResourceKind;
  targetNamespace: string;
  targetName: string;
  dependencyType: 'hard' | 'soft';
}

export interface Namespace {
  id: string;
  name: string;
  description: string;
  owner: {
    team: string;
    contact: string;
    slack: string;
    oncall: string;
  };
  context: {
    domain: string;
    tier: 'production' | 'staging' | 'development';
    environment: string;
    costCenter: string;
    tags: Record<string, string>;
  };
  quotas: {
    databases: number;
    roles: number;
    schemas: number;
    applications: number;
    secrets: number;
    storageGB: number;
    maxConnections: number;
  };
  status: 'active' | 'suspended' | 'archived';
  createdAt: string;
  updatedAt: string;
  // Campos adicionais retornados pelo backend
  usage?: {
    databases: number;
    roles: number;
    schemas: number;
    applications: number;
    secrets: number;
    storageGB: number;
    connections: number;
  };
}

export interface Team {
  id: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
  };
  spec: {
    displayName: string;
    description: string;
    owners?: TeamMember[];
    members?: TeamMember[];
    onCall?: {
      primaryChannel: string;
      escalation?: Array<{
        channel: string;
        delayMinutes?: number;
      }>;
      schedule?: {
        type: string;
        timezone: string;
        rotationMembers: string[];
      };
    };
    costCenter: string;
    channels: {
      alerts: string;
      general: string;
      incidents: string;
      deployments: string;
    };
    labels: Record<string, string>;
  };
  createdAt: string;
  updatedAt: string;
  // Backward compatibility fields
  slackChannel?: string;
  pagerDutyService?: string;
  members?: TeamMember[];
  onCall?: OnCallInfo;
  resourceCount?: number;
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'maintainer' | 'developer' | 'viewer';
}

export interface OnCallInfo {
  primary: TeamMember;
  secondary?: TeamMember;
  escalationPolicy: string;
}

export interface Approval {
  id: string;
  resourceKind: ResourceKind;
  resourceNamespace: string;
  resourceName: string;
  operation: 'create' | 'update' | 'delete';
  status: ApprovalStatus;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  reason: string;
  expiresAt: string;
  diff?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  resourceKind: ResourceKind;
  resourceNamespace: string;
  resourceName: string;
  actor: string;
  actorType: 'user' | 'system' | 'automation';
  result: 'success' | 'failure' | 'blocked';
  message: string;
  metadata: Record<string, string>;
}

export interface Freeze {
  id: string;
  name: string;
  reason: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  scope: FreezeScope;
  allowedOperations: string[];
  active: boolean;
}

export interface FreezeScope {
  namespaces: string[];
  teams: string[];
  kinds: ResourceKind[];
  global: boolean;
}

export interface RuntimePolicy {
  id: string;
  namespace: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: RuntimeTrigger[];
  scope: RuntimePolicyScope;
  action: RuntimeAction;
}

export interface RuntimeTrigger {
  type: 'incident' | 'freeze' | 'time' | 'manual' | 'metric';
  source: string;
  conditions: Record<string, string>;
}

export interface RuntimePolicyScope {
  namespaces: string[];
  kinds: ResourceKind[];
  labels: Record<string, string>;
  excludeLabels: Record<string, string>;
}

export interface RuntimeAction {
  type: 'freeze' | 'deny' | 'warn' | 'notify' | 'requireApproval';
  message: string;
  duration?: string;
  notifyChannels: string[];
}

export interface CorrelationResult {
  rootCause?: CorrelatedEvent;
  relatedEvents: CorrelatedEvent[];
  blastRadius: BlastRadius;
  timeline: CorrelatedEvent[];
  recommendations: string[];
}

export interface CorrelatedEvent {
  id: string;
  timestamp: string;
  source: string;
  severity: EventSeverity;
  message: string;
  resourceKind: ResourceKind;
  resourceNamespace: string;
  resourceName: string;
  correlationScore: number;
}

export interface BlastRadius {
  directlyAffected: AffectedService[];
  indirectlyAffected: AffectedService[];
  totalServicesAffected: number;
  totalTeamsAffected: number;
  riskLevel: RiskLevel;
  estimatedImpact: string;
}

export interface AffectedService {
  kind: ResourceKind;
  namespace: string;
  name: string;
  team: string;
  criticality: 'high' | 'medium' | 'low';
  dependencyPath: string[];
}

export interface HealthSummary {
  healthy: number;
  progressing: number;
  degraded: number;
  unknown: number;
  suspended: number;
}

export interface DashboardSummary {
  totalResources: number;
  healthSummary: HealthSummary;
  syncSummary: {
    synced: number;
    outOfSync: number;
    unknown: number;
  };
  pendingApprovals: number;
  activeFreezes: number;
  activeIncidents: number;
  recentEvents: ResourceEvent[];
}

export interface DashboardHealth {
  overall: string;
  components: Record<string, string>;
  resources: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
  freezes: {
    active: number;
  };
  timestamp: string;
  // Extended fields (may be populated later)
  byNamespace?: Record<string, HealthSummary>;
  byKind?: Record<ResourceKind, HealthSummary>;
  byTeam?: Record<string, HealthSummary>;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

// Filter/Query types
export interface ResourceFilters {
  kind?: ResourceKind;
  namespace?: string;
  team?: string;
  healthStatus?: HealthStatus;
  syncStatus?: SyncStatus;
  labels?: Record<string, string>;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Reconciliation and Drift Detection types
export interface ReconcileJobResponse {
  job_id: string;
  message: string;
  status: string;
}

export type DriftSeverity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ChangeType = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'MISMATCH';

export type DriftValue = string | number | boolean | null | DriftValue[] | { [key: string]: DriftValue };

export interface DriftChange {
  field: string;
  desired: DriftValue;
  observed: DriftValue;
  changeType: ChangeType;
  impact: string;
  severity: DriftSeverity;
}

export interface DriftReport {
  resource_id: string;
  resource_kind: string;
  resource_name: string;
  resource_namespace: string;
  has_drift: boolean;
  severity: DriftSeverity;
  changes: DriftChange[];
  summary: string;
  detected_at: string;
}
