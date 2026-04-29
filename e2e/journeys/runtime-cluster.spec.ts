import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — runtime/cluster ops journey.

test.describe('runtime journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('runtime page renders cluster + workload health from inventory', async ({
    page,
  }) => {
    await page.route('**/api/v1/runtime/inventory*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clusters: [
            {
              id: 'k8s-prod-eu',
              name: 'Prod EU',
              workloads: [
                { name: 'checkout-api', namespace: 'payments', health: 'healthy', replicas: 6 },
              ],
            },
          ],
        }),
      }),
    );
    await page.goto('/runtime');
    await expect(page.getByText(/Prod EU|checkout-api/).first()).toBeVisible();
  });
});
