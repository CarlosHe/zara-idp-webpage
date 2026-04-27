import { Home } from 'lucide-react';
import { Alert, Badge } from '@/shared/components/ui';
import {
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { useHome } from '../hooks/useHome';
import type { HomePersona } from '../types/home';
import { ApprovalsCard } from './ApprovalsCard';
import { AlertsCard } from './AlertsCard';
import { RecommendationsCard } from './RecommendationsCard';
import { RecentActivityCard } from './RecentActivityCard';
import { QuickLinksCard } from './QuickLinksCard';
import { ServicesCard } from './ServicesCard';
import { PERSONA_DESCRIPTION, PERSONA_LABEL } from './HomeUtils';

// Sprint-24 / L-2403 — the personalised platform home page. The page
// is intentionally a thin shell: it asks the hook for the snapshot,
// renders the cards in role-aware order, and lets the hook record
// engagement signals through `recordAction`.
//
// L-2407 hooks: every region has a stable `aria-label` and the cards
// expose `data-testid` attributes so Playwright can assert per-role
// widget presence without relying on copy.
export function HomePage() {
  const { snapshot, loading, error, refresh, isDegraded, degraded, recordAction } =
    useHome();

  if (loading && !snapshot) {
    return <LoadingState message="Loading home..." />;
  }

  if (error && !snapshot) {
    const message = errorMessage(error) || 'Failed to load home';
    return <ErrorState message={message} onRetry={refresh} />;
  }

  if (!snapshot) {
    return <LoadingState message="Loading home..." />;
  }

  const persona = snapshot.persona as HomePersona;
  const counts = snapshot.counts;

  return (
    <div
      className="space-y-6 animate-fade-in"
      aria-label="Personalised home"
      data-testid="home-page"
    >
      <PageHeader
        icon={<Home className="h-6 w-6" />}
        iconClassName="text-blue-400"
        title={`Welcome, ${snapshot.subject || 'engineer'}`}
        description={PERSONA_DESCRIPTION[persona]}
        onRefresh={refresh}
        actions={
          <Badge variant="outline" data-testid="home-persona-badge">
            {PERSONA_LABEL[persona]}
          </Badge>
        }
      />

      {isDegraded ? (
        <Alert type="warning">
          Some home widgets returned partial data: {degraded.join(', ')}.
        </Alert>
      ) : null}

      <section
        aria-label="Home widgets"
        className="grid gap-6 lg:grid-cols-2"
        data-home-counts={JSON.stringify(counts)}
      >
        <ApprovalsCard items={snapshot.approvals} onAction={recordAction} />
        <AlertsCard
          items={snapshot.alerts}
          criticalCount={counts.criticalAlerts}
          onAction={recordAction}
        />
        <RecommendationsCard
          items={snapshot.recommendations}
          onAction={recordAction}
        />
        <RecentActivityCard
          items={snapshot.activity}
          onAction={recordAction}
        />
        <ServicesCard items={snapshot.services} onAction={recordAction} />
        <QuickLinksCard items={snapshot.quickLinks} onAction={recordAction} />
      </section>
    </div>
  );
}
