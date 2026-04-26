// Runtime read-model shapes returned by the control plane (Sprint-21
// L-2102). These are public types: the page, the panels, and the
// hooks all share them, so any backend tweak surfaces through this
// file instead of getting redefined per file.

export type RuntimeWorkloadKind =
  | 'Deployment'
  | 'StatefulSet'
  | 'DaemonSet'
  | 'CronJob'
  | 'Job';

export type RuntimeWorkloadHealth =
  | 'Healthy'
  | 'Degraded'
  | 'Unhealthy'
  | 'Unknown';

export interface RuntimeReplicas {
  desired: number;
  ready: number;
  available: number;
  updated: number;
}

export interface RuntimeCatalogLink {
  type: string;
  kind: string;
  namespace: string;
  name: string;
}

export interface RuntimeWorkload {
  clusterId: string;
  namespace: string;
  name: string;
  kind: RuntimeWorkloadKind;
  image: string;
  replicas: RuntimeReplicas;
  health: RuntimeWorkloadHealth;
  generation: number;
  revision: string;
  updatedAt: string;
  labels?: Record<string, string>;
  catalog: RuntimeCatalogLink[];
}

export type RuntimePodPhase =
  | 'Pending'
  | 'Running'
  | 'Succeeded'
  | 'Failed'
  | 'Unknown';

export interface RuntimePod {
  clusterId: string;
  namespace: string;
  name: string;
  workload: string;
  workloadKind: RuntimeWorkloadKind;
  node: string;
  phase: RuntimePodPhase;
  ready: boolean;
  restarts: number;
  image: string;
  startedAt: string;
}

export interface RuntimeEvent {
  clusterId: string;
  namespace: string;
  involvedId: string;
  kind: string;
  type: 'Normal' | 'Warning';
  reason: string;
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
}

export interface RuntimeLogLine {
  timestamp: string;
  container: string;
  stream: 'stdout' | 'stderr';
  line: string;
}

export interface RuntimeDeploy {
  clusterId: string;
  namespace: string;
  workload: string;
  workloadKind: RuntimeWorkloadKind;
  revision: string;
  image: string;
  replicas: number;
  deployedAt: string;
  changeSetId: string;
  status: string;
}

export interface RuntimeInventory {
  clusterId: string;
  namespaces: string[];
  workloads: RuntimeWorkload[];
  pods: RuntimePod[];
  events: RuntimeEvent[];
  capturedAt: string;
}

export interface RuntimeActionResponse {
  changeSetId: string;
  requiresApproval: boolean;
  action: string;
  message: string;
}

export interface RuntimeRestartRequest {
  clusterId: string;
  namespace: string;
  workload: string;
  workloadKind: RuntimeWorkloadKind;
  reason?: string;
}

export interface RuntimeScaleRequest extends RuntimeRestartRequest {
  replicas: number;
}

export interface RuntimeRollbackRequest extends RuntimeRestartRequest {
  targetRevision: string;
}
