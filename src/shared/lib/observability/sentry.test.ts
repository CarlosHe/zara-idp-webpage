import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetSentryForTests,
  _setSentryLoaderForTests,
  initSentry,
  isSentryInitialized,
  logErrorToService,
  type SentryModule,
} from './sentry';

// Sprint 10 (L-1009): Sentry is lazy-loaded via dynamic import to keep
// the SDK out of the critical-path bundle. The test seam
// `_setSentryLoaderForTests` swaps the loader so unit tests don't have
// to wrestle with ESM-module mocking for a dynamic `import()`.

interface SentryMocks {
  init: ReturnType<typeof vi.fn<(options: Record<string, unknown>) => void>>;
  setTag: ReturnType<typeof vi.fn<(key: string, value: string) => void>>;
  setContext: ReturnType<typeof vi.fn<(key: string, value: Record<string, unknown>) => void>>;
  captureException: ReturnType<typeof vi.fn<(error: unknown) => void>>;
  withScope: ReturnType<typeof vi.fn<(cb: Parameters<SentryModule['withScope']>[0]) => void>>;
}

function installSentryStub(): SentryMocks {
  const mocks: SentryMocks = {
    init: vi.fn(),
    setTag: vi.fn(),
    setContext: vi.fn(),
    captureException: vi.fn(),
    withScope: vi.fn(),
  };
  mocks.withScope.mockImplementation(
    (cb: (scope: { setTag: typeof mocks.setTag; setContext: typeof mocks.setContext }) => void) =>
      cb({ setTag: mocks.setTag, setContext: mocks.setContext }),
  );
  const stub: SentryModule = {
    init: (options) => {
      mocks.init(options);
    },
    withScope: (cb) => {
      mocks.withScope(cb);
    },
    captureException: (error) => {
      mocks.captureException(error);
    },
  };
  _setSentryLoaderForTests(async () => stub);
  return mocks;
}

// Two awaits of `Promise.resolve()` flush both (1) the injected async
// loader AND (2) the `.then(Sentry => …)` continuation in the SUT.
async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => {
  vi.restoreAllMocks();
  _resetSentryForTests();
  _setSentryLoaderForTests(null);
});

describe('initSentry', () => {
  let mocks: SentryMocks;

  beforeEach(() => {
    _resetSentryForTests();
    mocks = installSentryStub();
  });

  it('no-ops without a DSN', async () => {
    initSentry({ dsn: undefined });
    await flushMicrotasks();
    expect(mocks.init).not.toHaveBeenCalled();
    expect(isSentryInitialized()).toBe(false);
  });

  it('boots Sentry with the supplied DSN and defaults', async () => {
    initSentry({ dsn: 'https://example.ingest.sentry.io/1', environment: 'test' });
    await flushMicrotasks();
    expect(mocks.init).toHaveBeenCalledOnce();
    const args = mocks.init.mock.calls[0]![0];
    expect(args).toMatchObject({
      dsn: 'https://example.ingest.sentry.io/1',
      environment: 'test',
      tracesSampleRate: 0.1,
    });
    expect(isSentryInitialized()).toBe(true);
  });

  it('is idempotent — the second call is a no-op', async () => {
    initSentry({ dsn: 'https://example.ingest.sentry.io/1' });
    initSentry({ dsn: 'https://example.ingest.sentry.io/1' });
    await flushMicrotasks();
    expect(mocks.init).toHaveBeenCalledTimes(1);
  });
});

describe('logErrorToService', () => {
  let mocks: SentryMocks;

  beforeEach(() => {
    _resetSentryForTests();
    mocks = installSentryStub();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('always logs to the console for developer visibility', () => {
    logErrorToService(new Error('boom'));
    expect(console.error as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledOnce();
  });

  it('captures the error via Sentry once initialised, tagging kind + status', async () => {
    initSentry({ dsn: 'https://example.ingest.sentry.io/1' });
    await flushMicrotasks();

    logErrorToService(
      { status: 403, data: { message: 'no', correlationId: 'corr-1' } },
      { screen: 'Resources' },
    );
    await flushMicrotasks();

    expect(mocks.withScope).toHaveBeenCalledOnce();
    expect(mocks.setTag).toHaveBeenCalledWith('app.error.kind', 'forbidden');
    expect(mocks.setTag).toHaveBeenCalledWith('app.error.status', '403');
    expect(mocks.setTag).toHaveBeenCalledWith('app.correlationId', 'corr-1');
    expect(mocks.setContext).toHaveBeenCalledWith('context', { screen: 'Resources' });
    expect(mocks.captureException).toHaveBeenCalledOnce();
  });

  it('does not touch Sentry when uninitialised', async () => {
    logErrorToService(new Error('never sent'));
    await flushMicrotasks();
    expect(mocks.captureException).not.toHaveBeenCalled();
    expect(mocks.withScope).not.toHaveBeenCalled();
  });
});
