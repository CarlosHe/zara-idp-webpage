import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { PageHeader, ErrorState, LoadingState } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { useListScorecardsQuery } from '../services/scorecardsApi';
import type { Scorecard } from '../types';
import { ScorecardList } from './ScorecardList';
import { ScorecardRuleBuilder } from './ScorecardRuleBuilder';
import { MaturityDashboard } from './MaturityDashboard';
import { GovernanceKPIs } from './GovernanceKPIs';

type Tab = 'overview' | 'builder' | 'evaluate';

// `ScorecardsPage` is the L-2205/L-2206/L-2209 shell: KPI banner + tab
// switcher between the scorecard inventory, the rule builder, and the
// maturity dashboard.
export function ScorecardsPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [selected, setSelected] = useState<Scorecard | null>(null);
  const list = useListScorecardsQuery();

  if (list.isLoading) {
    return <LoadingState message="Loading scorecards..." />;
  }
  if (list.error) {
    return (
      <ErrorState
        message={errorMessage(list.error) || 'Failed to load scorecards'}
        onRetry={list.refetch}
      />
    );
  }

  const scorecards = list.data ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<ShieldCheck className="h-6 w-6" />}
        iconClassName="text-emerald-400"
        title="Scorecards & Governance"
        description="Native rule DSL, maturity dashboards, waivers and KPIs"
      />

      <GovernanceKPIs />

      <nav className="flex gap-2 border-b border-slate-700" aria-label="scorecard tabs">
        <TabButton current={tab} value="overview" onClick={setTab}>
          Inventory
        </TabButton>
        <TabButton current={tab} value="builder" onClick={setTab}>
          Rule builder
        </TabButton>
        <TabButton current={tab} value="evaluate" onClick={setTab}>
          Evaluate entity
        </TabButton>
      </nav>

      {tab === 'overview' ? (
        <ScorecardList scorecards={scorecards} selected={selected} onSelect={setSelected} />
      ) : null}
      {tab === 'builder' ? <ScorecardRuleBuilder /> : null}
      {tab === 'evaluate' ? <MaturityDashboard /> : null}
    </div>
  );
}

interface TabButtonProps {
  value: Tab;
  current: Tab;
  onClick: (tab: Tab) => void;
  children: React.ReactNode;
}

function TabButton({ value, current, onClick, children }: TabButtonProps) {
  const active = current === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onClick(value)}
      className={
        'px-3 py-2 text-sm border-b-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ' +
        (active
          ? 'border-cyan-400 text-cyan-200'
          : 'border-transparent text-slate-400 hover:text-slate-200')
      }
    >
      {children}
    </button>
  );
}
