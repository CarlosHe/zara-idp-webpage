import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { FreezesPage } from '../components/FreezesPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

const freeze = {
  id: 'frz-1',
  name: 'holiday-freeze',
  reason: 'Year-end freeze',
  createdBy: 'sre@example.com',
  createdAt: '2026-12-20T00:00:00Z',
  expiresAt: '2027-01-05T00:00:00Z',
  scope: {
    namespaces: ['prod'],
    teams: [],
    kinds: [],
    global: false,
  },
  allowedOperations: [],
  active: true,
};

describe('<FreezesPage />', () => {
  it('renders active freezes', async () => {
    server.use(
      http.get('*/api/v1/freezes', () =>
        HttpResponse.json({ items: [freeze], total: 1 }),
      ),
    );

    renderWithProviders(<FreezesPage />);

    await waitFor(() => {
      expect(screen.getByText('holiday-freeze')).toBeInTheDocument();
    });
    expect(screen.getByText('Freezes')).toBeInTheDocument();
  });

  it('renders the empty state', async () => {
    server.use(
      http.get('*/api/v1/freezes', () =>
        HttpResponse.json({ items: [], total: 0 }),
      ),
    );

    renderWithProviders(<FreezesPage />);

    await waitFor(() => {
      expect(screen.getByText(/No active freezes/i)).toBeInTheDocument();
    });
  });

  it('renders the error state', async () => {
    server.use(
      http.get('*/api/v1/freezes', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }),
      ),
    );

    renderWithProviders(<FreezesPage />);

    await waitFor(
      () => {
        expect(
          screen.getByText(/boom|Failed to load freezes/i),
        ).toBeInTheDocument();
      },
      { timeout: 10_000 },
    );
  }, 15_000);
});
