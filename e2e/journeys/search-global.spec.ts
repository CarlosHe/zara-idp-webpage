import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — global search journey. Search returns a single
// hit and renders it with the catalog kind/namespace/name triple.

test.describe('search journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('search renders hits returned by the search API', async ({ page }) => {
    await page.route('**/api/v1/search*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hits: [
            {
              id: 'cat-1',
              kind: 'Application',
              namespace: 'payments',
              name: 'checkout-api',
              title: 'checkout-api',
              owner: 'team-payments',
              score: 0.91,
            },
          ],
          total: 1,
          tookMs: 12,
        }),
      }),
    );
    await page.goto('/search?q=checkout');
    await expect(page.getByText(/checkout-api/i).first()).toBeVisible();
  });
});
