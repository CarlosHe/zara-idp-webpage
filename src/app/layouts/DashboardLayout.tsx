import { Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { SkipLink } from '@/shared/components/feedback';

const WorkspaceControls = lazy(() => import('./WorkspaceControls').then((module) => ({ default: module.WorkspaceControls })));
const Sidebar = lazy(() => import('./Sidebar').then((module) => ({ default: module.Sidebar })));

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <SkipLink />
      <Suspense fallback={<aside aria-label="Primary" className="fixed inset-y-0 left-0 w-64 bg-slate-800/50 border-r border-slate-700/50" />}><Sidebar /></Suspense>


      <div className="pl-64">
        <header
          role="banner"
          className="sticky top-0 z-10 h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50"
        >
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4" />
            <div className="flex items-center gap-4">
              <Suspense fallback={null}><WorkspaceControls /></Suspense>
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="p-6 focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
