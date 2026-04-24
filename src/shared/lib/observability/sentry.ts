// Thin Sentry wrapper. We keep the surface small so the rest of the app
// never imports `@sentry/react` directly — that indirection lets us swap
// providers, disable telemetry in tests, and avoid pulling Sentry into
// Vitest runs (its browser bundles are heavy and don't play well with
// jsdom). Init is idempotent and a no-op when no DSN is configured.

import * as Sentry from '@sentry/react';
import { AppError } from '@/shared/errors';

interface SentryInitOptions {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
}

let initialized = false;

export function initSentry(options: SentryInitOptions = {}): void {
  if (initialized) return;
  const dsn = options.dsn ?? getViteEnv('VITE_SENTRY_DSN');
  if (!dsn) return; // no-op in dev / tests when DSN isn't set

  Sentry.init({
    dsn,
    environment: options.environment ?? getViteEnv('MODE') ?? 'development',
    release: options.release ?? getViteEnv('VITE_RELEASE'),
    tracesSampleRate: options.tracesSampleRate ?? 0.1,
    // The default integrations already include BrowserTracing + Replay
    // gates that only activate when the user opts in via DSN. We keep
    // defaults and rely on `integrations` wired by the consumer if they
    // need to tune beyond that.
  });
  initialized = true;
}

export function isSentryInitialized(): boolean {
  return initialized;
}

export function logErrorToService(error: unknown, context?: Record<string, unknown>): void {
  const app = AppError.from(error);

  // Log locally first — even when Sentry is disabled we want the stack
  // trace visible to developers.

  console.error('[zara] captured error', {
    kind: app.kind,
    status: app.status,
    correlationId: app.correlationId,
    message: app.message,
    details: app.details,
    context,
  });

  if (!initialized) return;

  Sentry.withScope((scope) => {
    scope.setTag('app.error.kind', app.kind);
    if (app.status !== undefined) scope.setTag('app.error.status', String(app.status));
    if (app.correlationId) scope.setTag('app.correlationId', app.correlationId);
    if (context) scope.setContext('context', context);
    Sentry.captureException(app);
  });
}

// Test seam: allows unit tests to reset the global flag between cases.
export function _resetSentryForTests(): void {
  initialized = false;
}

function getViteEnv(key: string): string | undefined {
  // `import.meta.env` is typed per-project by vite/client. We read
  // defensively so this module can be imported from contexts where the
  // env hasn't been expanded (SSR harness, unit tests).
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return env?.[key];
  } catch {
    return undefined;
  }
}
