import { test, expect } from '@playwright/test';

test.describe('approve-changeset journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('approver sees a pending changeset and can approve it', async ({ page }) => {
    await page.goto('/approvals');
    const row = page.locator('[data-testid="approval-row"]').first();
    await row.click();
    await page.getByRole('button', { name: /approve/i }).click();
    await expect(page.getByText(/approved/i)).toBeVisible();
  });
});
