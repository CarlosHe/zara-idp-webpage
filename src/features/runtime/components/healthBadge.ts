import type { RuntimeWorkloadHealth } from '../types';

// Maps a runtime health state to a CVA variant on `<Badge>`. Centralised
// so the workload list, the SLO panel, and the home dashboard all show
// the same colour for the same state.
export type HealthBadgeVariant = 'success' | 'warning' | 'danger' | 'default';

export function healthVariant(health: RuntimeWorkloadHealth): HealthBadgeVariant {
  switch (health) {
    case 'Healthy':
      return 'success';
    case 'Degraded':
      return 'warning';
    case 'Unhealthy':
      return 'danger';
    default:
      return 'default';
  }
}
