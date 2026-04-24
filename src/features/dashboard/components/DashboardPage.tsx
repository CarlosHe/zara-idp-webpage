import { LayoutDashboard } from 'lucide-react';
import { errorMessage } from '@/shared/lib/api';
import { ErrorState, LoadingState, PageHeader } from '@/shared/components/feedback';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { DashboardStats } from './DashboardStats';
import { DashboardHealth } from './DashboardHealth';
import { DashboardActivity } from './DashboardActivity';

export function DashboardPage() {
  const { summary, health, auditLogs, loading, error, refresh } = useDashboard();

  if (loading && !summary && !health) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error) {
    const message = errorMessage(error) || 'Failed to load dashboard';
    return <ErrorState message={message} onRetry={refresh} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<LayoutDashboard className="h-6 w-6" />}
        iconClassName="text-blue-400"
        title="Dashboard"
        description="Overview of your infrastructure state"
        onRefresh={refresh}
      />

      <DashboardStats summary={summary} health={health} />

      <DashboardHealth summary={summary} health={health} />

      <DashboardActivity auditLogs={auditLogs} summary={summary} />
    </div>
  );
}
