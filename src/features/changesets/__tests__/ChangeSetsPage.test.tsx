import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';
import { ChangeSetsPage } from '../components/ChangeSetsPage';

describe('ChangeSetsPage', () => {
  it('renders empty state', async () => {
    server.use(
      http.get('*/api/v1/changesets', () =>
        HttpResponse.json({ changesets: [], total: 0, limit: 50, offset: 0 }),
      ),
    );
    renderWithProviders(<ChangeSetsPage />, { route: '/changesets' });
    expect(await screen.findByText(/No change sets/i)).toBeInTheDocument();
  });

  it('renders list rows', async () => {
    server.use(
      http.get('*/api/v1/changesets', () =>
        HttpResponse.json({
          changesets: [
            {
              id: 'cs-abc',
              approvalStatus: 'pending',
              totalRisk: 'medium',
              source: 'cli',
              requestedBy: 'alice',
              changes: [{ action: 'create' }],
              updatedAt: new Date().toISOString(),
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        }),
      ),
    );
    renderWithProviders(<ChangeSetsPage />, { route: '/changesets' });
    expect(await screen.findByText('cs-abc')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    // baseQueryWithRetry (maxRetries: 2) backs off on failures — allow time past default findBy.
    server.use(
      http.get('*/api/v1/changesets', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }),
      ),
    );
    renderWithProviders(<ChangeSetsPage />, { route: '/changesets' });
    await waitFor(
      () => {
        expect(screen.getByText(/Failed to load change sets/i)).toBeInTheDocument();
      },
      { timeout: 10_000 },
    );
  }, 15_000);
});
