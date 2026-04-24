import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Users,
  CheckSquare,
  History,
  Shield,
  Snowflake,
  Zap,
  Rocket,
  Calendar,
  Building2,
  Globe,
  BarChart3,
  FolderTree,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { ROUTES } from '@/shared/config';
import { ThemeToggle } from '@/features/theme';

const navigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: 'Resources', href: ROUTES.RESOURCES.LIST, icon: Boxes },
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
];

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-800/50 border-r border-slate-700/50">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Zara IDP</h1>
              <p className="text-xs text-slate-400">Control Plane Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
          <div className="text-xs text-slate-500">
            <p>Zara IDP Core v0.1.0</p>
            <p className="mt-1">Read-Only Portal</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Breadcrumb or page title will go here */}
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                Demo Mode
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
