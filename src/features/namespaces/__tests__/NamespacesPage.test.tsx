import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { NamespacesPage } from '../components/NamespacesPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

const ns = {
  id: 'ns-1',
  name: 'payments',
  description: 'Payments domain',
  owner: {
    team: 'payments-team',
    contact: 'payments@example.com',
    slack: '#payments',
    oncall: 'payments-oncall',
  },
  context: {
    domain: 'commerce',
    tier: 'production',
    environment: 'prod',
    costCenter: 'CC-1',
    tags: {},
  },
  quotas: {
    databases: 5,
    roles: 10,
    schemas: 10,
    applications: 20,
    secrets: 50,
    storageGB: 100,
    maxConnections: 200,
  },
  status: 'active',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

describe('<NamespacesPage />', () => {
  it('renders the namespace list', async () => {
    server.use(
      http.get('*/api/v1/namespaces', () =>
        HttpResponse.json({ items: [ns], total: 1 }),
      ),
    );

    renderWithProviders(<NamespacesPage />);

    await waitFor(() => {
      expect(screen.getByText('payments')).toBeInTheDocument();
    });
    expect(screen.getByText('Namespaces')).toBeInTheDocument();
  });

  it('renders the empty state', async () => {
    server.use(
      http.get('*/api/v1/namespaces', () =>
        HttpResponse.json({ items: [], total: 0 }),
      ),
    );

    renderWithProviders(<NamespacesPage />);

    await waitFor(() => {
      expect(screen.getByText(/No namespaces found/i)).toBeInTheDocument();
    });
  });

  it('renders the error state', async () => {
    server.use(
      http.get('*/api/v1/namespaces', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }),
      ),
    );

    renderWithProviders(<NamespacesPage />);

    await waitFor(
      () => {
        expect(screen.getByText(/Error loading namespaces/i)).toBeInTheDocument();
      },
      { timeout: 10_000 },
    );
  }, 15_000);
});
