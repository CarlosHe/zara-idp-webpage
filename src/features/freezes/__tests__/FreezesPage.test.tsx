import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
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
  beforeEach(() => {
    server.use(http.get('*/api/v1/me', () => HttpResponse.json({
      subject: 'admin', username: 'admin', authenticated: true, is_admin: true,
      roles: ['admin'], namespaces: ['prod'], current_namespace: 'prod',
    })));
  });

  it('creates a scoped freeze and refreshes persisted results', async () => {
    let saved: Record<string, unknown> | undefined;
    server.use(
      http.get('*/api/v1/freezes', () => HttpResponse.json({ items: saved ? [{ ...freeze, ...saved }] : [] })),
      http.post('*/api/v1/freezes', async ({ request }) => {
        saved = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ ...freeze, ...saved }, { status: 201 });
      }),
    );
    const { user } = renderWithProviders(<FreezesPage />);
    await user.click(await screen.findByRole('button', { name: 'Create freeze' }));
    await user.type(screen.getByLabelText('Name'), 'release-freeze');
    await user.type(screen.getByLabelText('Reason'), 'Release validation');
    await user.type(screen.getByLabelText('Namespaces'), 'prod, prod');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create freeze' }));
    expect(await screen.findByText('release-freeze')).toBeInTheDocument();
    expect(saved).toMatchObject({ name: 'release-freeze', scope: { namespaces: ['prod'], global: false } });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the editor and shows the server reason when saving fails', async () => {
    server.use(http.get('*/api/v1/freezes', () => HttpResponse.json({ items: [] })),
      http.post('*/api/v1/freezes', () => HttpResponse.json({ error: { message: 'freeze service unavailable' } }, { status: 503 })));
    const { user } = renderWithProviders(<FreezesPage />);
    await user.click(await screen.findByRole('button', { name: 'Create freeze' }));
    await user.type(screen.getByLabelText('Name'), 'release-freeze');
    await user.type(screen.getByLabelText('Reason'), 'Release validation');
    await user.click(screen.getByLabelText(/Global scope/));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create freeze' }));
    expect(await screen.findByText('freeze service unavailable')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('hides management actions from viewers', async () => {
    server.use(http.get('*/api/v1/me', () => HttpResponse.json({ subject: 'viewer', authenticated: true, is_admin: false })),
      http.get('*/api/v1/freezes', () => HttpResponse.json({ items: [] })));
    renderWithProviders(<FreezesPage />);
    await screen.findByText(/No active freezes/i);
    expect(screen.queryByRole('button', { name: 'Create freeze' })).not.toBeInTheDocument();
  });
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
