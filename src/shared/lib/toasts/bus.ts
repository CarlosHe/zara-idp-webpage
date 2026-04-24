// `publishToast` is the app-wide imperative entry point for non-React
// code (e.g. the RTK Query 401/403 interceptor) that needs to surface a
// notification. It writes directly to `toastStore` (Sprint 8) — the same
// store `<Toaster />` observes via useSyncExternalStore. Prior to
// Sprint 9 this used a CustomEvent bus on window; keeping the function
// name and payload shape means call sites didn't have to change.

import { toastStore } from '@/shared/components/ui/Toast';

export type ToastLevel = 'info' | 'success' | 'warning' | 'error';

export interface ToastPayload {
  level: ToastLevel;
  title: string;
  message?: string;
  // Correlation id from the failing request, when available. Useful to
  // copy into a bug report.
  correlationId?: string;
  durationMs?: number;
}

export function publishToast(payload: ToastPayload): string {
  const message = composeMessage(payload.message, payload.correlationId);
  return toastStore.push({
    kind: payload.level,
    title: payload.title,
    message,
    durationMs: payload.durationMs,
  });
}

function composeMessage(
  message: string | undefined,
  correlationId: string | undefined,
): string {
  const parts: string[] = [];
  if (message) parts.push(message);
  if (correlationId) parts.push(`correlation_id=${correlationId}`);
  return parts.join(' · ') || 'Unknown error';
}
