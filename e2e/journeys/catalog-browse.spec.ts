import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — catalog browse journey. Asserts the catalog
// page renders an entity list returned by the API.

test.describe('catalog browse journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('catalog page renders entities returned by the API', async ({ page }) => {
    await page.route('**/api/v1/catalog/entities*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'cat-1',
              kind: 'Application',
              metadata: { name: 'checkout-api', namespace: 'payments', labels: {}, annotations: {} },
              spec: { owner: 'team-payments', tier: 'tier1', lifecycle: 'production' },
              relationships: [],
              version: 1,
              generation: 1,
              createdAt: '2026-04-26T00:00:00Z',
              updatedAt: '2026-04-26T00:00:00Z',
            },
          ],
          total: 1,
        }),
      }),
    );
    await page.goto('/catalog');
    await expect(page.getByRole('heading', { name: /catalog/i }).first()).toBeVisible();
    await expect(page.getByText(/checkout-api/i).first()).toBeVisible();
  });
});
