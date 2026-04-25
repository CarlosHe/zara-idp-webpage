// Sprint 11 / L-1108: per-route scope check. Use this guard inside
// `<ProtectedRoute>` (which has already established that someone is
// signed in) to gate routes whose access is scope-conditional —
// freeze admin, governance changesets, plugin install, etc.
//
// If the principal is missing the required scopes, the guard renders
// an EmptyState with a "you do not have access" message and a back
// link, instead of bouncing — the user IS authenticated, just not
// authorised for that page. This avoids the "loop the user through
// /login when the real problem is RBAC" UX bug.

import type { ReactNode } from 'react';

import { EmptyState } from '@/shared/components/ui/EmptyState';
import {
  useGetMeQuery,
  principalHasAllScopes,
  principalHasAnyScope,
  type Scope,
} from '@/features/auth';

interface RequireScopeProps {
  children: ReactNode;

  /**
   * The principal must have ALL listed scopes.
   */
  all?: readonly Scope[];

  /**
   * The principal must have at least ONE of the listed scopes. Useful
   * for "viewer-or-developer-or-owner can read this page".
   */
  oneOf?: readonly Scope[];
}

export function RequireScope({ children, all = [], oneOf = [] }: RequireScopeProps) {
  const { data: principal } = useGetMeQuery();

  const hasAll = principalHasAllScopes(principal, all);
  const hasAny = principalHasAnyScope(principal, oneOf);

  if (!hasAll || !hasAny) {
    return (
      <EmptyState
        title="Access denied"
        description="You do not have permission to view this page. Contact your platform admin if you think this is wrong."
      />
    );
  }

  return <>{children}</>;
}
