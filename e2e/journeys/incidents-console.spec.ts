import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — incident console journey.

test.describe('incidents journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('incidents page renders open incidents and the state-filter tablist', async ({
    page,
  }) => {
    await page.route('**/api/v1/incidents*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          incidents: [
            {
              id: 'inc-1',
              slug: 'checkout-503',
              title: 'Checkout 503',
              severity: 'sev1',
              state: 'open',
              source: 'pagerduty',
              externalId: 'PD-1',
              affected: [{ name: 'checkout', namespace: 'prod', owner: 'team-payments' }],
              owners: ['team-payments'],
              tags: [],
              openedAt: '2026-04-28T12:00:00Z',
              updatedAt: '2026-04-28T12:00:00Z',
              linkedChangeSets: [],
              runbooks: [],
              timeline: [
                {
                  sequence: 1,
                  kind: 'opened',
                  title: 'Incident opened',
                  occurredAt: '2026-04-28T12:00:00Z',
                },
              ],
            },
          ],
        }),
      }),
    );
    await page.goto('/incidents');
    await expect(page.getByText(/Checkout 503/i).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /open/i }).first()).toBeVisible();
  });
});
