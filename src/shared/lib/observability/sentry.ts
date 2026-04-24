// Thin Sentry wrapper. We keep the surface small so the rest of the app
// never imports `@sentry/react` directly — that indirection lets us swap
// providers, disable telemetry in tests, and, most importantly, keep the
// Sentry SDK OUT of the initial JS bundle (it's ~75 KB gzipped). Sentry
// is only loaded on demand via dynamic import when a DSN is configured;
// without a DSN the module is never fetched.

import { AppError } from '@/shared/errors';

type SentryModule = typeof import('@sentry/react');

interface SentryInitOptions {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
}

let initialized = false;
let sentryPromise: Promise<SentryModule | null> | null = null;

function loadSentry(): Promise<SentryModule | null> {
  if (!sentryPromise) {
    sentryPromise = import('@sentry/react').catch((error) => {
      // The app must survive a Sentry load failure — telemetry is best-effort.
      console.warn('[zara] failed to load Sentry SDK', error);
      return null;
    });
  }
  return sentryPromise;
}

export function initSentry(options: SentryInitOptions = {}): void {
  if (initialized) return;
  const dsn = options.dsn ?? getViteEnv('VITE_SENTRY_DSN');
  if (!dsn) return; // no-op in dev / tests when DSN isn't set

  initialized = true;

  void loadSentry().then((Sentry) => {
    if (!Sentry) return;
    Sentry.init({
      dsn,
      environment: options.environment ?? getViteEnv('MODE') ?? 'development',
      release: options.release ?? getViteEnv('VITE_RELEASE'),
      tracesSampleRate: options.tracesSampleRate ?? 0.1,
    });
  });
}

export function isSentryInitialized(): boolean {
  return initialized;
}

export function logErrorToService(
  error: unknown,
  context?: Record<string, unknown>,
): void {
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

  void loadSentry().then((Sentry) => {
    if (!Sentry) return;
    Sentry.withScope((scope) => {
      scope.setTag('app.error.kind', app.kind);
      if (app.status !== undefined) scope.setTag('app.error.status', String(app.status));
      if (app.correlationId) scope.setTag('app.correlationId', app.correlationId);
      if (context) scope.setContext('context', context);
      Sentry.captureException(app);
    });
  });
}

// Test seam: allows unit tests to reset the global flag between cases.
export function _resetSentryForTests(): void {
  initialized = false;
  sentryPromise = null;
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
