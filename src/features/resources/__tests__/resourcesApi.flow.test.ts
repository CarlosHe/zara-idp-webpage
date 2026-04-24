import { describe, expect, it, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import type { Middleware } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/shared/lib/api';
import { resourcesApi } from '../services/resourcesApi';
import { resetFixtures, seedResource } from '../../../../tests/mocks/handlers';

// Feature-level integration test: exercises the RTK Query endpoints end
// to end through the real reducer + middleware chain, with MSW providing
// the HTTP layer. No React rendering here — we observe the cache
// directly because that is the public contract of `<Feature />`Api hooks.

function createIntegrationStore() {
  const store = configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }).concat(baseApi.middleware as Middleware),
  });
  setupListeners(store.dispatch);
  return store;
}

beforeEach(() => {
  resetFixtures();
});

describe('resources feature — list → create → update → delete', () => {
  it('runs the full CRUD flow against MSW and keeps the RTK cache coherent', async () => {
    seedResource({
      kind: 'Deployment',
      metadata: { name: 'api', namespace: 'platform' },
      status: 'Ready',
      version: 1,
    });

    const store = createIntegrationStore();

    const listPromise = store.dispatch(
      resourcesApi.endpoints.listResources.initiate(),
    );
    const initial = await listPromise.unwrap();
    expect(initial).toHaveLength(1);
    expect(initial[0].name).toBe('api');
    listPromise.unsubscribe();

    // Create
    const created = await store
      .dispatch(
        resourcesApi.endpoints.createResource.initiate({
          kind: 'Service',
          name: 'web',
          namespace: 'platform',
          spec: { type: 'ClusterIP' },
        }),
      )
      .unwrap();
    expect(created).toMatchObject({
      kind: 'Service',
      metadata: { name: 'web', namespace: 'platform' },
    });

    // Re-fetch — the create mutation invalidates Resource/LIST.
    const afterCreate = await store
      .dispatch(resourcesApi.endpoints.listResources.initiate(undefined, { forceRefetch: true }))
      .unwrap();
    expect(afterCreate).toHaveLength(2);
    expect(afterCreate.map((r) => r.name).sort()).toEqual(['api', 'web']);

    // Update
    const updated = await store
      .dispatch(
        resourcesApi.endpoints.updateResource.initiate({
          key: { kind: 'Service', namespace: 'platform', name: 'web' },
          body: { spec: { type: 'LoadBalancer' } },
        }),
      )
      .unwrap();
    expect(updated.spec).toMatchObject({ type: 'LoadBalancer' });

    // Delete
    await store
      .dispatch(
        resourcesApi.endpoints.deleteResource.initiate({
          kind: 'Service',
          namespace: 'platform',
          name: 'web',
        }),
      )
      .unwrap();

    const afterDelete = await store
      .dispatch(resourcesApi.endpoints.listResources.initiate(undefined, { forceRefetch: true }))
      .unwrap();
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].name).toBe('api');
  });

  it('maps a 404 on getResource into a FetchBaseQuery error with the status', async () => {
    const store = createIntegrationStore();
    const result = await store.dispatch(
      resourcesApi.endpoints.getResource.initiate({
        kind: 'Pod',
        namespace: 'platform',
        name: 'nope',
      }),
    );
    expect(result.isError).toBe(true);
    if ('status' in (result.error ?? {})) {
      expect((result.error as { status: number }).status).toBe(404);
    }
  });
});
