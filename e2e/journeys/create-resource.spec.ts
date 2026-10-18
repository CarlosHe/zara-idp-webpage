import { test, expect } from '../fixtures';

test('resource creation opens the governed Golden Path marketplace', async ({ context, page }) => {
  await context.addInitScript(() => localStorage.setItem('zara.authToken', 'e2e-token'));
  await page.route('**/api/v1/resources*', (route) => route.fulfill({ json: { items: [], total: 0 } }));
  await page.route('**/api/v1/namespaces*', (route) => route.fulfill({ json: { items: [], total: 0 } }));
  await page.route('**/api/v1/golden-paths*', (route) => route.fulfill({ json: { items: [], total: 0 } }));
  await page.goto('/resources');
  await page.getByRole('link', { name: /Create via Golden Path/i }).first().click();
  await expect(page).toHaveURL(/\/golden-paths$/);
  await expect(page.getByRole('heading', { name: /golden path/i }).first()).toBeVisible();
});
