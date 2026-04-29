import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — executive analytics (DORA) journey.

test.describe('executive analytics journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('executive analytics renders DORA KPI panels', async ({ page }) => {
    await page.route('**/api/v1/analytics/executive*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dora: {
            leadTimeP50Hours: 12.5,
            deployFrequencyPerDay: 4.2,
            mttrMinutes: 38,
            changeFailureRate: 0.05,
          },
          adoption: { activeUsers: 312, weeklyActive: 188 },
        }),
      }),
    );
    await page.goto('/analytics/executive');
    await expect(page.getByText(/DORA|lead time|deploy/i).first()).toBeVisible();
  });
});
