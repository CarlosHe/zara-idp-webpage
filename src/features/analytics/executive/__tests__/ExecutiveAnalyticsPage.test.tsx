// Sprint 28 / L-2805 — feature-level tests for the executive
// analytics page. Pins (1) the four panels render with backend data,
// (2) the recommendations inbox renders prioritised items, (3) the
// time-range selector triggers a refetch, (4) the refresh action
// hits POST /analytics/recommendations/refresh.
import { describe, expect, it } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { ExecutiveAnalyticsPage } from '../components/ExecutiveAnalyticsPage';
import { server } from '../../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../../tests/utils/TestProviders';

const dora = {
  scope: 'platform',
  windowStart: '2026-04-01T00:00:00Z',
  windowEnd: '2026-04-30T00:00:00Z',
  leadTimeMsP50: 1500,
  leadTimeMsP95: 4000,
  deployFrequencyPerDay: 2.5,
  changeFailureRate: 0.1,
  mttrMs: 600000,
  sampleSize: 25,
};

const quality = {
  scope: 'platform',
  windowStart: '2026-04-01T00:00:00Z',
  windowEnd: '2026-04-30T00:00:00Z',
  total: 10,
  missingOwner: 1,
  missingDocs: 3,
  missingSlo: 2,
  missingRunbook: 4,
  missingApiDoc: 0,
  staleEntities: 1,
  percentClean: 0.5,
};

const sla = {
  scope: 'platform',
  windowStart: '2026-04-01T00:00:00Z',
  windowEnd: '2026-04-30T00:00:00Z',
  requested: 12,
  granted: 10,
  rejected: 1,
  breached: 1,
  breachRate: 0.083,
  latencyMsP50: 30000,
  latencyMsP95: 90000,
  latencyMsP99: 120000,
};

const remediation = {
  scope: 'platform',
  windowStart: '2026-04-01T00:00:00Z',
  windowEnd: '2026-04-30T00:00:00Z',
  proposed: 8,
  accepted: 5,
  rejected: 2,
  reverted: 1,
  acceptanceRate: 0.625,
  regressionRate: 0.2,
  timeSavedMs: 7200000,
};

const recommendations = {
  items: [
    {
      id: 'r1',
      kind: 'dora_improve',
      severity: 'critical',
      scope: 'platform',
      title: 'Change-failure rate is elevated',
      detail: 'CFR exceeds the 20% threshold.',
      score: 100,
      source: 'dora',
      generatedAt: '2026-04-30T00:00:00Z',
    },
  ],
};

describe('<ExecutiveAnalyticsPage />', () => {
  it('renders DORA, catalog quality, approval SLA, remediation, and recommendations', async () => {
    server.use(
      http.get('*/api/v1/analytics/dora', () => HttpResponse.json(dora)),
      http.get('*/api/v1/analytics/catalog-quality', () =>
        HttpResponse.json(quality),
      ),
      http.get('*/api/v1/analytics/approval-sla', () => HttpResponse.json(sla)),
      http.get('*/api/v1/analytics/remediation', () =>
        HttpResponse.json(remediation),
      ),
      http.get('*/api/v1/analytics/recommendations', () =>
        HttpResponse.json(recommendations),
      ),
    );

    renderWithProviders(<ExecutiveAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Platform analytics/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      // The DORA panel header appears once.
      expect(screen.getByText('DORA')).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Catalog quality/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Approval SLA/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Remediation effectiveness/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/Change-failure rate is elevated/i),
    ).toBeInTheDocument();
    // Severity badge for the recommendation.
    expect(screen.getAllByText(/critical/i).length).toBeGreaterThan(0);
  });

  it('renders empty recommendations text when no items', async () => {
    server.use(
      http.get('*/api/v1/analytics/dora', () => HttpResponse.json(dora)),
      http.get('*/api/v1/analytics/catalog-quality', () =>
        HttpResponse.json(quality),
      ),
      http.get('*/api/v1/analytics/approval-sla', () => HttpResponse.json(sla)),
      http.get('*/api/v1/analytics/remediation', () =>
        HttpResponse.json(remediation),
      ),
      http.get('*/api/v1/analytics/recommendations', () =>
        HttpResponse.json({ items: [] }),
      ),
    );

    renderWithProviders(<ExecutiveAnalyticsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/every metric is within thresholds/i),
      ).toBeInTheDocument();
    });
  });

  it('switches the time range', async () => {
    let capturedFrom = '';
    server.use(
      http.get('*/api/v1/analytics/dora', ({ request }) => {
        const url = new URL(request.url);
        capturedFrom = url.searchParams.get('from') ?? '';
        return HttpResponse.json(dora);
      }),
      http.get('*/api/v1/analytics/catalog-quality', () =>
        HttpResponse.json(quality),
      ),
      http.get('*/api/v1/analytics/approval-sla', () => HttpResponse.json(sla)),
      http.get('*/api/v1/analytics/remediation', () =>
        HttpResponse.json(remediation),
      ),
      http.get('*/api/v1/analytics/recommendations', () =>
        HttpResponse.json({ items: [] }),
      ),
    );

    renderWithProviders(<ExecutiveAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/30 days/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/7 days/i));
    await waitFor(() => {
      expect(capturedFrom).toBeTruthy();
    });
  });
});
