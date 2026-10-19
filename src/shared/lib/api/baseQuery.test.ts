import { configureStore } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';
import { http, HttpResponse } from 'msw';
import { afterEach, expect, it } from 'vitest';
import { server } from '../../../../tests/mocks/server';
import { AUTH_TOKEN_KEY, baseQueryWithRetry } from './baseQuery';

const sessionProbe = createApi({
  reducerPath: 'sessionProbe', baseQuery: baseQueryWithRetry,
  endpoints: (builder) => ({ probe: builder.query<unknown, void>({ query: () => '/session-race' }) }),
});
afterEach(() => localStorage.removeItem(AUTH_TOKEN_KEY));
it.each(['replacement-session', null])('a delayed 401 cannot invalidate a changed session: %s', async (nextToken) => {
  let observed!: () => void; let release!: () => void;
  const started = new Promise<void>((resolve) => { observed = resolve; });
  const response = new Promise<void>((resolve) => { release = resolve; });
  server.use(http.get('http://localhost:3000/api/v1/session-race', async ({ request }) => {
    expect(request.headers.get('Authorization')).toBe('Bearer previous-session');
    observed(); await response;
    return HttpResponse.json({ error: 'expired' }, { status: 401 });
  }));
  const store = configureStore({ reducer: { [sessionProbe.reducerPath]: sessionProbe.reducer }, middleware: (getDefault) => getDefault().concat(sessionProbe.middleware) });
  localStorage.setItem(AUTH_TOKEN_KEY, 'previous-session');
  const pending = store.dispatch(sessionProbe.endpoints.probe.initiate());
  try {
    await started;
    if (nextToken) localStorage.setItem(AUTH_TOKEN_KEY, nextToken); else localStorage.removeItem(AUTH_TOKEN_KEY);
    release(); await pending;
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe(nextToken);
  } finally { release(); pending.unsubscribe(); store.dispatch(sessionProbe.util.resetApiState()); }
});
