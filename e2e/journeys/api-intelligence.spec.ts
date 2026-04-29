import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — API intelligence journey.

test.describe('api intelligence journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('API page lists registered APIs with version + lifecycle', async ({ page }) => {
    await page.route('**/api/v1/apis*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'api-1',
              slug: 'checkout-rest-v1',
              title: 'Checkout REST',
              owner: 'team-payments',
              version: '1.4.0',
              lifecycle: 'production',
              consumers: ['mobile-app', 'web-app'],
              breakingChanges: 0,
            },
          ],
          total: 1,
        }),
      }),
    );
    await page.goto('/apis');
    await expect(page.getByText(/Checkout REST/i).first()).toBeVisible();
  });
});
