import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';
import { server } from '../../../../tests/mocks/server';
import { HomePage } from './HomePage';

const API = '*/api/v1';

interface PartialSnapshot {
  persona: string;
  subject?: string;
  generatedAt?: string;
  approvals?: unknown[];
  alerts?: unknown[];
  activity?: unknown[];
  services?: unknown[];
  quickLinks?: unknown[];
  recommendations?: unknown[];
  counts?: Record<string, number>;
  degraded?: string[];
}

function homeSnapshot(overrides: PartialSnapshot) {
  return {
    persona: overrides.persona,
    subject: overrides.subject ?? 'alice',
    generatedAt: overrides.generatedAt ?? '2026-04-26T12:00:00Z',
    approvals: overrides.approvals ?? [],
    alerts: overrides.alerts ?? [],
    activity: overrides.activity ?? [],
    services: overrides.services ?? [],
    quickLinks: overrides.quickLinks ?? [],
    recommendations: overrides.recommendations ?? [],
    counts: {
      approvals: 0,
      alerts: 0,
      criticalAlerts: 0,
      activity: 0,
      services: 0,
      quickLinks: 0,
      recommendations: 0,
      ...(overrides.counts ?? {}),
    },
    degraded: overrides.degraded ?? [],
  };
}

function useSnapshot(overrides: PartialSnapshot) {
  server.use(
    http.get(`${API}/home`, () => HttpResponse.json(homeSnapshot(overrides))),
  );
}

describe('HomePage (Sprint 24 / L-2403, L-2405, L-2407)', () => {
  it('renders the developer persona welcome and quick-links empty state', async () => {
    renderWithProviders(<HomePage />, { route: '/home' });
    await waitFor(() => {
      expect(screen.getByText(/Welcome, alice/i)).toBeInTheDocument();
    });
    expect(screen.getByTestId('home-persona-badge')).toHaveTextContent(/developer/i);
    expect(screen.getByRole('region', { name: /quick links/i })).toBeInTheDocument();
  });

  it('renders the approvals card with waiting-for-you marker (developer)', async () => {
    useSnapshot({
      persona: 'developer',
      approvals: [
        {
          id: 'a1',
          changeSetId: 'cs-1',
          title: 'deploy core',
          risk: 'medium',
          severity: 'warning',
          environment: 'prod',
          requestedBy: 'bob',
          namespace: 'payments',
          waitingForYou: true,
          createdAt: '2026-04-26T11:30:00Z',
          action: { kind: 'approval', id: 'a1', path: '/approvals/a1' },
        },
      ],
      counts: { approvals: 1 },
    });
    renderWithProviders(<HomePage />, { route: '/home' });
    await waitFor(() => {
      expect(screen.getByTestId('home-approvals-list')).toBeInTheDocument();
    });
    expect(screen.getByText('deploy core')).toBeInTheDocument();
    expect(screen.getByText(/waiting for you/i)).toBeInTheDocument();
  });

  it('renders the platform persona widgets', async () => {
    useSnapshot({ persona: 'platform' });
    renderWithProviders(<HomePage />, { route: '/home' });
    await waitFor(() => {
      expect(screen.getByTestId('home-persona-badge')).toHaveTextContent(
        /platform engineer/i,
      );
    });
    expect(screen.getByTestId('home-approvals-card')).toBeInTheDocument();
    expect(screen.getByTestId('home-alerts-card')).toBeInTheDocument();
  });

  it('renders the SRE persona with critical alert badge', async () => {
    useSnapshot({
      persona: 'sre',
      alerts: [
        {
          id: 'burn',
          source: 'scorecard',
          title: 'SLO burn rate',
          message: 'Error budget exhausted',
          severity: 'critical',
          namespace: 'payments',
          createdAt: '2026-04-26T11:45:00Z',
          action: { kind: 'scorecard', id: 'sc-burn', path: '/scorecards' },
        },
      ],
      counts: { alerts: 1, criticalAlerts: 1 },
    });
    renderWithProviders(<HomePage />, { route: '/home' });
    await waitFor(() => {
      expect(screen.getByText(/Site Reliability/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/1 critical/i)).toBeInTheDocument();
  });

  it('renders the security persona description and recommendations card', async () => {
    useSnapshot({
      persona: 'security',
      recommendations: [
        {
          id: 'rec-1',
          kind: 'scorecard_fix',
          title: 'Add SBOM to billing-service',
          reason: 'Plugin scorecard finding',
          severity: 'warning',
          score: 0.82,
          action: { kind: 'scorecard', id: 'sc-1', path: '/scorecards' },
        },
      ],
      counts: { recommendations: 1 },
    });
    renderWithProviders(<HomePage />, { route: '/home' });
    await waitFor(() => {
      expect(screen.getByText(/Security/i)).toBeInTheDocument();
    });
    const region = screen.getByTestId('home-recommendations-card');
    expect(region).toHaveTextContent(/Add SBOM/i);
  });

  it('renders the manager persona with the description copy', async () => {
    useSnapshot({ persona: 'manager' });
    renderWithProviders(<HomePage />, { route: '/home' });
    await waitFor(() => {
      expect(screen.getByText(/Track delivery flow/i)).toBeInTheDocument();
    });
  });

  it('surfaces a degraded-feed warning when the backend reports degraded feeds', async () => {
    useSnapshot({ persona: 'developer', degraded: ['alerts'] });
    renderWithProviders(<HomePage />, { route: '/home' });
    await waitFor(() => {
      expect(
        screen.getByText(/Some home widgets returned partial data/i),
      ).toBeInTheDocument();
    });
  });

  it('records an engagement signal when an approval card is clicked', async () => {
    let posted = 0;
    useSnapshot({
      persona: 'developer',
      approvals: [
        {
          id: 'a1',
          title: 'deploy core',
          risk: 'medium',
          severity: 'warning',
          environment: 'prod',
          waitingForYou: true,
          createdAt: '2026-04-26T11:30:00Z',
          action: { kind: 'approval', id: 'a1', path: '/approvals/a1' },
        },
      ],
      counts: { approvals: 1 },
    });
    server.use(
      http.post(`${API}/home/actions`, async () => {
        posted += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = renderWithProviders(<HomePage />, { route: '/home' });
    const link = await screen.findByRole('link', { name: /deploy core/i });
    await user.click(link);
    await waitFor(() => expect(posted).toBeGreaterThan(0));
  });

  it('does not render unauthorized data when the snapshot returns no items', async () => {
    useSnapshot({ persona: 'developer' });
    renderWithProviders(<HomePage />, { route: '/home' });
    await waitFor(() => {
      expect(screen.getByText(/No approvals waiting for you/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/No active alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/No recommendations right now/i)).toBeInTheDocument();
  });
});
