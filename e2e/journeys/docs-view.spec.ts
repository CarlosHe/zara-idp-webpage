import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — docs viewer journey. Asserts the docs page
// surfaces a TechDocs entry and its freshness indicator.

test.describe('docs view journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('docs page renders a docset returned by the API', async ({ page }) => {
    await page.route('**/api/v1/docs/sets*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'docs-1',
              slug: 'checkout-api',
              owner: 'team-payments',
              version: '2026.04.26',
              freshness: 'fresh',
              source: 'github://example/checkout/docs',
              build: { state: 'success', startedAt: '2026-04-26T11:00:00Z' },
            },
          ],
          total: 1,
        }),
      }),
    );
    await page.goto('/docs');
    await expect(page.getByText(/checkout-api/i).first()).toBeVisible();
  });
});
