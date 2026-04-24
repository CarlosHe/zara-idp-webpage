// Web Vitals reporter. We capture CLS, INP, LCP, FCP, TTFB and forward
// each Metric to whatever transport the environment configures:
//   * `VITE_ANALYTICS_ENDPOINT` — POST via `navigator.sendBeacon` (falls
//     back to `fetch` when beacon is unavailable, e.g. in test runners).
//   * Otherwise, when DEV, log to `console.info` so developers can eyeball
//     regressions from the browser DevTools panel.
// Keeping the contract plain-JSON means we can point at any analytics
// backend (PostHog, Honeycomb, an internal /v1/metrics, …) without
// touching callers.

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

export type VitalsReporter = (metric: Metric) => void;

interface ReportWebVitalsOptions {
  reporter?: VitalsReporter;
  endpoint?: string;
}

export function reportWebVitals(options: ReportWebVitalsOptions = {}): void {
  const endpoint = options.endpoint ?? getViteEnv('VITE_ANALYTICS_ENDPOINT');
  const reporter = options.reporter ?? defaultReporter(endpoint);

  onCLS(reporter);
  onINP(reporter);
  onLCP(reporter);
  onFCP(reporter);
  onTTFB(reporter);
}

export function sendToAnalytics(endpoint: string, metric: Metric): void {
  const payload = serializeMetric(metric);
  const body = JSON.stringify(payload);
  const url = endpoint;

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    const sent = navigator.sendBeacon(url, blob);
    if (sent) return;
  }

  if (typeof fetch === 'function') {
    void fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body,
    }).catch(() => {
      // swallow transport errors — vitals reporting must never break the app
    });
  }
}

export function serializeMetric(metric: Metric) {
  return {
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    id: metric.id,
    rating: metric.rating,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
  };
}

function defaultReporter(endpoint: string | undefined): VitalsReporter {
  if (endpoint) return (metric) => sendToAnalytics(endpoint, metric);
  return devLogger;
}

const devLogger: VitalsReporter = (metric) => {
  const mode = getViteEnv('MODE');
  if (mode === 'production') return;

  console.info('[zara] web-vitals', serializeMetric(metric));
};

function getViteEnv(key: string): string | undefined {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return env?.[key];
  } catch {
    return undefined;
  }
}
