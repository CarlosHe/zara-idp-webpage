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
const boundedSession = createApi({
  reducerPath: 'boundedSession', baseQuery: baseQueryWithRetry,
  endpoints: (builder) => ({ getMe: builder.query<unknown, void>({ query: () => ({ url: '/bounded-session', timeout: 30 }) }) }),
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

it('a stalled session check times out once without clearing the credential', async () => {
  let requests = 0;
  server.use(http.get('http://localhost:3000/api/v1/bounded-session', async ({ request }) => {
    requests++;
    await new Promise<void>((resolve) => {
      if (request.signal.aborted) resolve();
      else request.signal.addEventListener('abort', () => resolve(), { once: true });
    });
    return HttpResponse.json({ authenticated: true });
  }));
  localStorage.setItem(AUTH_TOKEN_KEY, 'existing-session');
  const store = configureStore({ reducer: { [boundedSession.reducerPath]: boundedSession.reducer }, middleware: (getDefault) => getDefault().concat(boundedSession.middleware) });
  const pending = store.dispatch(boundedSession.endpoints.getMe.initiate());
  try {
    const result = await pending;
    expect(result.error).toMatchObject({ status: 'TIMEOUT_ERROR' });
    expect(requests).toBe(1);
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('existing-session');
  } finally { pending.unsubscribe(); store.dispatch(boundedSession.util.resetApiState()); }
});
