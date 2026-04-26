// Sprint-23 / L-2309 — feature-level coverage for the Plugins marketplace
// page. Tests assert the empty / populated / error / lifecycle states for
// the new `/api/v1/plugins` (records) and `/api/v1/plugins/slots` (slots)
// endpoints introduced in L-2302.
import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { PluginsPage } from '../components/PluginsPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

const sampleRecord = {
  name: 'plugin-github',
  displayName: 'GitHub Importer',
  vendor: 'Zara',
  description: 'Imports GitHub repositories into the catalog.',
  version: '1.0.0',
  status: 'installed',
  health: { state: 'healthy', consecutiveFailures: 0 },
  runtime: 'mixed',
  resources: { cpuMilli: 250, memoryMiB: 256 },
  permissions: { scopes: ['catalog.read'] },
  signing: {
    digest: 'sha256:abc',
    signatureRef: 'oci://ghcr.io/zara/plugin-github:1.0.0.sig',
    sbomRef: 'oci://ghcr.io/zara/plugin-github:1.0.0.sbom',
  },
  installedBy: 'alice',
  installedAt: '2026-04-26T00:00:00Z',
  updatedAt: '2026-04-26T00:00:00Z',
};

describe('<PluginsPage />', () => {
  it('renders the empty marketplace state when no plugins are installed', async () => {
    renderWithProviders(<PluginsPage />);

    await waitFor(() => {
      expect(screen.getByText('No plugins installed')).toBeInTheDocument();
    });
    expect(screen.getByText(/Install a signed plugin via zaractl/i)).toBeInTheDocument();
    expect(screen.getByText('No slots registered')).toBeInTheDocument();
  });

  it('renders installed plugins with health, quotas, and actions', async () => {
    server.use(
      http.get('*/api/v1/plugins', () => HttpResponse.json({ items: [sampleRecord] })),
    );

    renderWithProviders(<PluginsPage />);

    await waitFor(() => {
      expect(screen.getByText('GitHub Importer')).toBeInTheDocument();
    });
    expect(screen.getByText('plugin-github · v1.0.0 · Zara')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('CPU 250m')).toBeInTheDocument();
    expect(screen.getByText('Mem 256 MiB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Probe health' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Uninstall' })).toBeInTheDocument();
  });

  it('renders slot tabs sourced from the plugin slots endpoint', async () => {
    server.use(
      http.get('*/api/v1/plugins/slots', () =>
        HttpResponse.json({
          items: [
            {
              id: 'github-catalog-tab',
              pluginName: 'plugin-github',
              title: 'GitHub Catalog',
              slot: 'catalog.tab',
              remoteEntry: 'https://example.test/plugin-github/remoteEntry.js',
              exposedModule: './PluginTab',
              route: '/plugins/github',
            },
          ],
        }),
      ),
    );

    renderWithProviders(<PluginsPage />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'GitHub Catalog' })).toBeInTheDocument();
    });
  });

  it('shows an unavailable state when the registry endpoint fails', async () => {
    server.use(
      http.get('*/api/v1/plugins', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );

    renderWithProviders(<PluginsPage />);

    await waitFor(
      () => {
        expect(screen.getByText('Plugin registry unavailable')).toBeInTheDocument();
      },
      { timeout: 5_000 },
    );
  });

  it('triggers an uninstall mutation and surfaces the change-set id', async () => {
    server.use(
      http.get('*/api/v1/plugins', () => HttpResponse.json({ items: [sampleRecord] })),
      http.post('*/api/v1/plugins/plugin-github/uninstall', () =>
        HttpResponse.json({ changesetId: 'cs-uninstall-1' }),
      ),
    );

    renderWithProviders(<PluginsPage />);

    const uninstall = await screen.findByRole('button', { name: 'Uninstall' });
    fireEvent.click(uninstall);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('cs-uninstall-1');
    });
  });
});
