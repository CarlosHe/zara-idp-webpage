import { test, expect } from '../fixtures';

test('runtime page renders workloads from cluster inventory', async ({ context, page }) => {
  await context.addInitScript(() => localStorage.setItem('zara.authToken', 'e2e-token'));
  await page.route('**/api/v1/runtime/clusters', (route) => route.fulfill({ json: { items: ['prod-eu'], total: 1 } }));
  await page.route('**/api/v1/runtime/clusters/prod-eu/inventory*', (route) => route.fulfill({ json: {
    clusterId: 'prod-eu', namespaces: ['payments'], workloads: [{ clusterId: 'prod-eu', namespace: 'payments', name: 'checkout-api', kind: 'Deployment', image: 'checkout:1', replicas: { desired: 6, ready: 6, available: 6, updated: 6 }, health: 'Healthy', generation: 1, revision: '1', updatedAt: new Date().toISOString(), labels: {}, catalog: [] }], pods: [], events: [], capturedAt: new Date().toISOString(),
  } }));
  await page.goto('/runtime');
  await expect(page.getByText('checkout-api', { exact: true })).toBeVisible();
  await expect(page.getByText('Healthy', { exact: true }).first()).toBeVisible();
});
