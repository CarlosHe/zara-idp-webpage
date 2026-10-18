import { test, expect } from '../fixtures';

test.describe('login journey', () => {
  test('unauthenticated visit preserves the requested URL', async ({ page }) => {
    await page.goto('/resources');
    await expect(page).toHaveURL(/\/login\?redirect=/);
    await expect(page.getByText('Entrar no Zara IDP')).toBeVisible();
  });

  test('a bearer token opens the requested resource screen', async ({ page }) => {
    await page.route('**/api/v1/resources*', (route) => route.fulfill({ json: { items: [], total: 0 } }));
    await page.route('**/api/v1/namespaces*', (route) => route.fulfill({ json: { items: [], total: 0 } }));
    await page.goto('/login?redirect=/resources');
    await page.getByLabel('Access token').fill('e2e-token');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/resources$/);
    await expect(page.getByRole('heading', { name: 'Resources', exact: true })).toBeVisible();
  });
});
