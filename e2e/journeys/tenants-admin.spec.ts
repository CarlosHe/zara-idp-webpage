import { test, expect } from '../fixtures';

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
              displayName: 'Acme Corp', lifecycle: 'active', admins: [], updatedAt: '2026-10-18T00:00:00Z', version: 1,
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
    await expect(page.getByRole('heading', { name: /Acme Corp/i })).toBeVisible();
  });
});
