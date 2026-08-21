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
