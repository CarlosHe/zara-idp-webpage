import type { ReactNode } from 'react';

interface GuestRouteProps {
  children: ReactNode;
}

// GuestRoute is the mirror of ProtectedRoute: once auth is wired in
// Sprint 11, an authenticated visitor hitting `/login` is redirected
// back to the dashboard. Today it is a pass-through so the route
// tree already reflects the final shape.
export function GuestRoute({ children }: GuestRouteProps) {
  return <>{children}</>;
}
