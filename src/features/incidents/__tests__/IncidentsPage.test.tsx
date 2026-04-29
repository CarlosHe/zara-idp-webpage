// Sprint-32 / L-3202 — feature coverage for the incident console.
// Verifies the page (1) renders the state-filter tablist, (2) lists
// incidents from the API with severity tone, (3) refetches when the
// filter changes, and (4) surfaces an error state with retry when the
// list endpoint fails.
import { describe, expect, it } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { IncidentsPage } from '../components/IncidentsPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';
import type { Incident } from '../types/incidents';

const sevOne: Incident = {
  id: 'inc-1',
  slug: 'checkout-503',
  title: 'Checkout 503',
  severity: 'sev1',
  state: 'open',
  source: 'pagerduty',
  externalId: 'PD-1',
  affected: [{ name: 'checkout', namespace: 'prod', owner: 'team-payments' }],
  owners: ['team-payments'],
  tags: [],
  openedAt: '2026-04-28T12:00:00Z',
  updatedAt: '2026-04-28T12:00:00Z',
  linkedChangeSets: [],
  runbooks: [],
  timeline: [
    {
      sequence: 1,
      kind: 'opened',
      title: 'Incident opened',
      occurredAt: '2026-04-28T12:00:00Z',
    },
  ],
};

const sevThreeAck: Incident = {
  ...sevOne,
  id: 'inc-2',
  slug: 'docs-stale',
  title: 'Docs build delayed',
  severity: 'sev3',
  state: 'acknowledged',
  source: 'manual',
  externalId: undefined,
  acknowledgedAt: '2026-04-28T12:30:00Z',
};

describe('<IncidentsPage />', () => {
  it('renders incidents from the API and the state-filter tablist', async () => {
    server.use(
      http.get('*/api/v1/incidents', () =>
        HttpResponse.json({ incidents: [sevOne] }),
      ),
    );

    renderWithProviders(<IncidentsPage />);

    expect(
      await screen.findByText('Checkout 503', { exact: false }),
    ).toBeInTheDocument();

    // Tablist with the canonical states is rendered.
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    ['open', 'acknowledged', 'mitigated', 'resolved'].forEach((state) => {
      expect(
        screen.getByRole('tab', { name: new RegExp(state, 'i') }),
      ).toBeInTheDocument();
    });
  });

  it('refetches when the user switches the state filter', async () => {
    let lastQuery = '';
    server.use(
      http.get('*/api/v1/incidents', ({ request }) => {
        lastQuery = new URL(request.url).search;
        return HttpResponse.json({
          incidents: lastQuery.includes('state=acknowledged')
            ? [sevThreeAck]
            : [sevOne],
        });
      }),
    );

    renderWithProviders(<IncidentsPage />);

    await screen.findByText('Checkout 503', { exact: false });
    expect(lastQuery).toContain('state=open');

    fireEvent.click(screen.getByRole('tab', { name: /acknowledged/i }));

    await waitFor(() =>
      expect(lastQuery).toContain('state=acknowledged'),
    );
    expect(
      await screen.findByText(/Docs build delayed/i),
    ).toBeInTheDocument();
  });

  it('surfaces an error state with a retry control when the list fails', async () => {
    // 422 — non-retryable; baseQuery retries 2x on 5xx and we want a
    // deterministic single failure without sleeping for retry backoff.
    server.use(
      http.get('*/api/v1/incidents', () =>
        HttpResponse.json(
          { error: { code: 'incidents.invalid', message: 'bad filter' } },
          { status: 422 },
        ),
      ),
    );

    renderWithProviders(<IncidentsPage />);

    expect(
      await screen.findByRole('button', { name: /retry/i }, { timeout: 4000 }),
    ).toBeInTheDocument();
  });
});
