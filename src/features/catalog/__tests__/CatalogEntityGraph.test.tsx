// Sprint-18 / L-1807 — feature-level coverage for the catalog entity
// graph: quality score, findings, owners, dependencies, dependents.
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { CatalogEntityGraph } from '../components/CatalogEntityGraph';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

describe('<CatalogEntityGraph />', () => {
  it('renders the quality score, findings, owners, and relationships', async () => {
    server.use(
      http.get('*/api/v1/catalog/Service/default/billing/graph', () =>
        HttpResponse.json({
          entity: {
            id: 'e-1',
            key: 'Service/default/billing',
            kind: 'Service',
            metadata: { name: 'billing', namespace: 'default' },
            spec: {},
            relationships: [],
            version: 1,
            generation: 1,
            createdAt: '2026-04-25T00:00:00Z',
            updatedAt: '2026-04-25T00:00:00Z',
          },
          owners: [{ source: 'spec.owner', ref: '@team-payments' }],
          dependencies: [
            { type: 'dependsOn', kind: 'Service', namespace: 'default', name: 'auth' },
          ],
          dependents: [
            { type: 'dependsOn', kind: 'Service', namespace: 'default', name: 'orders' },
          ],
          quality: {
            score: 75,
            findings: [
              {
                code: 'catalog.quality.missing-runbook',
                severity: 'low',
                message: 'entity has no runbook URL',
                field: 'spec.runbook',
                entityKey: 'Service/default/billing',
              },
            ],
          },
        }),
      ),
    );

    renderWithProviders(
      <CatalogEntityGraph kind="Service" namespace="default" name="billing" />,
    );

    expect(await screen.findByLabelText(/Quality score 75 of 100/)).toBeInTheDocument();
    expect(screen.getByText(/missing-runbook/)).toBeInTheDocument();
    expect(screen.getByText('@team-payments')).toBeInTheDocument();
    expect(screen.getByText('default/auth')).toBeInTheDocument();
    expect(screen.getByText('default/orders')).toBeInTheDocument();
  });
});
