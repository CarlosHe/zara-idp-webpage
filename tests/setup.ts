import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Mock Service Worker boots once for the whole suite. We fail requests
// that don't match a registered handler so tests never silently hit a
// real endpoint and so the failure message tells us which URL the test
// forgot to mock.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

// Polyfills / globals jsdom doesn't ship by default. RTK Query relies on
// AbortSignal + fetch being available; web-vitals calls `performance.now`.
// jsdom ships all of those — the code below only patches the rare gaps.

if (!('matchMedia' in window)) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

// Silence the ubiquitous jsdom `navigation not implemented` warning —
// tests that exercise redirection stub `window.location` explicitly.
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });

// Reset the toast store between tests so assertions on a clean list of
// toasts don't bleed across specs.
import { toastStore } from '@/shared/components/ui/Toast';
afterEach(() => toastStore.clear());

// Reset the Sentry "initialized" flag so unit tests that exercise the
// wrapper start from a clean slate.
import { _resetSentryForTests } from '@/shared/lib/observability';
afterEach(() => _resetSentryForTests());
