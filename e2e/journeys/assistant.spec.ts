import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — AI assistant journey.

test.describe('assistant journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('assistant page renders the chat surface', async ({ page }) => {
    await page.route('**/api/v1/assistant/conversations*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0 }),
      }),
    );
    await page.goto('/assistant');
    await expect(
      page.getByPlaceholder(/ask|message|prompt/i).first(),
    ).toBeVisible();
  });
});
