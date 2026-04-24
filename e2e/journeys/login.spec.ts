import { test, expect } from '@playwright/test';

// Login journey — the dashboard is guarded; an unauthenticated user is
// bounced to /login with a `redirect=` parameter preserving their
// original intent.

test.describe('login journey', () => {
  test('unauthenticated visit to /resources redirects to /login with the right redirect param', async ({
    page,
  }) => {
    await page.goto('/resources');
    await expect(page).toHaveURL(/\/login\?redirect=/);
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
  });

  test('successful login lands the user on the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|user/i).fill(process.env.E2E_USER ?? 'admin@zara.local');
    await page.getByLabel(/password/i).fill(process.env.E2E_PASS ?? 'correct-horse-battery');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard)?$/);
  });
});
