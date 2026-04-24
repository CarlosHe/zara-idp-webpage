import { test, expect } from '@playwright/test';

test.describe('create-resource journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([]);
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('creates a Deployment via the new-resource modal and sees it in the list', async ({
    page,
  }) => {
    await page.goto('/resources');
    await page.getByRole('button', { name: /new resource|create/i }).click();
    await page.getByLabel(/kind/i).selectOption('Deployment');
    await page.getByLabel(/name/i).fill('e2e-api');
    await page.getByLabel(/namespace/i).fill('platform');
    await page.getByRole('button', { name: /create|submit|apply/i }).click();

    await expect(page.getByText('e2e-api')).toBeVisible();
  });
});
