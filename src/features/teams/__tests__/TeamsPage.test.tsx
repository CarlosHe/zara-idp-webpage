import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { TeamsPage } from '../components/TeamsPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

const team = {
  id: 'team-1',
  kind: 'Team',
  metadata: {
    name: 'platform',
    namespace: 'default',
    labels: {},
    annotations: {},
  },
  spec: {
    displayName: 'Platform Team',
    description: 'Owns the control plane',
    costCenter: 'CC-1',
    channels: {
      alerts: '#platform-alerts',
      general: '#platform',
      incidents: '#platform-inc',
      deployments: '#platform-deploys',
    },
    labels: {},
  },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

describe('<TeamsPage />', () => {
  it('renders the team list', async () => {
    server.use(
      http.get('*/api/v1/teams', () =>
        HttpResponse.json({ items: [team], total: 1 }),
      ),
    );

    renderWithProviders(<TeamsPage />);

    await waitFor(() => {
      expect(screen.getByText('Platform Team')).toBeInTheDocument();
    });
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });

  it('renders the empty state', async () => {
    server.use(
      http.get('*/api/v1/teams', () =>
        HttpResponse.json({ items: [], total: 0 }),
      ),
    );

    renderWithProviders(<TeamsPage />);

    await waitFor(() => {
      expect(screen.getByText(/No teams found/i)).toBeInTheDocument();
    });
  });

  it('renders the error state', async () => {
    server.use(
      http.get('*/api/v1/teams', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }),
      ),
    );

    renderWithProviders(<TeamsPage />);

    await waitFor(
      () => {
        expect(
          screen.getByText(/boom|Failed to load teams/i),
        ).toBeInTheDocument();
      },
      { timeout: 10_000 },
    );
  }, 15_000);
});
