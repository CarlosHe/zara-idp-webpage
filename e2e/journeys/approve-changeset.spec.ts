import { test, expect } from '../fixtures';

test('approver opens a pending request and persists an approval', async ({ context, page }) => {
  await context.addInitScript(() => localStorage.setItem('zara.authToken', 'e2e-token'));
  let approval = { id: 'apr-1', resourceKind: 'Application', resourceNamespace: 'platform', resourceName: 'checkout', operation: 'update', status: 'pending', requestedBy: 'alice@example.com', requestedAt: new Date().toISOString(), expiresAt: '2099-01-01T00:00:00Z' };
  await page.route('**/api/v1/approvals*', (route) => route.fulfill({ json: { items: [approval], total: 1 } }));
  await page.route('**/api/v1/approvals/apr-1', (route) => route.fulfill({ json: approval }));
  await page.route('**/api/v1/approvals/apr-1/approve', async (route) => {
    expect(route.request().method()).toBe('POST');
    approval = { ...approval, status: 'approved' };
    await route.fulfill({ json: approval });
  });
  await page.goto('/approvals');
  await page.getByRole('link', { name: 'View approval for Application/checkout' }).click();
  await page.getByRole('button', { name: /approve/i, exact: true }).click();
  await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible();
});
