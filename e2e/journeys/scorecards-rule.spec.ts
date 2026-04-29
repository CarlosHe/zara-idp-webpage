import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — scorecards/governance journey.

test.describe('scorecards journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('scorecards page renders the inventory + KPI panels', async ({ page }) => {
    await page.route('**/api/v1/governance/kpis*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scorecards: { active: 3, draft: 1, archived: 0, total: 4 },
          waivers: { active: 2, expired: 0, total: 2 },
        }),
      }),
    );
    await page.route('**/api/v1/scorecards*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'sc-1',
              slug: 'service-readiness',
              title: 'Service Readiness',
              owner: 'team-platform',
              lifecycle: 'active',
              appliesToKinds: ['Application'],
              rules: [],
              createdAt: '2026-04-26T00:00:00Z',
              updatedAt: '2026-04-26T00:00:00Z',
            },
          ],
          total: 1,
        }),
      }),
    );
    await page.goto('/scorecards');
    await expect(page.getByText(/Service Readiness/i).first()).toBeVisible();
  });
});
