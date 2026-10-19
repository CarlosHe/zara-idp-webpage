import { test, expect } from '../fixtures';

// Sprint-32 / L-3203 — executive analytics (DORA) journey.

test.describe('executive analytics journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('executive analytics renders DORA KPI panels', async ({ page }) => {
    const window = { scope: 'platform', windowStart: '2026-10-01T00:00:00Z', windowEnd: '2026-10-18T00:00:00Z' };
    const responses: Record<string, unknown> = {
      dora: { ...window, leadTimeMsP50: 45_000_000, leadTimeMsP95: 60_000_000, deployFrequencyPerDay: 4.2, mttrMs: 2_280_000, changeFailureRate: 0.05, sampleSize: 20 },
      'catalog-quality': { ...window, total: 10, missingOwner: 0, missingDocs: 1, missingSlo: 0, missingRunbook: 1, missingApiDoc: 0, staleEntities: 0, percentClean: 0.8 },
      'approval-sla': { ...window, requested: 5, granted: 4, rejected: 1, breached: 0, breachRate: 0, latencyMsP50: 1000, latencyMsP95: 2000, latencyMsP99: 3000 },
      remediation: { ...window, proposed: 3, accepted: 2, rejected: 1, reverted: 0, acceptanceRate: 0.67, regressionRate: 0, timeSavedMs: 60_000 },
      recommendations: { items: [] },
    };
    for (const [endpoint, body] of Object.entries(responses)) {
      await page.route(`**/api/v1/analytics/${endpoint}*`, (route) => route.fulfill({ status: 200, json: body }));
    }
    await page.goto('/analytics/executive');
    await expect(page.getByText('20 samples', { exact: true })).toBeVisible();
    await expect(page.getByText('4.20 / day', { exact: true })).toBeVisible();
  });
});
