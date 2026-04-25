import { useEffect, useState } from 'react';
import type { Metric } from 'web-vitals';
import { subscribeToWebVitals } from './webVitals';

const METRIC_ORDER = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];

export function VitalsDebugPanel() {
  const [metrics, setMetrics] = useState<Record<string, Metric>>({});

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;

    return subscribeToWebVitals((metric) => {
      setMetrics((current) => ({ ...current, [metric.name]: metric }));
    });
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <aside
      aria-label="Web Vitals debug panel"
      className="fixed bottom-4 right-4 z-50 w-72 rounded-xl border border-slate-700 bg-slate-950/95 p-4 text-xs text-slate-100 shadow-2xl backdrop-blur"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Web Vitals</h2>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
          dev
        </span>
      </div>
      <dl className="space-y-2">
        {METRIC_ORDER.map((name) => {
          const metric = metrics[name];
          return (
            <div key={name} className="flex items-center justify-between gap-3">
              <dt className="font-medium text-slate-300">{name}</dt>
              <dd className={ratingClass(metric?.rating)}>
                {metric ? formatMetric(metric) : 'waiting'}
              </dd>
            </div>
          );
        })}
      </dl>
    </aside>
  );
}

function formatMetric(metric: Metric): string {
  if (metric.name === 'CLS') return metric.value.toFixed(3);
  return `${Math.round(metric.value)} ms`;
}

function ratingClass(rating: Metric['rating'] | undefined): string {
  const base = 'rounded px-2 py-0.5 font-mono';
  if (rating === 'good') return `${base} bg-emerald-500/15 text-emerald-200`;
  if (rating === 'needs-improvement') return `${base} bg-amber-500/15 text-amber-200`;
  if (rating === 'poor') return `${base} bg-red-500/15 text-red-200`;
  return `${base} bg-slate-800 text-slate-400`;
}
