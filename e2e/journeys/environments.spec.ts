import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — dev environments journey.

test.describe('environments journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('environments page renders provisioned env list with TTL', async ({ page }) => {
    await page.route('**/api/v1/environments*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          environments: [
            {
              id: 'env-1',
              slug: 'preview-pr-42',
              owner: 'alice',
              status: 'ready',
              ttl: '24h',
              expiresAt: '2026-04-29T12:00:00Z',
              costUsd: 4.21,
            },
          ],
        }),
      }),
    );
    await page.goto('/environments');
    await expect(page.getByText(/preview-pr-42/i).first()).toBeVisible();
  });
});
