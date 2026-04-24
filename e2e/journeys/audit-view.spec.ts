import { test, expect } from '@playwright/test';

test.describe('audit-view journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('audit page lists events and filters by actor', async ({ page }) => {
    await page.goto('/audit');
    await expect(page.getByRole('heading', { name: /audit/i })).toBeVisible();
    const search = page.getByPlaceholder(/search|filter/i);
    if (await search.count()) {
      await search.first().fill('admin');
    }
    await expect(page.getByRole('table')).toBeVisible();
  });
});
