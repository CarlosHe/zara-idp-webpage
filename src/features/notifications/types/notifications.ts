// Sprint-25 / L-2501..L-2504 — frontend types for the notification
// inbox + preferences. The shape mirrors the backend `domain/notifications`
// aggregate so the API contract stays in lockstep across stacks.

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export type NotificationChannel =
  | 'in_app'
  | 'webhook'
  | 'email'
  | 'slack'
  | 'teams'
  | 'pagerduty';

export type NotificationSource =
  | 'approval'
  | 'changeset'
  | 'drift'
  | 'scorecard'
  | 'plugin'
  | 'incident'
  | 'slo_burn'
  | 'freeze'
  | 'system';

export type NotificationDeliveryState =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'suppressed';

export interface NotificationActionRef {
  kind: string;
  id: string;
  path: string;
}

export interface NotificationRecipient {
  subject?: string;
  team?: string;
}

export interface NotificationDelivery {
  channel: NotificationChannel;
  state: NotificationDeliveryState;
  attempts: number;
  lastError?: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  recipient: NotificationRecipient;
  source: NotificationSource;
  severity: NotificationSeverity;
  title: string;
  body?: string;
  namespace?: string;
  channels: NotificationChannel[];
  deliveries: NotificationDelivery[];
  action: NotificationActionRef;
  occurredAt: string;
  createdAt: string;
  readAt?: string;
  metadata?: Record<string, string>;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unread: number;
}

export interface PreferenceRule {
  source: string;
  minSeverity?: NotificationSeverity | '';
  channels: NotificationChannel[];
  mute?: boolean;
}

export interface NotificationPreferences {
  recipient: NotificationRecipient;
  rules: PreferenceRule[];
  updatedAt: string;
}
