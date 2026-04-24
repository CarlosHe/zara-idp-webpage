import { http, HttpResponse, delay } from 'msw';

// Canonical handler set used by every test. Each handler returns the
// smallest shape the current screen needs — tests add more on demand via
// `server.use(...)` without having to rewrite the whole tree.

// MSW matches URLs after resolving them against the current origin. We
// prefix with `*` so these handlers work both when tests issue absolute
// URLs (http://localhost:3000/api/v1/...) and when the runtime resolves
// relative paths against a different origin under the jsdom base URL.
const API = '*/api/v1';

// Mutable in-memory fixture tables — tests hydrate and mutate these via
// helpers exposed from `./fixtures`. Keeping state inside this module
// means MSW reset logic (`server.resetHandlers`) doesn't have to clear
// anything manually; tests that need a fresh slate call
// `resetFixtures()` directly.

export interface ResourceFixture {
  id: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec?: Record<string, unknown>;
  status?: string;
  version: number;
}

export const fixtures = {
  resources: new Map<string, ResourceFixture>(),
};

export function resetFixtures() {
  fixtures.resources.clear();
}

export function seedResource(resource: Omit<ResourceFixture, 'id'> & { id?: string }) {
  const id =
    resource.id ??
    `${resource.kind}-${resource.metadata.namespace}-${resource.metadata.name}`;
  const next: ResourceFixture = { ...resource, id };
  fixtures.resources.set(id, next);
  return next;
}

function resourceKey(kind: string, namespace: string, name: string) {
  return `${kind}-${namespace}-${name}`;
}

export const handlers = [
  http.get(`${API}/resources`, () => {
    return HttpResponse.json({
      items: Array.from(fixtures.resources.values()),
    });
  }),

  http.get(`${API}/resources/:kind`, ({ params }) => {
    const { kind } = params;
    return HttpResponse.json({
      items: Array.from(fixtures.resources.values()).filter((r) => r.kind === kind),
    });
  }),

  http.get(`${API}/resources/:kind/:namespace/:name`, ({ params }) => {
    const id = resourceKey(String(params.kind), String(params.namespace), String(params.name));
    const found = fixtures.resources.get(id);
    if (!found) {
      return HttpResponse.json(
        { message: 'not found', correlationId: 'test-corr-404' },
        { status: 404 },
      );
    }
    return HttpResponse.json(found);
  }),

  http.post(`${API}/resources`, async ({ request }) => {
    const body = (await request.json()) as Partial<ResourceFixture> & {
      kind: string;
      name?: string;
      namespace?: string;
    };
    await delay(5);
    const resource = seedResource({
      kind: body.kind,
      metadata: {
        name: body.name ?? body.metadata?.name ?? 'unnamed',
        namespace: body.namespace ?? body.metadata?.namespace ?? 'default',
        labels: body.metadata?.labels,
        annotations: body.metadata?.annotations,
      },
      spec: body.spec,
      status: 'Pending',
      version: 1,
    });
    return HttpResponse.json(resource, { status: 201 });
  }),

  http.put(`${API}/resources/:kind/:namespace/:name`, async ({ params, request }) => {
    const id = resourceKey(String(params.kind), String(params.namespace), String(params.name));
    const found = fixtures.resources.get(id);
    if (!found) {
      return HttpResponse.json(
        { message: 'not found', correlationId: 'test-corr-404' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as Partial<ResourceFixture>;
    const updated: ResourceFixture = {
      ...found,
      ...body,
      metadata: { ...found.metadata, ...body.metadata },
      version: found.version + 1,
    };
    fixtures.resources.set(id, updated);
    return HttpResponse.json(updated);
  }),

  http.delete(`${API}/resources/:kind/:namespace/:name`, ({ params }) => {
    const id = resourceKey(String(params.kind), String(params.namespace), String(params.name));
    fixtures.resources.delete(id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete(`${API}/resources/:id`, ({ params }) => {
    fixtures.resources.delete(String(params.id));
    return new HttpResponse(null, { status: 204 });
  }),

  // Default health/dashboard stubs so feature modules that eagerly fetch
  // summaries don't raise onUnhandledRequest errors.

  http.get(`${API}/dashboard/summary`, () =>
    HttpResponse.json({ resources: 0, namespaces: 0, teams: 0, clusters: 0 }),
  ),

  http.get(`${API}/audit`, () => HttpResponse.json({ items: [] })),
  http.get(`${API}/audit-log`, () => HttpResponse.json({ items: [] })),
  http.get(`${API}/approvals`, () => HttpResponse.json({ items: [] })),
  http.get(`${API}/freezes`, () => HttpResponse.json({ items: [] })),
  http.get(`${API}/policies`, () => HttpResponse.json({ items: [] })),
  http.get(`${API}/namespaces`, () => HttpResponse.json({ items: [] })),
  http.get(`${API}/teams`, () => HttpResponse.json({ items: [] })),
  http.get(`${API}/clusters`, () => HttpResponse.json({ items: [] })),
  http.get(`${API}/business-domains`, () => HttpResponse.json({ items: [] })),
  http.get(`${API}/analytics/summary`, () => HttpResponse.json({ series: [] })),
];
