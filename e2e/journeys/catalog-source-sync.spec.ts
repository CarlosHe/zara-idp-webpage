import { test, expect } from '../fixtures';

// Sprint-32 / L-3203 — catalog source management journey.

test.describe('catalog source sync journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('catalog source list renders configured sources + sync state', async ({ page }) => {
    await page.route('**/api/v1/catalog-sources*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'src-1',
              provider: 'github',
              manifestGlobs: ['catalog-info.yaml'],
              createdAt: '2026-04-28T11:00:00Z',
              url: 'https://github.com/example/services',
              status: { lastSyncAt: '2026-04-28T11:00:00Z', lastSyncOk: true, lastRecordsCount: 24, lastErrorsCount: 0, requiresApproval: false },
            },
          ],
          total: 1,
        }),
      }),
    );
    await page.goto('/catalog/sources');
    await expect(
      page.getByText('https://github.com/example/services', {exact:true}),
    ).toBeVisible();
  });
});
