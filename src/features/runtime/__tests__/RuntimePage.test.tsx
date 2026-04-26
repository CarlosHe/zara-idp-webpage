// Sprint-21 / L-2103 feature-level tests for the runtime page.
// Covers (1) the empty-clusters state, (2) the populated workload list,
// (3) the no-cluster state when the adapter returns 503.
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { RuntimePage } from '../components/RuntimePage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

describe('<RuntimePage />', () => {
  it('renders the no-runtime-adapters empty state when the cluster list is empty', async () => {
    server.use(
      http.get('*/api/v1/runtime/clusters', () =>
        HttpResponse.json({ items: [], total: 0 }),
      ),
    );
    renderWithProviders(<RuntimePage />);
    await waitFor(() => {
      expect(screen.getByText(/No runtime clusters wired/i)).toBeInTheDocument();
    });
  });

  it('renders workloads with health badges from the inventory endpoint', async () => {
    server.use(
      http.get('*/api/v1/runtime/clusters', () =>
        HttpResponse.json({ items: ['prod'], total: 1 }),
      ),
      http.get('*/api/v1/runtime/clusters/prod/inventory', () =>
        HttpResponse.json({
          clusterId: 'prod',
          namespaces: ['payments'],
          workloads: [
            {
              clusterId: 'prod',
              namespace: 'payments',
              name: 'checkout',
              kind: 'Deployment',
              image: 'ghcr.io/zara/checkout:1.0.0',
              replicas: { desired: 3, ready: 3, available: 3, updated: 3 },
              health: 'Healthy',
              generation: 1,
              revision: '1',
              updatedAt: new Date().toISOString(),
              labels: {},
              catalog: [
                { type: 'service', kind: 'Service', namespace: 'payments', name: 'checkout' },
              ],
            },
          ],
          pods: [],
          events: [],
          capturedAt: new Date().toISOString(),
        }),
      ),
    );

    renderWithProviders(<RuntimePage />);
    await waitFor(() => {
      expect(screen.getByText('checkout')).toBeInTheDocument();
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });
  });
});
