import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { ApprovalsPage } from '../components/ApprovalsPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

const approval = {
  id: 'apr-1',
  resourceKind: 'Application',
  resourceNamespace: 'platform',
  resourceName: 'checkout',
  operation: 'update',
  status: 'pending',
  requestedBy: 'alice@example.com',
  requestedAt: '2026-04-26T12:00:00Z',
  reason: 'scale up',
  expiresAt: '2026-04-27T12:00:00Z',
};

describe('<ApprovalsPage />', () => {
  it('renders the approval list', async () => {
    server.use(
      http.get('*/api/v1/approvals', () =>
        HttpResponse.json({ items: [approval], total: 1 }),
      ),
    );

    renderWithProviders(<ApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText('checkout')).toBeInTheDocument();
    });
    expect(screen.getByText('Approvals')).toBeInTheDocument();
  });

  it('renders the empty state', async () => {
    server.use(
      http.get('*/api/v1/approvals', () =>
        HttpResponse.json({ items: [], total: 0 }),
      ),
    );

    renderWithProviders(<ApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText(/No approvals found/i)).toBeInTheDocument();
    });
  });

  it('renders the error state', async () => {
    server.use(
      http.get('*/api/v1/approvals', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }),
      ),
    );

    renderWithProviders(<ApprovalsPage />);

    await waitFor(
      () => {
        expect(
          screen.getByText(/boom|Failed to load approvals/i),
        ).toBeInTheDocument();
      },
      { timeout: 10_000 },
    );
  }, 15_000);
});
