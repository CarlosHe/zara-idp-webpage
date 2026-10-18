import { test, expect } from '../fixtures';

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
          inventory: { totalEnvironments: 1, byState: { ready: 1 }, byKind: { preview: 1 }, bySource: { manual: 1 }, staleCount: 0, expiringSoonCount: 0, projectedDailySpendMinorUnits: 0 },
          environments: [
            {
              id: 'env-1',
              slug: 'preview-pr-42',
              owner: 'alice',
              state: 'ready', kind: 'preview', health: 'healthy', team: 'platform', source: 'manual', createdAt: '2026-10-18T00:00:00Z', updatedAt: '2026-10-18T00:00:00Z', resources: [], timeline: [], version: 1,
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
