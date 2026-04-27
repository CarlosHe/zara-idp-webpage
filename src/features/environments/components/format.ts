// Sprint 27 / L-2705 — formatting helpers for the environments
// dashboard. Keeping the colour map + duration formatter co-located
// with the UI keeps the rendering stable across cards.

import type {
  EnvironmentHealth,
  EnvironmentKind,
  EnvironmentSource,
  EnvironmentState,
} from '../types/environments';

export const STATE_TONE: Record<EnvironmentState, string> = {
  pending: 'bg-slate-500/20 text-slate-200 border-slate-500/40',
  provisioning: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
  ready: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
  failed: 'bg-red-500/20 text-red-200 border-red-500/40',
  destroying: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
  destroyed: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
};

export const HEALTH_TONE: Record<EnvironmentHealth, string> = {
  unknown: 'bg-slate-500/20 text-slate-200',
  healthy: 'bg-emerald-500/20 text-emerald-200',
  degraded: 'bg-orange-500/20 text-orange-200',
};

export const KIND_LABEL: Record<EnvironmentKind, string> = {
  dev: 'Dev',
  preview: 'Preview',
  staging: 'Staging',
};

export const SOURCE_LABEL: Record<EnvironmentSource, string> = {
  manual: 'Manual',
  'ci-github': 'GitHub CI',
  'ci-gitlab': 'GitLab CI',
  'ci-bitbucket': 'Bitbucket CI',
  'golden-path': 'Golden Path',
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return dateFormatter.format(d);
}

export function formatTTL(expiresAt: string, now: Date = new Date()): string {
  if (!expiresAt) return '—';
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return '—';
  const remaining = expiry.getTime() - now.getTime();
  if (remaining <= 0) return 'Expired';
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  if (hours < 1) {
    const minutes = Math.max(1, Math.floor(remaining / (60 * 1000)));
    return `${minutes}m left`;
  }
  if (hours < 24) {
    return `${hours}h left`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

export function formatAge(createdAt: string, now: Date = new Date()): string {
  if (!createdAt) return '—';
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return '—';
  const ms = Math.max(0, now.getTime() - start.getTime());
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 1) return '<1h';
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function formatMoneyMinor(
  minorUnits: number,
  currency = 'USD',
): string {
  const value = minorUnits / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}
