import { Outlet } from 'react-router-dom';

// RootLayout is the outermost layout. It holds a global chrome slot
// (skip-link, error boundary, toasts) and renders the matched
// child route via <Outlet />. Feature layouts (DashboardLayout,
// AuthLayout, ...) nest underneath.
export function RootLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 antialiased">
      <Outlet />
    </div>
  );
}
