import { test, expect } from '@playwright/test';

test.describe('freeze-window journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('creates a freeze window and verifies it shows up in the list', async ({ page }) => {
    await page.goto('/freezes');
    await page.getByRole('button', { name: /new freeze|create/i }).click();
    await page.getByLabel(/name|title/i).fill('black-friday');
    await page.getByRole('button', { name: /save|create|apply/i }).click();
    await expect(page.getByText('black-friday')).toBeVisible();
  });
});
