// Minimal toast event bus. Sprint 9 replaces it with a Zustand store +
// <Toaster />. Until then, anything that wants to surface a message fires
// a CustomEvent here; a listener in the shell renders it. Keeping the
// contract narrow (one event type, one payload shape) means the Sprint 9
// migration is mechanical — no call-site changes.

export type ToastLevel = 'info' | 'success' | 'warning' | 'error';

export interface ToastPayload {
  level: ToastLevel;
  title: string;
  message?: string;
  // Correlation id from the failing request, when available. Useful to
  // copy into a bug report.
  correlationId?: string;
}

export const TOAST_EVENT = 'zara:toast';

export function publishToast(payload: ToastPayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }));
}

export function subscribeToasts(listener: (payload: ToastPayload) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<ToastPayload>).detail;
    if (detail) listener(detail);
  };
  window.addEventListener(TOAST_EVENT, handler);
  return () => window.removeEventListener(TOAST_EVENT, handler);
}
