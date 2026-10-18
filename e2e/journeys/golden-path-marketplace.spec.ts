import { test, expect } from '../fixtures';

// Sprint-32 / L-3203 — golden-path marketplace journey. Asserts the
// marketplace renders templates returned by the API.

test.describe('golden-path marketplace journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('marketplace lists templates returned by the API', async ({ page }) => {
    await page.route('**/api/v1/golden-paths*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'gp-1',
              slug: 'go-microservice',
              name: 'Go microservice', parameters: [], actions: [], hasDSL: true, hasRollbackPlan: true,
              description: 'Repo + CI + docs + runtime resources',
              owner: 'team-platform',
              version: '1.4.0',
              lifecycle: 'production',
            },
          ],
          total: 1,
        }),
      }),
    );
    await page.goto('/golden-paths');
    await expect(page.getByText(/Go microservice/i).first()).toBeVisible();
  });
});
