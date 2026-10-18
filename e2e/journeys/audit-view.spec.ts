import { test, expect } from '../fixtures';

test('audit search filters events by actor', async ({ context, page }) => {
  await context.addInitScript(() => localStorage.setItem('zara.authToken', 'e2e-token'));
  await page.route('**/api/v1/audit*', (route) => route.fulfill({ json: { items: ['admin', 'developer'].map((actor, index) => ({ id: String(index), timestamp: new Date().toISOString(), action: 'APPLY', resourceKind: 'Application', resourceNamespace: 'platform', resourceName: `service-${index}`, actor, actorType: 'user', result: 'success', message: '', metadata: {} })), total: 2 } }));
  await page.goto('/audit');
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('developer', { exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search audit logs' }).fill('admin');
  await expect(page.getByText('developer', { exact: true })).toHaveCount(0);
  await expect(page.getByText('admin', { exact: true })).toBeVisible();
});
