import type { HealthStatus, SyncStatus, RiskLevel, ApprovalStatus, EventSeverity } from '@/shared/types';

// Health status colors and labels
export const healthStatusConfig: Record<HealthStatus, { color: string; bgColor: string; label: string }> = {
  Healthy: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', label: 'Healthy' },
  Progressing: { color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Progressing' },
  Degraded: { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'Degraded' },
  Unknown: { color: 'text-gray-400', bgColor: 'bg-gray-500/20', label: 'Unknown' },
  Suspended: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Suspended' },
};

// Sync status colors
export const syncStatusConfig: Record<SyncStatus, { color: string; bgColor: string; label: string }> = {
  Synced: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', label: 'Synced' },
  OutOfSync: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', label: 'Out of Sync' },
  Unknown: { color: 'text-gray-400', bgColor: 'bg-gray-500/20', label: 'Unknown' },
};

// Risk level colors
export const riskLevelConfig: Record<RiskLevel, { color: string; bgColor: string; label: string }> = {
  low: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', label: 'Low' },
  medium: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Medium' },
  high: { color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: 'High' },
  critical: { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'Critical' },
};

// Approval status colors
export const approvalStatusConfig: Record<ApprovalStatus, { color: string; bgColor: string; label: string }> = {
  pending: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Pending' },
  approved: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', label: 'Approved' },
  rejected: { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'Rejected' },
  expired: { color: 'text-gray-400', bgColor: 'bg-gray-500/20', label: 'Expired' },
};

// Event severity colors
export const severityConfig: Record<EventSeverity, { color: string; bgColor: string; label: string }> = {
  info: { color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Info' },
  warning: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Warning' },
  critical: { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'Critical' },
};

// Resource kind icons (Lucide icon names)
export const resourceKindIcons: Record<string, string> = {
  Application: 'Box',
  Database: 'Database',
  Namespace: 'Folder',
  Secret: 'KeyRound',
  ConfigMap: 'FileJson',
  Service: 'Network',
  Ingress: 'Globe',
  Team: 'Users',
  RuntimePolicy: 'Shield',
  BusinessDomain: 'Building',
  Policy: 'FileCheck',
  Approval: 'CheckCircle',
};
