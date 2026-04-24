import {
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { publishToast } from '@/shared/lib/toasts';

const API_BASE_URL = '/api/v1';
const AUTH_TOKEN_KEY = 'zara.authToken';
const LOGIN_ROUTE = '/login';

function readAuthToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function newCorrelationId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  // Fallback: sufficient for correlation, not for cryptographic uniqueness.
  return `zui-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  const { pathname, search, hash } = window.location;
  const currentPath = `${pathname}${search}${hash}`;
  // Guard against redirect loops.
  if (pathname === LOGIN_ROUTE) return;
  const url = new URL(LOGIN_ROUTE, window.location.origin);
  url.searchParams.set('redirect', currentPath);
  window.location.replace(url.toString());
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    headers.set('X-Correlation-ID', newCorrelationId());
    const token = readAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
  // RTK Query passes the request signal through to fetch, so every
  // query/mutation is cancellable by default. `AbortController` is wired
  // automatically on unmount / refetch / cache invalidation.
});

// One wrapper translates HTTP failures into app-wide side effects:
//   * 401 → drop the stale token, bounce to /login keeping redirect= URL;
//   * 403 → surface a toast but leave the query result alone so callers
//           can render the "forbidden" empty state themselves.
// Everything else falls through untouched.
const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (!result.error) return result;

  const status = result.error.status;
  const correlationId = extractCorrelationId(result.error);

  if (status === 401) {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch {
      // ignore storage errors
    }
    redirectToLogin();
    return result;
  }

  if (status === 403) {
    publishToast({
      level: 'warning',
      title: 'Permission denied',
      message: 'You are not allowed to perform this action.',
      correlationId,
    });
    return result;
  }

  if (typeof status === 'number' && status >= 500) {
    publishToast({
      level: 'error',
      title: 'Server error',
      message: `Request failed with status ${status}.`,
      correlationId,
    });
  }

  return result;
};

function extractCorrelationId(error: FetchBaseQueryError): string | undefined {
  // RTK Query's FetchBaseQueryError doesn't expose headers today. Callers
  // that embed a `correlationId` field in the body get it here.
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'correlationId' in data) {
      const value = (data as { correlationId?: unknown }).correlationId;
      if (typeof value === 'string') return value;
    }
  }
  return undefined;
}

// Retry only on 5xx / network errors. RTK Query's `retry` wrapper shorts
// out on 4xx by default when we return its standard bail condition.
export const baseQueryWithRetry = retry(baseQueryWithAuth, {
  maxRetries: 2,
});

export { API_BASE_URL, AUTH_TOKEN_KEY };
