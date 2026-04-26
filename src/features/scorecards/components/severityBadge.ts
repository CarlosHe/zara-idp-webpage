import type { ScorecardSeverity } from '../types';

// `severityVariant` projects a finding severity onto the shared Badge
// variant set. Keeping the projection in a single helper means the
// scorecard UI stays in lockstep with the catalog quality dashboards
// without re-implementing the colour mapping.
export function severityVariant(s: ScorecardSeverity) {
  switch (s) {
    case 'critical':
      return 'danger' as const;
    case 'high':
      return 'danger' as const;
    case 'medium':
      return 'warning' as const;
    case 'low':
      return 'info' as const;
    case 'info':
    default:
      return 'default' as const;
  }
}

export function lifecycleVariant(lifecycle: 'draft' | 'active' | 'archived') {
  switch (lifecycle) {
    case 'active':
      return 'success' as const;
    case 'draft':
      return 'warning' as const;
    case 'archived':
    default:
      return 'default' as const;
  }
}
