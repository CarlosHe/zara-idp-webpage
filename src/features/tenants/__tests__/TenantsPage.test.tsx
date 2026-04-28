// Sprint 29 / L-2904 — feature-level tests for the tenant
// administration console. Pins (1) the list rendering, (2) the
// lifecycle filter triggers a refetch, (3) the empty state, (4) the
// error path, (5) the create form happy path.
import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { TenantsPage } from '../components/TenantsPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

const baseTenant = {
  id: 'acme',
  slug: 'acme',
  displayName: 'Acme Industries',
  owner: 'owner@acme.io',
  admins: ['alice@acme.io'],
  lifecycle: 'active' as const,
  reason: '',
  createdAt: '2026-04-26T00:00:00Z',
  updatedAt: '2026-04-27T00:00:00Z',
  version: 1,
};

const fixture = { items: [baseTenant], count: 1 };

describe('<TenantsPage />', () => {
  it('renders the tenant list', async () => {
    server.use(
      http.get('*/api/v1/tenants', () => HttpResponse.json(fixture)),
    );

    renderWithProviders(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('tenants-page')).toBeInTheDocument();
    });
    expect(screen.getByTestId('tenants-list')).toBeInTheDocument();
    expect(screen.getByTestId('tenants-row-acme')).toBeInTheDocument();
    expect(screen.getByText(/Acme Industries/)).toBeInTheDocument();
    expect(screen.getByTestId('tenants-suspend-acme')).toBeInTheDocument();
  });

  it('switches the lifecycle filter and refetches', async () => {
    let lastUrl = '';
    server.use(
      http.get('*/api/v1/tenants', ({ request }) => {
        lastUrl = request.url;
        return HttpResponse.json(fixture);
      }),
    );

    renderWithProviders(<TenantsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tenants-page')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('tenants-filter-suspended'));
    await waitFor(() => {
      expect(lastUrl).toContain('lifecycle=suspended');
    });
  });

  it('renders the empty state', async () => {
    server.use(
      http.get('*/api/v1/tenants', () =>
        HttpResponse.json({ items: [], count: 0 }),
      ),
    );

    renderWithProviders(<TenantsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/No tenants match the current filter/i),
      ).toBeInTheDocument();
    });
  });

  it('renders the error state', async () => {
    server.use(
      http.get('*/api/v1/tenants', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }),
      ),
    );

    renderWithProviders(<TenantsPage />);
    await waitFor(
      () => {
        expect(
          screen.queryByText(/Loading tenants/i),
        ).not.toBeInTheDocument();
        expect(
          screen.getByText(/boom|Failed to load tenants/i),
        ).toBeInTheDocument();
      },
      { timeout: 10_000 },
    );
  }, 15_000);

  it('submits the create form to POST /tenants', async () => {
    let createCalled = false;
    server.use(
      http.get('*/api/v1/tenants', () => HttpResponse.json(fixture)),
      http.post('*/api/v1/tenants', () => {
        createCalled = true;
        return HttpResponse.json(
          {
            ...baseTenant,
            id: 'beta',
            slug: 'beta',
            displayName: 'Beta Co',
          },
          { status: 201 },
        );
      }),
    );

    renderWithProviders(<TenantsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tenants-page')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('tenants-create-id'), {
      target: { value: 'beta' },
    });
    fireEvent.change(screen.getByTestId('tenants-create-slug'), {
      target: { value: 'beta' },
    });
    fireEvent.change(screen.getByTestId('tenants-create-display'), {
      target: { value: 'Beta Co' },
    });
    fireEvent.change(screen.getByTestId('tenants-create-owner'), {
      target: { value: 'owner@beta.io' },
    });
    fireEvent.click(screen.getByTestId('tenants-create-submit'));

    await waitFor(() => {
      expect(createCalled).toBe(true);
    });
  });
});
