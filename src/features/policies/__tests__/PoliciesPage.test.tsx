import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { PoliciesPage } from '../components/PoliciesPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

const policy = {
  id: 'pol-1',
  namespace: 'platform',
  name: 'require-approval',
  description: 'Require approval for prod',
  enabled: true,
  triggers: [{ type: 'manual', source: 'ui', conditions: {} }],
  scope: {
    namespaces: ['prod'],
    kinds: ['Application'],
    labels: {},
    excludeLabels: {},
  },
  action: {
    type: 'requireApproval',
    message: 'Approval required',
    notifyChannels: [],
  },
};

describe('<PoliciesPage />', () => {
  it('renders the policy list', async () => {
    server.use(
      http.get('*/api/v1/policies/runtime', () =>
        HttpResponse.json({ items: [policy], total: 1 }),
      ),
    );

    renderWithProviders(<PoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText('require-approval')).toBeInTheDocument();
    });
    expect(screen.getByText('Runtime Policies')).toBeInTheDocument();
  });

  it('renders the empty state', async () => {
    server.use(
      http.get('*/api/v1/policies/runtime', () =>
        HttpResponse.json({ items: [], total: 0 }),
      ),
    );

    renderWithProviders(<PoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText(/No active policies/i)).toBeInTheDocument();
    });
  });

  it('renders the error state', async () => {
    server.use(
      http.get('*/api/v1/policies/runtime', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }),
      ),
    );

    renderWithProviders(<PoliciesPage />);

    await waitFor(
      () => {
        expect(
          screen.getByText(/boom|Failed to load runtime policies/i),
        ).toBeInTheDocument();
      },
      { timeout: 10_000 },
    );
  }, 15_000);
});
