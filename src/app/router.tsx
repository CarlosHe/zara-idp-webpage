import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ErrorPage } from './routes/ErrorPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { LoadingState } from '@/shared/components/feedback';
import { ROUTES } from '@/shared/config';
import { VitalsDebugPanel } from '@/shared/lib/observability/VitalsDebugPanel';

// Each feature barrel exports its page component(s) as named exports.
// React.lazy wants `{ default: Component }`, so we adapt with .then().

const DashboardPage = lazy(() =>
  import('@/features/dashboard').then((m) => ({ default: m.DashboardPage })),
);
const ResourcesPage = lazy(() =>
  import('@/features/resources').then((m) => ({ default: m.ResourcesPage })),
);
const CatalogPage = lazy(() =>
  import('@/features/catalog').then((m) => ({ default: m.CatalogPage })),
);
const CatalogDetailPage = lazy(() =>
  import('@/features/catalog').then((m) => ({ default: m.CatalogDetailPage })),
);
const SearchPage = lazy(() =>
  import('@/features/search').then((m) => ({ default: m.SearchPage })),
);
const DocsPage = lazy(() =>
  import('@/features/docs').then((m) => ({ default: m.DocsPage })),
);
const TeamsPage = lazy(() =>
  import('@/features/teams').then((m) => ({ default: m.TeamsPage })),
);
const TeamDetailPage = lazy(() =>
  import('@/features/teams').then((m) => ({ default: m.TeamDetailPage })),
);
const ApprovalsPage = lazy(() =>
  import('@/features/approvals').then((m) => ({ default: m.ApprovalsPage })),
);
const ApprovalDetailPage = lazy(() =>
  import('@/features/approvals').then((m) => ({ default: m.ApprovalDetailPage })),
);
const AuditPage = lazy(() =>
  import('@/features/audit').then((m) => ({ default: m.AuditPage })),
);
const AuditDetailPage = lazy(() =>
  import('@/features/audit').then((m) => ({ default: m.AuditDetailPage })),
);
const FreezesPage = lazy(() =>
  import('@/features/freezes').then((m) => ({ default: m.FreezesPage })),
);
const FreezeDetailPage = lazy(() =>
  import('@/features/freezes').then((m) => ({ default: m.FreezeDetailPage })),
);
const PoliciesPage = lazy(() =>
  import('@/features/policies').then((m) => ({ default: m.PoliciesPage })),
);
const PolicyDetailPage = lazy(() =>
  import('@/features/policies').then((m) => ({ default: m.PolicyDetailPage })),
);
const GoldenPathsPage = lazy(() =>
  import('@/features/golden-paths').then((m) => ({ default: m.GoldenPathsPage })),
);
const CalendarPage = lazy(() =>
  import('@/features/calendar').then((m) => ({ default: m.CalendarPage })),
);
const BusinessDomainsPage = lazy(() =>
  import('@/features/business-domains').then((m) => ({ default: m.BusinessDomainsPage })),
);
const ClustersPage = lazy(() =>
  import('@/features/clusters').then((m) => ({ default: m.ClustersPage })),
);
const NamespacesPage = lazy(() =>
  import('@/features/namespaces').then((m) => ({ default: m.NamespacesPage })),
);
const AnalyticsPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.AnalyticsPage })),
);
const PluginsPage = lazy(() =>
  import('@/features/plugins').then((m) => ({ default: m.PluginsPage })),
);

function withSuspense(Component: ComponentType) {
  return (
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '_vitals', element: <VitalsDebugPanel /> },
      {
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: withSuspense(DashboardPage) },

          { path: 'resources', element: withSuspense(ResourcesPage) },
          {
            path: 'resources/:kind/:namespace/:name',
            element: withSuspense(ResourcesPage),
          },

          { path: 'catalog', element: withSuspense(CatalogPage) },
          {
            path: 'catalog/:kind/:namespace/:name',
            element: withSuspense(CatalogDetailPage),
          },
          { path: 'search', element: withSuspense(SearchPage) },
          { path: 'docs', element: withSuspense(DocsPage) },

          { path: 'teams', element: withSuspense(TeamsPage) },
          { path: 'teams/:name', element: withSuspense(TeamDetailPage) },

          { path: 'approvals', element: withSuspense(ApprovalsPage) },
          { path: 'approvals/:id', element: withSuspense(ApprovalDetailPage) },

          { path: 'audit', element: withSuspense(AuditPage) },
          { path: 'audit/:id', element: withSuspense(AuditDetailPage) },

          { path: 'freezes', element: withSuspense(FreezesPage) },
          { path: 'freezes/:id', element: withSuspense(FreezeDetailPage) },

          { path: 'policies', element: withSuspense(PoliciesPage) },
          {
            path: 'policies/:namespace/:name',
            element: withSuspense(PolicyDetailPage),
          },

          { path: 'golden-paths', element: withSuspense(GoldenPathsPage) },
          { path: 'calendar', element: withSuspense(CalendarPage) },
          { path: 'domains', element: withSuspense(BusinessDomainsPage) },
          { path: 'clusters', element: withSuspense(ClustersPage) },
          { path: 'namespaces', element: withSuspense(NamespacesPage) },
          { path: 'analytics', element: withSuspense(AnalyticsPage) },
          { path: 'plugins', element: withSuspense(PluginsPage) },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
