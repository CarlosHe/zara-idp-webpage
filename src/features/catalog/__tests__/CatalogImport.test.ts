import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '@/shared/lib/api';
import { catalogApi } from '../services/catalogApi';
import { parseCatalogImport } from '../catalogImport';
import { localAws, localEndpoint } from '@/features/development/localAws';
import { server } from '../../../../tests/mocks/server';

const entry = { kind: 'Resource', name: 'bucket', namespace: 'dev', spec: { owner: 'platform' } };
function store() {
  return configureStore({ reducer: { [baseApi.reducerPath]: baseApi.reducer }, middleware: (getDefault) => getDefault().concat(baseApi.middleware) });
}

describe('cloud catalog inventory', () => {
  it('rejects duplicate identities, provider manifests and invalid relationships before registration', () => {
    expect(() => parseCatalogImport(JSON.stringify([entry, entry]))).toThrow(/Duplicate/);
    expect(() => parseCatalogImport(JSON.stringify([{ ...entry, kind: 'SQSQueue' }]))).toThrow(/Invalid/);
    expect(() => parseCatalogImport(JSON.stringify([{ ...entry, relationships: [{}] }]))).toThrow(/relationships/);
    expect(parseCatalogImport(JSON.stringify([entry]))).toEqual([entry]);
  });

  it('follows catalog pages beyond 100 records', async () => {
    const offsets: number[] = [];
    server.use(http.get('*/api/v1/catalog', ({ request }) => {
      const offset = Number(new URL(request.url).searchParams.get('offset'));
      offsets.push(offset);
      return HttpResponse.json({ items: Array.from({ length: offset === 0 ? 100 : 3 }, (_, i) => ({ ...entry, key: `Resource/dev/${offset + i}`, metadata: { name: `${offset + i}`, namespace: 'dev' } })) });
    }));
    const instance = store();
    const result = await instance.dispatch(catalogApi.endpoints.listCatalogEntities.initiate()).unwrap();
    expect(result).toHaveLength(103);
    expect(offsets).toEqual([0, 100]);
    instance.dispatch(baseApi.util.resetApiState());
  });

  it('resumes imports by skipping existing registrations and preserving partial failures', async () => {
    const mutations: string[] = [];
    server.use(
      http.get('*/api/v1/catalog', () => HttpResponse.json({ items: [{ ...entry, metadata: { name: entry.name, namespace: entry.namespace } }] })),
      http.post('*/api/v1/catalog', async ({ request }) => {
        const body = await request.json() as typeof entry;
        mutations.push(body.name);
        return body.name === 'failed' ? HttpResponse.json({ error: 'denied' }, { status: 403 }) : HttpResponse.json(body, { status: 201 });
      }),
    );
    const instance = store();
    const result = await instance.dispatch(catalogApi.endpoints.importCatalogEntities.initiate({ entities: [entry, { ...entry, name: 'created' }, { ...entry, name: 'failed' }] })).unwrap();
    expect(result.created).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.failures).toHaveLength(1);
    expect(mutations).toEqual(['created', 'failed']);
    instance.dispatch(baseApi.util.resetApiState());
  });

  it('honors explicit throttling and retries the rejected registration', async () => {
    let attempts = 0;
    server.use(
      http.get('*/api/v1/catalog', () => HttpResponse.json({ items: [] })),
      http.post('*/api/v1/catalog', () => {
        attempts++;
        return attempts === 1
          ? HttpResponse.json({ retry_after: 0.1 }, { status: 429 })
          : HttpResponse.json(entry, { status: 201 });
      }),
    );
    const instance = store();
    const result = await instance.dispatch(catalogApi.endpoints.importCatalogEntities.initiate({ entities: [entry] })).unwrap();
    expect(result.created).toBe(1);
    expect(result.failures).toEqual([]);
    expect(attempts).toBe(2);
    instance.dispatch(baseApi.util.resetApiState());
  });

  it('refreshes changed registrations without rewriting equivalent JSON or losing relationships', async () => {
    const updated: unknown[] = [];
    server.use(
      http.get('*/api/v1/catalog', () => HttpResponse.json({ items: [
        { ...entry, metadata: { name: 'same', namespace: 'dev' }, spec: { nested: { b: 2, a: 1 }, owner: 'platform' } },
        { ...entry, metadata: { name: 'changed', namespace: 'dev' } },
      ] })),
      http.put('*/api/v1/catalog/Resource/dev/changed', async ({ request }) => {
        updated.push(await request.json());
        return HttpResponse.json({});
      }),
    );
    const instance = store();
    const relationships = [{ type: 'dependsOn', targetKind: 'Resource' as const, targetName: 'same', namespace: 'dev' }];
    const result = await instance.dispatch(catalogApi.endpoints.importCatalogEntities.initiate({ updateExisting: true, entities: [
      { ...entry, name: 'same', spec: { owner: 'platform', nested: { a: 1, b: 2 } } },
      { ...entry, name: 'changed', spec: { owner: 'new-owner' }, relationships },
    ] })).unwrap();
    expect(result).toEqual({ created: 0, updated: 1, skipped: 1, failures: [] });
    expect(updated).toEqual([{ spec: { owner: 'new-owner' }, relationships }]);
    instance.dispatch(baseApi.util.resetApiState());
  });
});

describe('local AWS network boundary', () => {
  it('accepts Moto JSON responses when its Content-Type is text/html', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"QueueUrl":"http://127.0.0.1:18081/123456789012/local"}', { headers: { 'Content-Type': 'text/html' } }));
    const data = await localAws('/local-aws', 'sqs', 'CreateQueue', { QueueName: 'local' });
    expect(data.QueueUrl).toBe('http://127.0.0.1:18081/123456789012/local');
    fetch.mockRestore();
  });
  it('uses only fixed dummy authentication and rejects ambiguous HTTP 200 responses', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<ListAllMyBucketsResult />', { status: 200, headers: { 'Content-Type': 'application/xml' } }));
    await expect(localAws('/local-aws', 'sqs', 'CreateQueue', { QueueName: 'local' })).rejects.toThrow(/non-JSON/);
    const options = fetch.mock.calls[0][1]!;
    expect(options.credentials).toBe('omit');
    expect(options.redirect).toBe('error');
    expect((options.headers as Record<string, string>).Authorization).toContain('Credential=local/');
    fetch.mockRestore();
  });
  it.each(['https://sqs.sa-east-1.amazonaws.com', 'http://example.com:5000', 'http://127.0.0.1', 'http://user:pass@127.0.0.1:5000', 'http://127.0.0.1:5000/path', 'http://127.0.0.1:5000?redirect=aws'])('rejects %s', (endpoint) => {
    expect(() => localEndpoint(endpoint)).toThrow();
  });

  it('rejects a production endpoint before performing any fetch', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    await expect(localAws('https://events.sa-east-1.amazonaws.com', 'events', 'PutEvents', {})).rejects.toThrow(/loopback/);
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
});
