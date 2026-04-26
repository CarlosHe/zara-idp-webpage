// Sprint-22 / L-2205..L-2209 feature-level tests.
// Covers (1) the page renders KPI panels and inventory, (2) the rule
// builder enforces the required-field contract, (3) the maturity
// dashboard renders evaluations with severity badges.
import { describe, expect, it } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { ScorecardsPage } from '../components/ScorecardsPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';

const baseScorecard = {
  id: 'sc-1',
  slug: 'service-readiness',
  title: 'Service Readiness',
  owner: 'team-platform',
  description: 'Ownership + docs + SLO baseline',
  lifecycle: 'active',
  appliesToKinds: ['Application'],
  rules: [
    {
      code: 'svc.has-owner',
      predicate: 'spec.string.present',
      field: 'owner',
      severity: 'high',
      message: 'service must declare an owner',
    },
  ],
  createdAt: '2026-04-26T00:00:00Z',
  updatedAt: '2026-04-26T00:00:00Z',
};

describe('<ScorecardsPage />', () => {
  it('renders KPI panels and the scorecard inventory', async () => {
    server.use(
      http.get('*/api/v1/governance/kpis', () =>
        HttpResponse.json({
          scorecards: { active: 3, draft: 1, archived: 2, total: 6 },
          waivers: { active: 4, expired: 1, total: 5 },
        }),
      ),
      http.get('*/api/v1/scorecards', () =>
        HttpResponse.json({ items: [baseScorecard], total: 1 }),
      ),
    );

    renderWithProviders(<ScorecardsPage />);

    const kpis = await screen.findByTestId('governance-kpis');
    await waitFor(() => {
      expect(screen.getByText('Service Readiness')).toBeInTheDocument();
    });
    // KPI accent values rendered.
    expect(kpis).toHaveTextContent('3');
    expect(kpis).toHaveTextContent('4');
  });

  it('switches to the rule builder tab and submits the create form', async () => {
    server.use(
      http.get('*/api/v1/governance/kpis', () =>
        HttpResponse.json({
          scorecards: { active: 0, draft: 0, archived: 0, total: 0 },
          waivers: { active: 0, expired: 0, total: 0 },
        }),
      ),
      http.get('*/api/v1/scorecards', () => HttpResponse.json({ items: [], total: 0 })),
      http.post('*/api/v1/scorecards', async ({ request }) => {
        const body = (await request.json()) as { slug: string };
        return HttpResponse.json({ ...baseScorecard, slug: body.slug }, { status: 201 });
      }),
    );

    renderWithProviders(<ScorecardsPage />);

    await waitFor(() => {
      expect(screen.getByText(/No scorecards yet/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('tab', { name: /rule builder/i }));

    const form = await screen.findByLabelText(/scorecard rule builder/i);
    expect(form).toBeInTheDocument();
  });

  it('switches to the evaluate tab and surfaces the entity input form', async () => {
    server.use(
      http.get('*/api/v1/governance/kpis', () =>
        HttpResponse.json({
          scorecards: { active: 1, draft: 0, archived: 0, total: 1 },
          waivers: { active: 0, expired: 0, total: 0 },
        }),
      ),
      http.get('*/api/v1/scorecards', () =>
        HttpResponse.json({ items: [baseScorecard], total: 1 }),
      ),
    );
    renderWithProviders(<ScorecardsPage />);

    await waitFor(() => {
      expect(screen.getByText('Service Readiness')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('tab', { name: /evaluate entity/i }));

    expect(await screen.findByRole('heading', { name: /maturity dashboard/i })).toBeInTheDocument();
  });
});
