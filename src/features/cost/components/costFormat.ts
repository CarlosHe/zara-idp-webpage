// Sprint-26 / L-2605 — locale-aware money + percent formatting.
//
// The dashboard renders the same number across charts, tables, and
// stat cards. Centralising the formatter here keeps the rendering
// stable when the deployment switches to a non-USD currency.

import type {
  AnomalyKind,
  AnomalySeverity,
  BudgetState,
  CostAmount,
} from '../types/cost';

const formatterCache = new Map<string, Intl.NumberFormat>();

function getMoneyFormatter(currency: string): Intl.NumberFormat {
  const key = `money:${currency}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;
  const fmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 2,
  });
  formatterCache.set(key, fmt);
  return fmt;
}

export function formatMoney(amount?: CostAmount): string {
  if (!amount) return '—';
  return getMoneyFormatter(amount.currency || 'USD').format(amount.value);
}

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatPercent(share: number): string {
  if (Number.isNaN(share)) return '—';
  return percentFormatter.format(share);
}

export function formatBP(bp: number): string {
  return formatPercent(bp / 10000);
}

export const SEVERITY_TONE: Record<AnomalySeverity, string> = {
  critical: 'bg-red-500/20 text-red-200 border-red-500/40',
  high: 'bg-orange-500/20 text-orange-200 border-orange-500/40',
  medium: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
  low: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
  info: 'bg-slate-500/20 text-slate-200 border-slate-500/40',
};

export const ANOMALY_TONE: Record<AnomalyKind, string> = {
  spike: 'bg-orange-500/20 text-orange-200',
  rising: 'bg-amber-500/20 text-amber-200',
  idle: 'bg-sky-500/20 text-sky-200',
  budget: 'bg-red-500/20 text-red-200',
  missing: 'bg-slate-500/20 text-slate-200',
};

export const BUDGET_STATE_TONE: Record<BudgetState, string> = {
  healthy: 'bg-emerald-500/20 text-emerald-200',
  warning: 'bg-amber-500/20 text-amber-200',
  breach: 'bg-red-500/20 text-red-200',
};
