import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// We install a fresh Sentry mock before importing the unit under test.
// `vi.doMock` is not hoisted (unlike `vi.mock`), so the mocked module
// takes effect only after `vi.resetModules()` + dynamic `import()`. That
// keeps the reference chain explicit and avoids ESM namespace pitfalls.

function installSentryMock() {
  const mock = {
    init: vi.fn(),
    setTag: vi.fn(),
    setContext: vi.fn(),
    captureException: vi.fn(),
    withScope: vi.fn() as ReturnType<typeof vi.fn>,
  };
  mock.withScope.mockImplementation(
    (cb: (scope: { setTag: typeof mock.setTag; setContext: typeof mock.setContext }) => void) =>
      cb({ setTag: mock.setTag, setContext: mock.setContext }),
  );
  vi.doMock('@sentry/react', () => ({
    init: mock.init,
    captureException: mock.captureException,
    withScope: mock.withScope,
  }));
  return mock;
}

async function loadSentryModule() {
  vi.resetModules();
  const mock = installSentryMock();
  const mod = await import('./sentry');
  return { mock, mod };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('initSentry', () => {
  let mocks: Awaited<ReturnType<typeof loadSentryModule>>['mock'];
  let sentryModule: Awaited<ReturnType<typeof loadSentryModule>>['mod'];

  beforeEach(async () => {
    const loaded = await loadSentryModule();
    mocks = loaded.mock;
    sentryModule = loaded.mod;
  });

  it('no-ops without a DSN', () => {
    sentryModule.initSentry({ dsn: undefined });
    expect(mocks.init).not.toHaveBeenCalled();
    expect(sentryModule.isSentryInitialized()).toBe(false);
  });

  it('boots Sentry with the supplied DSN and defaults', () => {
    sentryModule.initSentry({ dsn: 'https://example.ingest.sentry.io/1', environment: 'test' });
    expect(mocks.init).toHaveBeenCalledOnce();
    const args = mocks.init.mock.calls[0][0];
    expect(args).toMatchObject({
      dsn: 'https://example.ingest.sentry.io/1',
      environment: 'test',
      tracesSampleRate: 0.1,
    });
    expect(sentryModule.isSentryInitialized()).toBe(true);
  });

  it('is idempotent — the second call is a no-op', () => {
    sentryModule.initSentry({ dsn: 'https://example.ingest.sentry.io/1' });
    sentryModule.initSentry({ dsn: 'https://example.ingest.sentry.io/1' });
    expect(mocks.init).toHaveBeenCalledTimes(1);
  });
});

describe('logErrorToService', () => {
  let mocks: Awaited<ReturnType<typeof loadSentryModule>>['mock'];
  let sentryModule: Awaited<ReturnType<typeof loadSentryModule>>['mod'];

  beforeEach(async () => {
    const loaded = await loadSentryModule();
    mocks = loaded.mock;
    sentryModule = loaded.mod;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('always logs to the console for developer visibility', () => {
    sentryModule.logErrorToService(new Error('boom'));
    expect((console.error as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledOnce();
  });

  it('captures the error via Sentry once initialised, tagging kind + status', () => {
    sentryModule.initSentry({ dsn: 'https://example.ingest.sentry.io/1' });

    sentryModule.logErrorToService(
      { status: 403, data: { message: 'no', correlationId: 'corr-1' } },
      { screen: 'Resources' },
    );

    expect(mocks.withScope).toHaveBeenCalledOnce();
    expect(mocks.setTag).toHaveBeenCalledWith('app.error.kind', 'forbidden');
    expect(mocks.setTag).toHaveBeenCalledWith('app.error.status', '403');
    expect(mocks.setTag).toHaveBeenCalledWith('app.correlationId', 'corr-1');
    expect(mocks.setContext).toHaveBeenCalledWith('context', { screen: 'Resources' });
    expect(mocks.captureException).toHaveBeenCalledOnce();
  });

  it('does not touch Sentry when uninitialised', () => {
    sentryModule.logErrorToService(new Error('never sent'));
    expect(mocks.captureException).not.toHaveBeenCalled();
    expect(mocks.withScope).not.toHaveBeenCalled();
  });
});
