// Sprint-17 / L-1710 — feature-level coverage for the catalog-sources
// page. The page reads the registry endpoint, lets the user trigger a
// sync, and surfaces both the empty state and the populated state.
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { CatalogSourcesPage } from '../components/CatalogSourcesPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

const sampleSource = {
  id: 'github-acme',
  provider: 'github',
  owner: 'acme',
  url: 'https://github.com/acme',
  description: 'Acme org catalog',
  manifestGlobs: ['catalog-info.yaml', '.zara/catalog/*.yaml'],
  createdAt: '2026-04-25T12:00:00Z',
  status: {
    lastSyncOk: false,
    lastRecordsCount: 0,
    lastErrorsCount: 0,
    requiresApproval: false,
  },
};

describe('<CatalogSourcesPage />', () => {
  it('renders the empty state when no sources are configured', async () => {
    renderWithProviders(<CatalogSourcesPage />);

    await waitFor(() => {
      expect(screen.getByText('No catalog sources registered')).toBeInTheDocument();
    });
  });

  it('lists registered sources with provider badges and manifest globs', async () => {
    server.use(
      http.get('*/api/v1/catalog-sources', () =>
        HttpResponse.json({ items: [sampleSource] }),
      ),
    );

    renderWithProviders(<CatalogSourcesPage />);

    expect(await screen.findByText('github-acme')).toBeInTheDocument();
    expect(screen.getByText('Acme org catalog')).toBeInTheDocument();
    expect(
      screen.getByText('catalog-info.yaml, .zara/catalog/*.yaml'),
    ).toBeInTheDocument();
  });

  it('triggers a sync and renders the resulting ChangeSet summary', async () => {
    server.use(
      http.get('*/api/v1/catalog-sources', () =>
        HttpResponse.json({ items: [sampleSource] }),
      ),
      http.post('*/api/v1/catalog-sources/github-acme/sync', () =>
        HttpResponse.json({
          sourceId: 'github-acme',
          provider: 'github',
          changesetId: 'cs-42',
          requiresApproval: true,
          records: 2,
          message: 'ChangeSet created with 2 changes (Risk: medium)',
          status: {
            lastSyncAt: '2026-04-25T12:30:00Z',
            lastSyncOk: true,
            lastChangeSetId: 'cs-42',
            lastRecordsCount: 2,
            lastErrorsCount: 0,
            requiresApproval: true,
          },
        }),
      ),
    );

    renderWithProviders(<CatalogSourcesPage />);

    const syncButton = await screen.findByRole('button', { name: /Sync now/ });
    await userEvent.click(syncButton);

    await waitFor(() => {
      expect(
        screen.getByText('ChangeSet created with 2 changes (Risk: medium)'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('cs-42')).toBeInTheDocument();
    expect(screen.getByText('2 records')).toBeInTheDocument();
  });

  it('surfaces sync errors as an alert and keeps the source row intact', async () => {
    server.use(
      http.get('*/api/v1/catalog-sources', () =>
        HttpResponse.json({ items: [sampleSource] }),
      ),
      http.post('*/api/v1/catalog-sources/github-acme/sync', () =>
        HttpResponse.json({ message: 'rate limited' }, { status: 502 }),
      ),
    );

    renderWithProviders(<CatalogSourcesPage />);

    const syncButton = await screen.findByRole('button', { name: /Sync now/ });
    await userEvent.click(syncButton);

    await waitFor(
      () => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      },
      { timeout: 5_000 },
    );
    expect(screen.getByText('github-acme')).toBeInTheDocument();
  });
});
