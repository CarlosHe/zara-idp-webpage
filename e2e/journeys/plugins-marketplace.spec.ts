import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — plugin marketplace journey.

test.describe('plugins journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('plugins page renders registry items returned by the API', async ({ page }) => {
    await page.route('**/api/v1/plugins*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'plg-1',
              name: 'github-source',
              version: '1.4.0',
              lifecycle: 'installed',
              health: 'healthy',
              signed: true,
              sbom: 'cyclonedx-1.5',
            },
          ],
          total: 1,
        }),
      }),
    );
    await page.goto('/plugins');
    await expect(page.getByText(/github-source/i).first()).toBeVisible();
  });
});
