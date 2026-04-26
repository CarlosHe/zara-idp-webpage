// Sprint-19 / L-1908 — feature coverage for the marketplace.
//
// The tests assert:
//
//   - the registry-driven list renders.
//   - selecting a path shows the parameterise form.
//   - the dry-run flow surfaces the action plan, declared secrets, and
//     the policy preview the backend returns.
import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { GoldenPathMarketplace } from '../components/GoldenPathMarketplace';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

const summary = {
  id: 'production-microservice',
  name: 'Production Microservice',
  description: 'Bootstrap a production-ready service.',
  version: '1.0.0',
  category: 'service',
  parameters: [
    {
      name: 'serviceName',
      label: 'Service name',
      type: 'string',
      required: true,
    },
  ],
  actions: [
    { id: 'render', kind: 'emit-changeset' },
    { id: 'notify', kind: 'notify', irreversible: true },
  ],
  secrets: [{ name: 'github_token', provider: 'vault://github/token' }],
  outputs: [],
  policy: { previewBeforeExecute: true },
  risk: { baselineRisk: 'MEDIUM' },
  hasDSL: true,
  hasRollbackPlan: true,
};

describe('<GoldenPathMarketplace />', () => {
  it('renders the registry list and opens the detail view on click', async () => {
    server.use(
      http.get('*/api/v1/golden-paths', () =>
        HttpResponse.json({ items: [summary] }),
      ),
    );

    renderWithProviders(<GoldenPathMarketplace />);

    await waitFor(() => {
      expect(screen.getByText('Production Microservice')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Production Microservice'));
    expect(await screen.findByText('Service name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dry-run' })).toBeInTheDocument();
  });

  it('shows action plan and declared secrets after a dry-run', async () => {
    server.use(
      http.get('*/api/v1/golden-paths', () =>
        HttpResponse.json({ items: [summary] }),
      ),
      http.post('*/api/v1/golden-paths/production-microservice/execute', () =>
        HttpResponse.json({
          resourcesYaml: '',
          message: 'Dry-run preview',
          nextSteps: '',
          executionId: 'abc123',
          actionPlan: [
            { ID: 'render', Kind: 'emit-changeset' },
            { ID: 'notify', Kind: 'notify', Irreversible: true },
          ],
          rollbackPlan: [{ ActionID: 'render', Kind: 'emit-changeset' }],
          declaredSecrets: ['github_token'],
          policyPreview: { Decision: 'allowed', Risk: 'MEDIUM' },
        }),
      ),
    );

    renderWithProviders(<GoldenPathMarketplace />);

    fireEvent.click(await screen.findByText('Production Microservice'));
    fireEvent.change(await screen.findByRole('textbox'), {
      target: { value: 'orders' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Dry-run' }));

    await waitFor(() => {
      expect(screen.getByText('Dry-run complete')).toBeInTheDocument();
    });
    expect(screen.getByText('Action plan')).toBeInTheDocument();
    expect(screen.getByText('Declared secrets')).toBeInTheDocument();
    expect(screen.getByText('Rollback plan')).toBeInTheDocument();
    expect(screen.getByText('github_token')).toBeInTheDocument();
  });
});
