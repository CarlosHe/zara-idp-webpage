import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';
import { Routes, Route } from 'react-router-dom';
import { ResourceDetailPage } from '../components/ResourceDetailPage';

function renderDetail(id: string) {
  // renderWithProviders already mounts MemoryRouter — pass route + Routes only.
  return renderWithProviders(
    <Routes>
      <Route path="/resources/:id" element={<ResourceDetailPage />} />
    </Routes>,
    { route: `/resources/${id}` },
  );
}

describe('ResourceDetailPage', () => {
  it('renders application detail with platform badge', async () => {
    server.use(
      http.get('*/api/v1/resources/:id', ({ params }) =>
        HttpResponse.json({
          id: params.id,
          kind: 'Application',
          metadata: {
            name: 'order-service-core',
            namespace: 'meucontrole',
            labels: { team: 'orders-team' },
            annotations: { 'zara.io/provider': 'aws' },
          },
          provider: 'aws',
          status: 'Ready',
          version: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          spec: {
            name: 'order-service-core',
            namespace: 'meucontrole',
            image: 'repo/order:latest',
            port: 50051,
            replicas: 2,
            platform: 'ecs',
            cluster: 'meucontrole-prod',
          },
        }),
      ),
      http.get('*/api/v1/resources/:id/events', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/resources/:id/dependencies', () => HttpResponse.json({ items: [] })),
    );

    renderDetail('res-1');

    expect(await screen.findByTestId('resource-detail-page')).toBeInTheDocument();
    expect(screen.getByText('order-service-core')).toBeInTheDocument();
    expect(screen.getByText('ECS')).toBeInTheDocument();
    expect(screen.getByText(/Application runtime/i)).toBeInTheDocument();
  });

  it('shows not found on API error', async () => {
    // 404 still goes through baseQuery retries (maxRetries: 2 + backoff).
    // Stub satellite endpoints and wait longer than the default findBy timeout.
    server.use(
      http.get('*/api/v1/resources/:id', () =>
        HttpResponse.json({ error: 'not found' }, { status: 404 }),
      ),
      http.get('*/api/v1/resources/:id/events', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/resources/:id/dependencies', () => HttpResponse.json({ items: [] })),
    );

    renderDetail('missing');
    expect(
      await screen.findByText(/Resource not found/i, {}, { timeout: 10_000 }),
    ).toBeInTheDocument();
  }, 15_000);
});
