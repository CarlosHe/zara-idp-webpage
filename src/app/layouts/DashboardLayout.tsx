import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Search,
  BookOpen,
  Users,
  CheckSquare,
  History,
  Shield,
  Snowflake,
  Zap,
  Home,
  Rocket,
  Calendar,
  Building2,
  Globe,
  BarChart3,
  FolderTree,
  Plug,
  ShieldCheck,
  Server,
  BellRing,
  Siren,
  DollarSign,
  Container,
  Activity,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { ROUTES } from '@/shared/config';
import { ThemeToggle } from '@/features/theme';
import { SkipLink } from '@/shared/components/feedback';

const navigation = [
  { name: 'Home', href: ROUTES.PERSONAL_HOME, icon: Home },
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: 'Resources', href: ROUTES.RESOURCES.LIST, icon: Boxes },
  { name: 'Catalog', href: ROUTES.CATALOG.LIST, icon: Boxes },
  { name: 'Search', href: ROUTES.SEARCH, icon: Search },
  { name: 'Docs', href: ROUTES.DOCS, icon: BookOpen },
  { name: 'APIs', href: ROUTES.APIS, icon: Plug },
  { name: 'Teams', href: ROUTES.TEAMS.LIST, icon: Users },
  { name: 'Approvals', href: ROUTES.APPROVALS.LIST, icon: CheckSquare },
  { name: 'Audit Log', href: ROUTES.AUDIT.LIST, icon: History },
  { name: 'Policies', href: ROUTES.POLICIES.LIST, icon: Shield },
  { name: 'Freezes', href: ROUTES.FREEZES.LIST, icon: Snowflake },
  { name: 'Golden Paths', href: ROUTES.GOLDEN_PATHS, icon: Rocket },
  { name: 'Calendar', href: ROUTES.CALENDAR, icon: Calendar },
  { name: 'Domains', href: ROUTES.BUSINESS_DOMAINS, icon: Building2 },
  { name: 'Clusters', href: ROUTES.CLUSTERS, icon: Globe },
  { name: 'Namespaces', href: ROUTES.NAMESPACES, icon: FolderTree },
  { name: 'Analytics', href: ROUTES.ANALYTICS, icon: BarChart3 },
  {
    name: 'DORA & Quality',
    href: ROUTES.ANALYTICS_EXECUTIVE,
    icon: Activity,
  },
  { name: 'Runtime', href: ROUTES.RUNTIME, icon: Server },
  { name: 'Scorecards', href: ROUTES.SCORECARDS, icon: ShieldCheck },
  { name: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: BellRing },
  { name: 'Incidents', href: ROUTES.INCIDENTS, icon: Siren },
  { name: 'Cost', href: ROUTES.COST, icon: DollarSign },
  { name: 'Environments', href: ROUTES.ENVIRONMENTS, icon: Container },
  { name: 'Tenants', href: ROUTES.TENANTS, icon: Building2 },
];

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <SkipLink />

      <aside
        aria-label="Primary"
        className="fixed inset-y-0 left-0 w-64 bg-slate-800/50 border-r border-slate-700/50"
      >
        <header className="h-16 flex items-center px-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div
              aria-hidden
              className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"
            >
              <Zap className="h-5 w-5 text-white" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Zara IDP</h1>
              <p className="text-xs text-slate-300">Control Plane Portal</p>
            </div>
          </div>
        </header>

        <nav aria-label="Main navigation" className="p-4 space-y-1">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  end={item.href === ROUTES.DASHBOARD}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      isActive
                        ? 'bg-blue-600/20 text-blue-300'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="h-5 w-5" aria-hidden />
                      <span>{item.name}</span>
                      {isActive ? <span className="sr-only"> (current page)</span> : null}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <footer className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-400">Zara IDP Core v0.1.0</p>
          <p className="mt-1 text-xs text-slate-400">Read-Only Portal</p>
        </footer>
      </aside>

      <div className="pl-64">
        <header
          role="banner"
          className="sticky top-0 z-10 h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50"
        >
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4" />
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span
                role="status"
                aria-label="Running in demo mode"
                className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300"
              >
                Demo Mode
              </span>
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
