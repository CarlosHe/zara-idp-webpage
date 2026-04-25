// Sprint 11 / L-1108: scope/role helpers. The Principal's `roles` array
// is the only source of authorisation truth on the client — every
// guard funnels through `principalHasScope` so a future RBAC schema
// change is one-line.
//
// Roles use either the bare form (`developer`, `viewer`, `owner`,
// `admin`) or the namespace-scoped form (`developer@namespace`). The
// helper accepts both. Admin (or `is_admin`) is treated as a wildcard.

import type { Principal } from '../services/authApi';

export type Scope =
  | 'admin'
  | 'owner'
  | 'maintainer'
  | 'developer'
  | 'viewer'
  | string;

/**
 * Returns true if the principal can act under the given scope.
 *
 * - `is_admin: true` short-circuits to allow.
 * - The bare scope name matches both bare and namespace-scoped roles
 *   (so `developer` matches `developer@frontend`).
 * - The namespace-scoped form matches exactly.
 */
export function principalHasScope(
  principal: Principal | null | undefined,
  scope: Scope,
): boolean {
  if (!principal) return false;
  if (!principal.authenticated) return false;
  if (principal.isAdmin) return true;
  if (!Array.isArray(principal.roles)) return false;
  return principal.roles.some((role) => {
    if (role === scope) return true;
    // Bare scope — match the role prefix before `@namespace`.
    if (!scope.includes('@')) {
      const at = role.indexOf('@');
      const bare = at === -1 ? role : role.slice(0, at);
      return bare === scope;
    }
    return false;
  });
}

/**
 * Returns true if the principal has ALL of the listed scopes. Empty
 * `required` always returns true (no requirement).
 */
export function principalHasAllScopes(
  principal: Principal | null | undefined,
  required: readonly Scope[],
): boolean {
  if (required.length === 0) return true;
  return required.every((s) => principalHasScope(principal, s));
}

/**
 * Returns true if the principal has ANY of the listed scopes. Empty
 * `oneOf` returns true (i.e. "no preference").
 */
export function principalHasAnyScope(
  principal: Principal | null | undefined,
  oneOf: readonly Scope[],
): boolean {
  if (oneOf.length === 0) return true;
  return oneOf.some((s) => principalHasScope(principal, s));
}
