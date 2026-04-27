// Sprint-24 / L-2403 helpers: presentation-only utilities the home
// cards share (severity badge tone, persona display name).

import type { HomePersona, HomeSeverity } from '../types/home';

export const SEVERITY_LABEL: Record<HomeSeverity, string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
};

export const SEVERITY_TONE: Record<HomeSeverity, string> = {
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  critical: 'border-red-500/40 bg-red-500/10 text-red-300',
};

export const SEVERITY_DOT: Record<HomeSeverity, string> = {
  info: 'bg-sky-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-400',
};

export const PERSONA_LABEL: Record<HomePersona, string> = {
  developer: 'Developer',
  platform: 'Platform engineer',
  sre: 'Site Reliability',
  security: 'Security',
  manager: 'Manager',
};

export const PERSONA_DESCRIPTION: Record<HomePersona, string> = {
  developer:
    'Build and ship services with the right Golden Path, docs, and approvals at hand.',
  platform:
    'Keep plugins healthy, governance scored, and platform changes governed by ChangeSets.',
  sre: 'Watch SLO burn, runtime drift, and incident response from one place.',
  security:
    'Stay ahead of policy violations, scorecard regressions, and risky approvals.',
  manager:
    'Track delivery flow, compliance trends, and team-wide platform adoption.',
};
