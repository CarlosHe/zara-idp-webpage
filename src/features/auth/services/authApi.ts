// Sprint 11 / L-1108: server-driven RBAC. The `/api/v1/me` endpoint is
// the authoritative source for the principal — username, scopes, roles,
// accessible namespaces. Route guards (`<ProtectedRoute>`,
// `<RequireScope>`) read from this endpoint instead of any client-side
// claim parsing. The bearer-token-based flow keeps localStorage as the
// transport but the FE never trusts the token's contents — every
// authorisation decision flows through a server query.

import { baseApi } from '@/shared/lib/api';

/**
 * Principal returned by `GET /api/v1/me`. Matches the backend
 * `MeResponse` struct (`internal/adapters/rest/handlers_identity.go`).
 *
 * Server source of truth: roles + namespaces are computed server-side
 * from the OAuth2 introspection response (Hydra) or JWT claims, never
 * from anything the client supplies.
 */
export interface Principal {
  username: string;
  email?: string;
  name?: string;
  subject: string;
  roles: string[];
  isAdmin: boolean;
  namespaces: string[];
  currentNamespace: string;
  authenticated: boolean;
  tokenExpiry?: string;
}

interface MeResponseRaw {
  username: string;
  email?: string;
  name?: string;
  subject: string;
  roles: string[];
  is_admin: boolean;
  namespaces: string[];
  current_namespace: string;
  authenticated: boolean;
  token_expiry?: string;
}

function normalizeMe(raw: MeResponseRaw): Principal {
  return {
    username: raw.username,
    email: raw.email,
    name: raw.name,
    subject: raw.subject,
    roles: Array.isArray(raw.roles) ? raw.roles : [],
    isAdmin: Boolean(raw.is_admin),
    namespaces: Array.isArray(raw.namespaces) ? raw.namespaces : [],
    currentNamespace: raw.current_namespace,
    authenticated: Boolean(raw.authenticated),
    tokenExpiry: raw.token_expiry,
  };
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * `useGetMeQuery()` is the canonical hook for "who is the current
     * user?". 401 short-circuits via the global baseQuery handler
     * (redirects to /login). Other failures bubble normally.
     */
    getMe: build.query<Principal, void>({
      query: () => '/me',
      transformResponse: (raw: MeResponseRaw) => normalizeMe(raw),
      // Cache through the session — we don't expect roles/scopes to
      // mutate without a fresh login.
      keepUnusedDataFor: 60 * 5,
    }),
  }),
  overrideExisting: false,
});

export const { useGetMeQuery } = authApi;
