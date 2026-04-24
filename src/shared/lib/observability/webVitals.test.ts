import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Metric } from 'web-vitals';
import { defaultReporter, reportWebVitals, sendToAnalytics, serializeMetric } from './webVitals';

afterEach(() => {
  vi.restoreAllMocks();
});

const METRIC: Metric = {
  name: 'LCP',
  value: 1234,
  delta: 1234,
  id: 'v3-lcp-1',
  rating: 'good',
  navigationType: 'navigate',
  entries: [],
} as Metric;

describe('serializeMetric', () => {
  it('captures name, value, rating, navigationType, timestamp', () => {
    const serialized = serializeMetric(METRIC);
    expect(serialized).toMatchObject({
      name: 'LCP',
      value: 1234,
      delta: 1234,
      id: 'v3-lcp-1',
      rating: 'good',
      navigationType: 'navigate',
    });
    expect(typeof serialized.timestamp).toBe('number');
  });
});

describe('sendToAnalytics', () => {
  it('prefers navigator.sendBeacon when available', () => {
    const sendBeacon = vi.fn(() => true);
    Object.defineProperty(window.navigator, 'sendBeacon', {
      value: sendBeacon,
      configurable: true,
      writable: true,
    });
    sendToAnalytics('/vitals', METRIC);
    expect(sendBeacon).toHaveBeenCalledOnce();
    const call = sendBeacon.mock.calls[0] as unknown as [string, Blob];
    expect(call[0]).toBe('/vitals');
    expect(call[1]).toBeInstanceOf(Blob);
  });

  it('falls back to fetch when sendBeacon returns false', () => {
    Object.defineProperty(window.navigator, 'sendBeacon', {
      value: () => false,
      configurable: true,
      writable: true,
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
    sendToAnalytics('/vitals', METRIC);
    expect(fetchSpy).toHaveBeenCalledWith(
      '/vitals',
      expect.objectContaining({ method: 'POST', keepalive: true }),
    );
  });
});

describe('defaultReporter', () => {
  it('routes to sendBeacon when an endpoint is configured', () => {
    const sendBeacon = vi.fn(() => true);
    Object.defineProperty(window.navigator, 'sendBeacon', {
      value: sendBeacon,
      configurable: true,
      writable: true,
    });
    const reporter = defaultReporter('/vitals');
    reporter(METRIC);
    expect(sendBeacon).toHaveBeenCalledOnce();
  });

  it('logs to console.info in non-production when no endpoint is configured', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const reporter = defaultReporter(undefined);
    reporter(METRIC);
    expect(infoSpy).toHaveBeenCalled();
  });
});

describe('reportWebVitals', () => {
  it('runs synchronously and does not throw when a custom reporter is provided', () => {
    // We cannot spy on the web-vitals ESM namespace (non-configurable), so
    // we validate the integration path indirectly: reportWebVitals must
    // not throw when given a custom reporter, and must accept our
    // injection point without requiring real PerformanceObserver.
    const reporter = vi.fn();
    expect(() => reportWebVitals({ reporter })).not.toThrow();
  });
});
