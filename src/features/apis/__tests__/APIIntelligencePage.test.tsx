// Sprint-20 / L-2009 feature-level tests for the API intelligence page.
// Covers the empty state and the populated state via the live RTK Query
// slice + MSW.
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { APIIntelligencePage } from '../components/APIIntelligencePage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

describe('<APIIntelligencePage />', () => {
  it('renders the empty registry state when no APIs are registered', async () => {
    renderWithProviders(<APIIntelligencePage />);
    await waitFor(() => {
      expect(screen.getByText(/No APIs registered yet/i)).toBeInTheDocument();
    });
  });

  it('lists APIs from the registry endpoint', async () => {
    server.use(
      http.get('*/api/v1/apis', () =>
        HttpResponse.json({
          items: [
            {
              id: '1',
              namespace: 'payments',
              name: 'checkout',
              owner: 'team:platform',
              type: 'rest',
              lifecycle: 'production',
              versionsCount: 1,
              consumersCount: 0,
              latestSemver: '1.0.0',
              deprecation: {},
            },
          ],
        }),
      ),
    );

    renderWithProviders(<APIIntelligencePage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Select payments/checkout' })).toBeInTheDocument();
    });
  });
});
