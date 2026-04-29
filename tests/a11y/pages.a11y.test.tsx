// Sprint-32 / L-3204 — page-level a11y audit. Each major route is
// rendered with stubbed data and asserted to produce zero `critical`
// and zero `serious` violations against the in-tree auditor. The
// route is wrapped in a synthetic <main> because feature pages
// inherit the landmark from `<DashboardLayout>` in production.
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render } from '@testing-library/react';

import { server } from '../mocks/server';
import { TestProviders } from '../utils/TestProviders';
import { auditPage } from './audit';

import { IncidentsPage } from '@/features/incidents/components/IncidentsPage';
import { NotificationsPage } from '@/features/notifications/components/NotificationsPage';
import { CostPage } from '@/features/cost/components/CostPage';
import { ScorecardsPage } from '@/features/scorecards/components/ScorecardsPage';

async function flush() {
  // RTK Query resolves on a microtask; wait one task to let the loading
  // state transition to data before auditing.
  await new Promise<void>((resolve) => setTimeout(resolve, 30));
}

describe('a11y — major routes (zero critical/serious)', () => {
  it('IncidentsPage', async () => {
    server.use(
      http.get('*/api/v1/incidents', () =>
        HttpResponse.json({ incidents: [] }),
      ),
    );
    const { container } = render(
      <TestProviders>
        <main>
          <IncidentsPage />
        </main>
      </TestProviders>,
    );
    await flush();
    expect(auditPage(container)).toEqual([]);
  });

  it('NotificationsPage', async () => {
    server.use(
      http.get('*/api/v1/notifications', () =>
        HttpResponse.json({ notifications: [], unread: 0 }),
      ),
    );
    const { container } = render(
      <TestProviders>
        <main>
          <NotificationsPage />
        </main>
      </TestProviders>,
    );
    await flush();
    expect(auditPage(container)).toEqual([]);
  });

  it('CostPage', async () => {
    server.use(
      http.get('*/api/v1/cost/allocations', () =>
        HttpResponse.json({ allocations: [] }),
      ),
      http.get('*/api/v1/cost/budgets', () =>
        HttpResponse.json({ budgets: [], anomalies: [] }),
      ),
    );
    const { container } = render(
      <TestProviders>
        <main>
          <CostPage />
        </main>
      </TestProviders>,
    );
    await flush();
    expect(auditPage(container)).toEqual([]);
  });

  it('ScorecardsPage', async () => {
    server.use(
      http.get('*/api/v1/governance/kpis', () =>
        HttpResponse.json({
          scorecards: { active: 0, draft: 0, archived: 0, total: 0 },
          waivers: { active: 0, expired: 0, total: 0 },
        }),
      ),
      http.get('*/api/v1/scorecards', () =>
        HttpResponse.json({ items: [], total: 0 }),
      ),
    );
    const { container } = render(
      <TestProviders>
        <main>
          <ScorecardsPage />
        </main>
      </TestProviders>,
    );
    await flush();
    expect(auditPage(container)).toEqual([]);
  });
});
