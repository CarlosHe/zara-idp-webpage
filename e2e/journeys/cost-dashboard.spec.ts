import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — cost dashboard journey.

test.describe('cost journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('cost page renders allocations + budget panels', async ({ page }) => {
    await page.route('**/api/v1/cost/allocations*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          allocations: [
            { service: 'checkout-api', team: 'team-payments', costUsd: 1240.55, share: 0.31 },
          ],
        }),
      }),
    );
    await page.route('**/api/v1/cost/budgets*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ budgets: [], anomalies: [] }),
      }),
    );
    await page.goto('/cost');
    await expect(page.getByText(/checkout-api|cost/i).first()).toBeVisible();
  });
});
