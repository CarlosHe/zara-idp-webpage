// Sprint-16 / L-1614 — feature-level coverage for the Plugins page,
// asserting that the empty-registry state and the populated-registry
// state both render correctly via the real RTK Query slice + MSW
// handlers (i.e. without leaning on the demo URL fixtures that L-1613
// removed).
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { PluginsPage } from '../components/PluginsPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

describe('<PluginsPage />', () => {
  it('renders the empty registry state when no plugins are installed', async () => {
    renderWithProviders(<PluginsPage />);

    await waitFor(() => {
      expect(screen.getByText('No plugins installed')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Install a signed plugin via zaractl/i),
    ).toBeInTheDocument();
  });

  it('renders slot tabs sourced from the plugin registry', async () => {
    server.use(
      http.get('*/api/v1/plugins', () =>
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
            {
              id: 'pagerduty-card',
              pluginName: 'plugin-pagerduty',
              title: 'PagerDuty Incidents',
              slot: 'dashboard.card',
              remoteEntry: 'https://example.test/plugin-pagerduty/remoteEntry.js',
              exposedModule: './DashboardCard',
            },
          ],
        }),
      ),
    );

    renderWithProviders(<PluginsPage />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'GitHub Catalog' })).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: 'PagerDuty Incidents' })).toBeInTheDocument();
  });

  it('shows an unavailable state when the registry endpoint fails', async () => {
    server.use(
      http.get('*/api/v1/plugins', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }),
      ),
    );

    renderWithProviders(<PluginsPage />);

    // baseApi retries 5xx responses; allow extra time for retries to settle.
    await waitFor(
      () => {
        expect(screen.getByText('Plugin registry unavailable')).toBeInTheDocument();
      },
      { timeout: 5_000 },
    );
  });
});
