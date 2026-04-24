import type { Resource, ResourceKind, HealthStatus, SyncStatus } from '@/shared/types';

// Narrow record used by the raw API before normalisation. `any` stays
// confined here — every endpoint pipes through this file and emits typed
// results to the rest of the app.
type RawResource = {
  id?: string;
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    creationTimestamp?: string;
  };
  name?: string;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  spec?: Record<string, unknown>;
  status?: string | { status?: string; [k: string]: unknown };
  version?: number | string;
  createdAt?: string;
  updatedAt?: string;
  syncStatus?: SyncStatus;
  ownership?: Resource['ownership'];
};

// Backend enum → UI enum. Kept here because it's a display concern, not
// a domain one.
const HEALTH_MAP: Record<string, HealthStatus> = {
  Ready: 'Healthy',
  NotReady: 'Degraded',
  Pending: 'Progressing',
  Unknown: 'Unknown',
  Healthy: 'Healthy',
  Degraded: 'Degraded',
  Progressing: 'Progressing',
  Suspended: 'Suspended',
};

function mapHealth(status: unknown): HealthStatus {
  if (typeof status === 'string') return HEALTH_MAP[status] ?? 'Unknown';
  return 'Unknown';
}

export function normalizeResource(raw: RawResource): Resource {
  const namespace = raw.metadata?.namespace || raw.namespace || 'default';
  const name = raw.metadata?.name || raw.name || 'unknown';
  const labels = raw.metadata?.labels || raw.labels || {};
  const annotations = raw.metadata?.annotations || raw.annotations || {};
  const statusValue =
    typeof raw.status === 'string'
      ? raw.status
      : raw.status?.status ?? 'Unknown';
  const version =
    typeof raw.version === 'number' ? raw.version : Number(raw.version) || 1;

  return {
    id: raw.id || `${raw.kind}-${namespace}-${name}`,
    kind: raw.kind as ResourceKind,
    metadata: { name, namespace, labels, annotations },
    spec: raw.spec || {},
    status: statusValue,
    version,
    createdAt: raw.createdAt || raw.metadata?.creationTimestamp || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.metadata?.creationTimestamp || new Date().toISOString(),
    namespace,
    name,
    healthStatus: mapHealth(statusValue),
    syncStatus: raw.syncStatus || 'Synced',
    labels,
    annotations,
    ownership: raw.ownership,
  };
}

export function normalizeResources(items: RawResource[] | null | undefined): Resource[] {
  if (!items) return [];
  return items.map(normalizeResource);
}

// Envelope shape used by the Zara backend: `{ items: [...], total: N }`.
// Some endpoints return bare arrays. `unwrapItems` tolerates both.
export function unwrapItems<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object' && 'items' in raw) {
    const items = (raw as { items?: T[] }).items;
    return Array.isArray(items) ? items : [];
  }
  return [];
}
