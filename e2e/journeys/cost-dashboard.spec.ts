import { test, expect } from '../fixtures';

// Sprint-32 / L-3203 — cost dashboard journey.

test.describe('cost journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('cost page renders allocations + budget panels', async ({ page }) => {
    const amount = { value: 1240.55, minorUnits: 124055, currency: 'USD' };
    await page.route('**/api/v1/cost/dashboard*', (route) => route.fulfill({ json: {
      window: { since: '2026-10-01T00:00:00Z', until: '2026-10-18T00:00:00Z' }, currency: 'USD', totalSpend: amount, allocationsCount: 1,
      showback: [{ dimension: 'service', label: 'checkout-api', total: amount, share: 1 }],
      chargeback: [{ team: 'team-payments', service: 'checkout-api', total: amount }], topServices: [], idleResources: [], budgets: [], anomalies: [], findings: [], costImpacts: [],
    } }));
    await page.goto('/cost');
    await expect(page.getByText('checkout-api', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/1,240.55/).first()).toBeVisible();
  });
});
