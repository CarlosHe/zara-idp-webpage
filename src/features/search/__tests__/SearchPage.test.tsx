// Sprint-18 / L-1808 — feature-level coverage for the Search page:
// saved-search CRUD, advanced filters, click-through telemetry. The
// component is wired through RTK Query, so MSW handlers stand in for
// the real REST endpoints.
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { SearchPage } from '../components/SearchPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

describe('<SearchPage />', () => {
  it('lists saved searches and applies them to the form', async () => {
    server.use(
      http.get('*/api/v1/search/saved', () =>
        HttpResponse.json({
          items: [
            {
              id: 'saved-1',
              name: 'Production services',
              owner: 'system',
              text: 'billing',
              scopes: ['catalog'],
              filters: { kind: 'Service', namespace: 'production' },
              createdAt: '2026-04-26T00:00:00Z',
            },
          ],
        }),
      ),
    );

    renderWithProviders(<SearchPage />);

    expect(await screen.findByText('Production services')).toBeInTheDocument();
    const applyButton = screen.getByRole('button', { name: 'Apply' });
    await userEvent.click(applyButton);

    expect(screen.getByLabelText('Search query')).toHaveValue('billing');
    expect(screen.getByLabelText('Kind')).toHaveValue('Service');
    expect(screen.getByLabelText('Namespace')).toHaveValue('production');
  });

  it('runs a search and posts a click-through when a result is opened', async () => {
    let clickPayload: unknown = null;

    server.use(
      http.get('*/api/v1/search/saved', () => HttpResponse.json({ items: [] })),
      http.post('*/api/v1/search', () =>
        HttpResponse.json({
          items: [
            {
              id: 'r-1',
              scope: 'catalog',
              entityKey: 'Service/default/billing',
              title: 'billing',
              body: 'billing service',
              tags: [],
              attributes: {},
              score: 1,
              correlationId: '',
              version: 1,
              indexedAt: '2026-04-26T00:00:00Z',
            },
          ],
          total: 1,
          traceId: 'trace-1',
          latencyMs: 4,
        }),
      ),
      http.post('*/api/v1/search/click', async ({ request }) => {
        clickPayload = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<SearchPage />);

    await userEvent.type(screen.getByLabelText('Search query'), 'billing');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    const resultButton = await screen.findByRole('button', {
      name: /Open search result billing/,
    });
    await userEvent.click(resultButton);

    await waitFor(() => {
      expect(clickPayload).toEqual({ scope: 'catalog', queryText: 'billing', rank: 1 });
    });
  });
});
