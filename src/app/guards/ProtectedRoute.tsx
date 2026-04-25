// Sprint 11 / L-1108: server-driven authentication guard. The route
// only renders its children when the server confirms the principal is
// authenticated; an unauthenticated visitor is bounced to /login with
// the original URL preserved as `redirect` query.
//
// We deliberately rely on the server's `/api/v1/me` endpoint rather
// than the local token because (a) tokens may be expired, revoked, or
// scoped to a tenant the user no longer belongs to, and (b) the
// authoritative claim of "you're authenticated" lives on the server.

import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { LoadingState } from '@/shared/components/feedback';
import { useGetMeQuery } from '@/features/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

const LOGIN_ROUTE = '/login';

function redirectToLogin(currentPath: string): null {
  if (typeof window === 'undefined') return null;
  if (window.location.pathname === LOGIN_ROUTE) return null;
  const url = new URL(LOGIN_ROUTE, window.location.origin);
  url.searchParams.set('redirect', currentPath);
  window.location.replace(url.toString());
  return null;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { data: principal, isLoading, isError, error } = useGetMeQuery();

  if (isLoading) {
    return <LoadingState message="Authenticating..." />;
  }

  // 401 short-circuits via the global baseQuery handler (see
  // baseQuery.ts:92). 403 / network failure surfaces here. Any error
  // path falls back to "not authenticated" — fail-closed.
  if (isError) {
    const status =
      error && typeof error === 'object' && 'status' in error
        ? (error as { status?: number | string }).status
        : undefined;
    if (status === 401 || status === 403) {
      const path = `${location.pathname}${location.search}${location.hash}`;
      return redirectToLogin(path);
    }
    return <LoadingState message="Authenticating..." />;
  }

  if (!principal || !principal.authenticated) {
    const path = `${location.pathname}${location.search}${location.hash}`;
    return redirectToLogin(path);
  }

  return <>{children}</>;
}
