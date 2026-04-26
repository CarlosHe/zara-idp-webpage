// Sprint-20 / L-2004 feature-level tests for the rich Docs page.
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { DocsPage } from '../components/DocsPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

describe('<DocsPage />', () => {
  it('renders Markdown content from a built-in bundle', async () => {
    server.use(
      http.get('*/api/v1/docs', () =>
        HttpResponse.json({
          items: [
            {
              slug: 'catalog-v2',
              title: 'Catalog v2',
              description: 'desc',
              format: 'mdx',
              source: 'built-in',
            },
          ],
        }),
      ),
      http.get('*/api/v1/docs/catalog-v2', () =>
        HttpResponse.json({
          slug: 'catalog-v2',
          title: 'Catalog v2',
          description: 'desc',
          format: 'mdx',
          source: 'built-in',
          markdown: '# Catalog v2\n\nHello world',
          pages: [],
          findings: [],
          openApiPath: '',
        }),
      ),
    );

    renderWithProviders(<DocsPage />);
    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });
  });

  it('renders pages list and findings for a docset bundle', async () => {
    server.use(
      http.get('*/api/v1/docs', () =>
        HttpResponse.json({
          items: [
            {
              slug: 'checkout',
              title: 'Checkout',
              description: '',
              format: 'mdx',
              source: 'docset',
              owner: 'team:platform',
              version: '1.0.0',
              buildState: 'ready',
              findings: [{ kind: 'stale', message: 'docset content is older than freshness window' }],
            },
          ],
        }),
      ),
      http.get('*/api/v1/docs/checkout', () =>
        HttpResponse.json({
          slug: 'checkout',
          title: 'Checkout',
          description: '',
          format: 'mdx',
          source: 'docset',
          owner: 'team:platform',
          version: '1.0.0',
          buildState: 'ready',
          markdown: '',
          pages: [
            { slug: 'overview', kind: 'markdown', title: 'Overview', sourcePath: 'docs/overview.md' },
          ],
          findings: [{ kind: 'stale', message: 'docset content is older than freshness window' }],
          openApiPath: '',
        }),
      ),
    );

    renderWithProviders(<DocsPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Open Overview' })).toBeInTheDocument();
    });
    expect(screen.getByText(/older than freshness window/i)).toBeInTheDocument();
  });
});
