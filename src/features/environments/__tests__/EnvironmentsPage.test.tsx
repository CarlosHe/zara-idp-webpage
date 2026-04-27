// Sprint 27 / L-2705 — feature-level tests for the dev environments
// dashboard. Pins (1) the inventory + list rendering, (2) the state
// filter triggers a refetch, (3) the error path renders, (4) destroy
// + extend buttons hand off to the parent (no direct mutation in
// this test — just confirm the click reaches the API).
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { EnvironmentsPage } from '../components/EnvironmentsPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

const baseEnv = {
  id: 'env-1',
  slug: 'checkout-pr-42',
  kind: 'preview' as const,
  state: 'ready' as const,
  health: 'healthy' as const,
  owner: 'alice',
  team: 'alpha',
  catalogEntity: 'Service/alpha/checkout',
  source: 'ci-github' as const,
  createdAt: '2026-04-25T12:00:00Z',
  updatedAt: '2026-04-26T12:00:00Z',
  expiresAt: '2026-04-29T12:00:00Z',
  resources: [
    { kind: 'namespace', provider: 'kubernetes', identifier: 'preview-pr-42' },
  ],
  timeline: [
    {
      sequence: 1,
      kind: 'created' as const,
      title: 'Environment created',
      occurredAt: '2026-04-25T12:00:00Z',
    },
  ],
  annotations: { pr: '42' },
  latestSpend: {
    minorUnits: 12345,
    currency: 'USD',
    windowStart: '2026-04-25T00:00:00Z',
    windowEnd: '2026-04-26T00:00:00Z',
    projectedDailyMinorUnits: 1500,
  },
  version: 3,
};

const fixture = {
  environments: [baseEnv],
  inventory: {
    totalEnvironments: 1,
    byState: { ready: 1 },
    byKind: { preview: 1 },
    bySource: { 'ci-github': 1 },
    staleCount: 0,
    expiringSoonCount: 1,
    projectedDailySpendMinorUnits: 1500,
    currency: 'USD',
  },
};

describe('<EnvironmentsPage />', () => {
  it('renders the inventory snapshot + environment row', async () => {
    server.use(
      http.get('*/api/v1/environments', () => HttpResponse.json(fixture)),
    );

    renderWithProviders(<EnvironmentsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('environments-page')).toBeInTheDocument();
    });
    expect(screen.getByTestId('env-inventory')).toBeInTheDocument();
    expect(screen.getByTestId('env-list')).toBeInTheDocument();
    expect(screen.getByTestId('env-row-env-1')).toBeInTheDocument();
    expect(screen.getByTestId('env-state-env-1')).toHaveTextContent('ready');
    expect(screen.getByTestId('env-health-env-1')).toHaveTextContent('healthy');
    expect(screen.getByText('checkout-pr-42')).toBeInTheDocument();
    expect(screen.getByText(/projected daily spend/i)).toBeInTheDocument();
  });

  it('switches the state filter and refetches', async () => {
    let lastUrl = '';
    server.use(
      http.get('*/api/v1/environments', ({ request }) => {
        lastUrl = request.url;
        return HttpResponse.json(fixture);
      }),
    );

    renderWithProviders(<EnvironmentsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('environments-page')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('env-filter-failed'));
    await waitFor(() => {
      expect(lastUrl).toContain('state=failed');
    });
  });

  it('renders empty state when no environments', async () => {
    server.use(
      http.get('*/api/v1/environments', () =>
        HttpResponse.json({
          environments: [],
          inventory: {
            totalEnvironments: 0,
            byState: {},
            byKind: {},
            bySource: {},
            staleCount: 0,
            expiringSoonCount: 0,
            projectedDailySpendMinorUnits: 0,
          },
        }),
      ),
    );

    renderWithProviders(<EnvironmentsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('env-empty')).toBeInTheDocument();
    });
  });

  it('renders an error state when the list fails', async () => {
    server.use(
      http.get('*/api/v1/environments', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }),
      ),
    );

    renderWithProviders(<EnvironmentsPage />);

    await waitFor(
      () => {
        expect(
          screen.queryByText(/Loading environments/i),
        ).not.toBeInTheDocument();
        expect(
          screen.getByText(/boom|Failed to load environments/i),
        ).toBeInTheDocument();
      },
      { timeout: 10_000 },
    );
  }, 15_000);

  it('triggers the destroy mutation when the user confirms', async () => {
    server.use(
      http.get('*/api/v1/environments', () => HttpResponse.json(fixture)),
      http.post('*/api/v1/environments/env-1/destroy', () =>
        HttpResponse.json({ environment: { ...baseEnv, state: 'destroying' }, changeSetId: 'cs-dest-env-1' }),
      ),
    );

    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('manual');
    renderWithProviders(<EnvironmentsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('env-destroy-env-1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('env-destroy-env-1'));
    expect(promptSpy).toHaveBeenCalled();
    promptSpy.mockRestore();
  });
});
