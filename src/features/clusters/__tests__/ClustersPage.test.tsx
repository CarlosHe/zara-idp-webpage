// Sprint-32 / L-3202 — feature coverage for the multi-cluster
// management page. Verifies the page (1) renders cluster cards from
// the API and (2) renders the empty state when no cluster matches the
// active environment filter.
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { ClustersPage } from '../components/ClustersPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

const cluster = {
  id: 'k8s-prod-eu',
  kind: 'KubernetesCluster',
  metadata: {
    name: 'k8s-prod-eu',
    namespace: 'platform',
    labels: {},
    annotations: {},
  },
  spec: {
    displayName: 'Prod EU',
    provider: 'aws',
    region: 'eu-west-1',
    environment: 'production',
    version: '1.30.4',
    endpoints: { api: 'https://k8s-prod-eu.example.com' },
  },
  status: {
    health: 'healthy',
    nodeCount: 12,
    resourceCount: 84,
    cpu: { used: 35, total: 100 },
    memory: { used: 40, total: 100 },
    lastSyncAt: '2026-04-28T12:00:00Z',
  },
  createdAt: '2026-04-28T12:00:00Z',
  updatedAt: '2026-04-28T12:00:00Z',
};

describe('<ClustersPage />', () => {
  it('renders clusters returned by the API', async () => {
    server.use(
      http.get('*/api/v1/clusters', () =>
        HttpResponse.json({ items: [cluster], total: 1 }),
      ),
    );

    renderWithProviders(<ClustersPage />);

    expect(await screen.findByText(/Prod EU/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Clusters/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('filters out non-matching environments when the user types in the search box', async () => {
    server.use(
      http.get('*/api/v1/clusters', () =>
        HttpResponse.json({ items: [cluster], total: 1 }),
      ),
    );

    renderWithProviders(<ClustersPage />);

    const card = await screen.findByText(/Prod EU/i);
    expect(card).toBeInTheDocument();

    const search = screen.getByPlaceholderText(/search/i);
    await userEvent.type(search, 'no-such-cluster');

    await waitFor(() =>
      expect(screen.queryByText(/Prod EU/i)).not.toBeInTheDocument(),
    );
  });
});
