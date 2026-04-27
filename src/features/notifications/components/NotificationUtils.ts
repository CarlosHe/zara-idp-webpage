// Sprint-25 / L-2504 — presentation-only helpers shared across the
// notifications feature.

import type {
  NotificationChannel,
  NotificationSeverity,
} from '../types/notifications';

export const SEVERITY_LABEL: Record<NotificationSeverity, string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
};

export const SEVERITY_TONE: Record<NotificationSeverity, string> = {
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  critical: 'border-red-500/40 bg-red-500/10 text-red-300',
};

export const SEVERITY_DOT: Record<NotificationSeverity, string> = {
  info: 'bg-sky-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-400',
};

export const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  in_app: 'In-app',
  webhook: 'Webhook',
  email: 'Email',
  slack: 'Slack',
  teams: 'Teams',
  pagerduty: 'PagerDuty',
};

export const ALL_CHANNELS: NotificationChannel[] = [
  'in_app',
  'webhook',
  'email',
  'slack',
  'teams',
  'pagerduty',
];

export const NOTIFICATION_SOURCES = [
  '*',
  'approval',
  'changeset',
  'drift',
  'scorecard',
  'plugin',
  'incident',
  'slo_burn',
  'freeze',
  'system',
] as const;
