import { describe, expect, it } from 'vitest';
import { normalizeResource, normalizeResources, unwrapItems } from './normalizers';

describe('unwrapItems', () => {
  it('returns items array untouched when already an array', () => {
    expect(unwrapItems([{ id: 1 }])).toEqual([{ id: 1 }]);
  });

  it('unwraps a .items envelope', () => {
    expect(unwrapItems({ items: [{ id: 1 }, { id: 2 }] })).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('returns an empty array when neither shape matches', () => {
    expect(unwrapItems(null)).toEqual([]);
    expect(unwrapItems(undefined)).toEqual([]);
    expect(unwrapItems({ weird: 'shape' })).toEqual([]);
  });
});

describe('normalizeResource', () => {
  it('reads metadata first and falls back to top-level fields', () => {
    const normalized = normalizeResource({
      kind: 'Deployment',
      metadata: {
        name: 'api',
        namespace: 'platform',
        labels: { team: 'core' },
        annotations: { owner: 'alice' },
      },
      spec: { replicas: 3 },
      status: 'Ready',
      version: 7,
    });
    expect(normalized.kind).toBe('Deployment');
    expect(normalized.name).toBe('api');
    expect(normalized.namespace).toBe('platform');
    expect(normalized.labels).toEqual({ team: 'core' });
    expect(normalized.version).toBe(7);
  });

  it('defaults namespace to "default" when absent', () => {
    const r = normalizeResource({ kind: 'ConfigMap', metadata: { name: 'cm' } });
    expect(r.namespace).toBe('default');
  });

  it('derives a stable id when the payload lacks one', () => {
    const r = normalizeResource({
      kind: 'Service',
      metadata: { name: 'web', namespace: 'prod' },
    });
    expect(r.id).toBe('Service-prod-web');
  });

  it('maps status enum to health enum', () => {
    const ready = normalizeResource({ kind: 'Pod', metadata: { name: 'p' }, status: 'Ready' });
    const notReady = normalizeResource({
      kind: 'Pod',
      metadata: { name: 'p' },
      status: 'NotReady',
    });
    expect(ready.healthStatus).toBe('Healthy');
    expect(notReady.healthStatus).toBe('Degraded');
  });

  it('tolerates a numeric-ish string version', () => {
    const r = normalizeResource({ kind: 'Pod', metadata: { name: 'p' }, version: '42' });
    expect(r.version).toBe(42);
  });
});

describe('normalizeResources', () => {
  it('maps each element through normalizeResource', () => {
    const list = normalizeResources([
      { kind: 'A', metadata: { name: 'a' } },
      { kind: 'B', metadata: { name: 'b' } },
    ]);
    expect(list).toHaveLength(2);
    expect(list[0].name).toBe('a');
    expect(list[1].kind).toBe('B');
  });
});
