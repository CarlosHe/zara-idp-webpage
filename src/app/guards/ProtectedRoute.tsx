import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

// ProtectedRoute is a pass-through placeholder in Sprint 6. The real
// auth integration lands in Sprint 11, at which point this component
// reads an auth store and redirects unauthenticated visitors to
// `/login?redirect=<pathname>`. Wiring the route tree to this guard
// now keeps that later change a single-file edit.
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
}
