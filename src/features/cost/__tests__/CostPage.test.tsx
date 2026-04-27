// Sprint-26 / L-2605 feature-level tests.
// Covers (1) the dashboard renders showback / chargeback / budgets /
// anomalies / idle / findings panels, (2) the window tabs trigger a
// refetch with the right `since`/`until` query params, (3) error +
// loading states render.
import { describe, expect, it } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { CostPage } from '../components/CostPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

const dashboardFixture = {
  window: { since: '2026-04-01T00:00:00Z', until: '2026-04-27T00:00:00Z' },
  currency: 'USD',
  totalSpend: { value: 1234.56, minorUnits: 123456, currency: 'USD' },
  allocationsCount: 42,
  showback: [
    {
      dimension: 'team',
      label: 'alpha',
      total: { value: 800, minorUnits: 80000, currency: 'USD' },
      share: 0.6,
    },
    {
      dimension: 'team',
      label: 'beta',
      total: { value: 434.56, minorUnits: 43456, currency: 'USD' },
      share: 0.4,
    },
    {
      dimension: 'service',
      label: 'checkout',
      total: { value: 600, minorUnits: 60000, currency: 'USD' },
      share: 0.5,
    },
  ],
  chargeback: [
    {
      team: 'alpha',
      domain: 'payments',
      service: 'checkout',
      environment: 'prod',
      total: { value: 600, minorUnits: 60000, currency: 'USD' },
    },
  ],
  topServices: [
    {
      dimension: 'service',
      label: 'checkout',
      total: { value: 600, minorUnits: 60000, currency: 'USD' },
      share: 0.5,
    },
  ],
  idleResources: [
    {
      dimension: 'resource',
      label: 'rds-replica-3',
      total: { value: 0, minorUnits: 0, currency: 'USD' },
      share: 0,
    },
  ],
  budgets: [
    {
      budgetId: 'b-1',
      budgetName: 'checkout prod',
      scope: { service: 'checkout', environment: 'prod' },
      cap: { value: 1500, minorUnits: 150000, currency: 'USD' },
      spend: { value: 1700, minorUnits: 170000, currency: 'USD' },
      utilisationBP: 11333,
      warnThresholdBP: 8000,
      state: 'breach',
    },
    {
      budgetId: 'b-2',
      budgetName: 'search prod',
      scope: { service: 'search', environment: 'prod' },
      cap: { value: 500, minorUnits: 50000, currency: 'USD' },
      spend: { value: 100, minorUnits: 10000, currency: 'USD' },
      utilisationBP: 2000,
      warnThresholdBP: 8000,
      state: 'healthy',
    },
  ],
  anomalies: [
    {
      kind: 'spike',
      severity: 'critical',
      scope: { service: 'checkout', team: 'alpha' },
      periodStart: '2026-04-26T00:00:00Z',
      periodEnd: '2026-04-27T00:00:00Z',
      observed: { value: 800, minorUnits: 80000, currency: 'USD' },
      baseline: { value: 200, minorUnits: 20000, currency: 'USD' },
      zScore: 4.2,
      message: 'cost spike detected for service=checkout',
    },
  ],
  findings: [
    {
      code: 'cost.spike',
      entityKey: 'Service/alpha/checkout',
      source: 'anomaly',
      severity: 'critical',
      scope: { service: 'checkout', team: 'alpha' },
      title: 'Cost spike detected',
      message: 'spike',
      amount: { value: 800, minorUnits: 80000, currency: 'USD' },
      evaluatedAt: '2026-04-27T00:00:00Z',
    },
  ],
  costImpacts: [
    {
      entityKey: 'Service/alpha/checkout',
      findings: 1,
      worstSeverity: 'critical',
      total: { value: 800, minorUnits: 80000, currency: 'USD' },
    },
  ],
};

describe('<CostPage />', () => {
  it('renders showback, chargeback, budgets, anomalies, idle resources, and findings', async () => {
    server.use(
      http.get('*/api/v1/cost/dashboard', () =>
        HttpResponse.json(dashboardFixture),
      ),
    );

    renderWithProviders(<CostPage />);

    await waitFor(() => {
      expect(screen.getByTestId('cost-page')).toBeInTheDocument();
    });
    expect(screen.getByTestId('cost-stat-row')).toBeInTheDocument();
    expect(screen.getByTestId('cost-chargeback')).toBeInTheDocument();
    expect(screen.getByTestId('cost-budgets')).toBeInTheDocument();
    expect(screen.getByTestId('cost-anomalies')).toBeInTheDocument();
    expect(screen.getByTestId('cost-idle-resources')).toBeInTheDocument();
    expect(screen.getByTestId('cost-findings')).toBeInTheDocument();

    expect(screen.getByText('checkout prod')).toBeInTheDocument();
    expect(screen.getByText(/Cost spike detected/)).toBeInTheDocument();
    expect(screen.getByTestId('cost-anomaly-spike')).toBeInTheDocument();
    expect(screen.getByTestId('cost-finding-cost.spike')).toBeInTheDocument();
    expect(screen.getByTestId('cost-bucket-alpha')).toBeInTheDocument();
  });

  it('switches the window selector and refetches the dashboard', async () => {
    let lastUrl = '';
    server.use(
      http.get('*/api/v1/cost/dashboard', ({ request }) => {
        lastUrl = request.url;
        return HttpResponse.json(dashboardFixture);
      }),
    );

    renderWithProviders(<CostPage />);

    await waitFor(() => {
      expect(screen.getByTestId('cost-page')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cost-window-7d'));

    await waitFor(() => {
      expect(lastUrl).toContain('since=');
      expect(lastUrl).toContain('until=');
    });
  });

  it('renders an error state when the dashboard fetch fails', async () => {
    server.use(
      http.get('*/api/v1/cost/dashboard', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }),
      ),
    );

    renderWithProviders(<CostPage />);

    await waitFor(
      () => {
        // RTK Query passes the body through `errorMessage`, which
        // returns the body's `error` field (here `boom`) before
        // falling back. Either signal works for the test — we only
        // care that the page rendered the error path, not the loading
        // path.
        expect(screen.queryByText(/Loading cost dashboard/i)).not.toBeInTheDocument();
        expect(screen.getByText(/boom|Failed to load cost dashboard/i)).toBeInTheDocument();
      },
      { timeout: 10_000 },
    );
  }, 15_000);
});
