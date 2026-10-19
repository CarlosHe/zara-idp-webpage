import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../../tests/mocks/server';
import { createTestStore } from '../../../../../tests/utils/TestProviders';
import { baseApi } from '../baseApi';

const api = baseApi.injectEndpoints({ endpoints: (build) => ({
  retryRead: build.query<unknown, void>({ query: () => '/retry-check' }),
  retryWrite: build.mutation<unknown, void>({ query: () => ({ url: '/retry-check', method: 'POST' }) }),
}) });

describe('API retry policy', () => {
  it('returns tenant validation failures after a single request', async () => {
    let requests = 0;
    server.use(http.get('*/api/v1/retry-check', () => { requests++; return HttpResponse.json({ message: 'missing X-Zara-Tenant header' }, { status: 400 }); }));
    const store = createTestStore();
    const action = store.dispatch(api.endpoints.retryRead.initiate());
    const result = await action;
    expect(result.isError).toBe(true);
    expect(requests).toBe(1);
    action.unsubscribe();
    store.dispatch(baseApi.util.resetApiState());
  });
  it('never repeats a write when a server response is lost or fails', async () => {
    let requests = 0;
    server.use(http.post('*/api/v1/retry-check', () => { requests++; return HttpResponse.json({ message: 'Temporary failure' }, { status: 503 }); }));
    const store = createTestStore();
    const result = await store.dispatch(api.endpoints.retryWrite.initiate());
    expect(result.error).toBeDefined();
    expect(requests).toBe(1);
    store.dispatch(baseApi.util.resetApiState());
  });
});
