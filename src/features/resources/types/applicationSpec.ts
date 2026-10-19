// Mirrors `internal/domain/specs/application_spec.go` ApplicationSpec.
// Spec is still stored as Record<string, unknown> on Resource; use the
// helpers below when rendering Application-specific UI.

export type ApplicationPlatform = 'ecs' | 'kubernetes' | 'eks' | '';

export interface ApplicationSpec {
  name?: string;
  namespace?: string;
  description?: string;
  /** Backend JSON key is `repository_url`. */
  repository_url?: string;
  team?: string;
  contact_email?: string;
  tags?: Record<string, string>;
  oncall_slack_channel?: string;
  service_level?: 'critical' | 'high' | 'medium' | 'low' | string;
  image?: string;
  ports?: { name: string; port: number; service_port?: number; protocol?: 'TCP' | 'UDP' }[];
  command?: string[];
  args?: string[];
  env_refs?: Record<string, { kind: 'Secret' | 'ConfigMap'; name: string; key: string; optional?: boolean }>;
  env_from?: { kind: 'Secret' | 'ConfigMap'; name: string; optional?: boolean }[];
  volumes?: { name: string; config_map?: string; secret?: string; claim?: string; empty_dir?: boolean }[];
  volume_mounts?: ApplicationVolumeMount[];
  init_containers?: { name: string; image: string; command?: string[]; args?: string[]; env?: Record<string, string>; volume_mounts?: ApplicationVolumeMount[] }[];
  readiness_probe?: ApplicationProbe;
  liveness_probe?: ApplicationProbe;
  startup_probe?: ApplicationProbe;
  launch_type?: 'EC2' | 'FARGATE';
  network_mode?: 'awsvpc' | 'bridge' | 'host';
  capacity_provider_strategy?: { name: string; weight?: number; base?: number }[];
  load_balancers?: { target_group_arn: string; container_port: number }[];
  port?: number;
  replicas?: number;
  cpu?: string;
  memory?: string;
  env?: Record<string, string>;
  platform?: ApplicationPlatform | string;
  cluster?: string;
  task_family?: string;
  execution_role_arn?: string;
  task_role_arn?: string;
  subnets?: string[];
  security_groups?: string[];
  assign_public_ip?: boolean;
  log_group?: string;
  region?: string;
}

export function asApplicationSpec(spec: Record<string, unknown> | undefined | null): ApplicationSpec {
  if (!spec || typeof spec !== 'object') return {};
  return spec as ApplicationSpec;
}

/** Prefer explicit platform field; fall back to provider name heuristics. */
export function resolvePlatformLabel(
  spec: ApplicationSpec | Record<string, unknown> | undefined | null,
  provider?: string,
): string | undefined {
  const app = asApplicationSpec(spec as Record<string, unknown>);
  const platform = (app.platform || '').toString().trim().toLowerCase();
  if (platform) {
    if (platform === 'ecs') return 'ECS';
    if (platform === 'eks') return 'EKS';
    if (platform === 'kubernetes' || platform === 'k8s') return 'Kubernetes';
    return platform;
  }
  if (!provider) return undefined;
  const p = provider.toLowerCase();
  if (p.includes('ecs') || p.includes('aws')) return 'ECS';
  if (p.includes('k8s') || p.includes('kubernetes') || p.includes('eks')) return 'Kubernetes';
  return provider;
}

export interface ApplicationVolumeMount { name: string; mount_path: string; sub_path?: string; read_only?: boolean }
export interface ApplicationProbe { http_path?: string; port?: number; command?: string[]; tcp?: boolean; initial_delay_seconds?: number; period_seconds?: number; timeout_seconds?: number; failure_threshold?: number }
