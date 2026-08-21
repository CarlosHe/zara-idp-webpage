import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';
import { StacksPage } from '../components/StacksPage';

describe('StacksPage', () => {
  it('renders empty state', async () => {
    server.use(http.get('*/api/v1/stacks', () => HttpResponse.json({ items: [] })));
    renderWithProviders(<StacksPage />, { route: '/stacks' });
    expect(await screen.findByText(/No stacks/i)).toBeInTheDocument();
  });

  it('renders stack rows', async () => {
    server.use(
      http.get('*/api/v1/stacks', () =>
        HttpResponse.json({
          items: [
            {
              id: 'stack-1',
              name: 'foundation',
              namespace: 'platform',
              environment: 'production',
              provider: 'aws',
              status: 'ready',
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      ),
    );
    renderWithProviders(<StacksPage />, { route: '/stacks' });
    expect(await screen.findByText('foundation')).toBeInTheDocument();
    expect(screen.getByText('aws')).toBeInTheDocument();
  });
});
