// Thin Sentry wrapper. We keep the surface small so the rest of the app
// never imports `@sentry/react` directly — that indirection lets us swap
// providers, disable telemetry in tests, and, most importantly, keep the
// Sentry SDK OUT of the initial JS bundle (it's ~143 KB gzipped). Sentry
// is only loaded on demand via dynamic import when a DSN is configured;
// without a DSN the module is never fetched.

import { AppError } from '@/shared/errors';

// Narrow surface of @sentry/react that we consume. Typed against the
// real module with `typeof import(...)` so mismatches still break the
// build; the subset is what the wrapper actually calls.
type SentryScope = {
  setTag(key: string, value: string): void;
  setContext(key: string, value: Record<string, unknown>): void;
};

type SentryModule = {
  init(options: Record<string, unknown>): void;
  withScope(cb: (scope: SentryScope) => void): void;
  captureException(error: unknown): void;
  addBreadcrumb?(breadcrumb: SentryBreadcrumb): void;
};

interface SentryBreadcrumb {
  category: string;
  message?: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
  timestamp?: number;
}

export type { SentryModule };

interface SentryInitOptions {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
}

type SentryLoader = () => Promise<SentryModule | null>;

// Default loader: dynamic import of @sentry/react. Stashed outside
// initialiseSentry so tests can swap it (see _setSentryLoaderForTests).
let loader: SentryLoader = async () => {
  try {
    const sentry = await import('@sentry/react');
    return sentry as unknown as SentryModule;
  } catch (error) {
    console.warn('[zara] failed to load Sentry SDK', error);
    return null;
  }
};

let initialized = false;
let sentryPromise: Promise<SentryModule | null> | null = null;

function loadSentry(): Promise<SentryModule | null> {
  if (!sentryPromise) {
    sentryPromise = loader();
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

export function addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
  if (!initialized) return;

  void loadSentry().then((Sentry) => {
    if (!Sentry?.addBreadcrumb) return;
    Sentry.addBreadcrumb({
      ...breadcrumb,
      timestamp: breadcrumb.timestamp ?? Date.now() / 1000,
    });
  });
}

// Test seams.
export function _resetSentryForTests(): void {
  initialized = false;
  sentryPromise = null;
}

export function _setSentryLoaderForTests(nextLoader: SentryLoader | null): void {
  loader = nextLoader ?? (async () => null);
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
