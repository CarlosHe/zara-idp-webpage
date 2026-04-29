import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — tenants admin journey.

test.describe('tenants journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('tenants page renders the tenant inventory', async ({ page }) => {
    await page.route('**/api/v1/tenants*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'ten-1',
              slug: 'acme',
              name: 'Acme Corp',
              status: 'active',
              owner: 'admin@acme.example',
              createdAt: '2026-04-26T00:00:00Z',
            },
          ],
          total: 1,
        }),
      }),
    );
    await page.goto('/tenants');
    await expect(page.getByText(/Acme Corp/i).first()).toBeVisible();
  });
});
