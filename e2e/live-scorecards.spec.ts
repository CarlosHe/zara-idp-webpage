import { test, expect } from '@playwright/test';

// The smoke runner owns this isolated database. Forward requests to its real
// server; never synthesize API responses or leave an active policy on a user's stack.
test.use({ screenshot: 'off', video: 'off', trace: 'off' });
test('real scorecard: active rule passes, then missing ownership produces a finding', async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(!process.env.ZARA_LIVE_API || !process.env.ZARA_LIVE_TOKEN, 'Use scripts/smoke-platform.py --browser');
  await page.route('**/api/v1/**', async (route) => {
    const original = new URL(route.request().url());
    const headers = { ...route.request().headers() };
    delete headers.host;
    const response = await route.fetch({ url: process.env.ZARA_LIVE_API! + original.pathname + original.search, headers });
    await route.fulfill({ response });
  });
  await page.goto('/login');
  await page.getByLabel('Access token', { exact: true }).fill(process.env.ZARA_LIVE_TOKEN!);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.waitForURL((url) => url.pathname !== '/login');
  await page.goto('/catalog');
  await page.getByRole('button', { name: 'Register entity', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill('scorecard-live-app');
  await dialog.getByLabel('Namespace', { exact: true }).fill('default');
  await dialog.getByLabel('Specification JSON', { exact: true }).fill(JSON.stringify({ owner: 'platform' }));
  await dialog.getByRole('button', { name: 'Register entity', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.goto('/scorecards');
  await page.getByRole('tab', { name: 'Rule builder', exact: true }).click();
  const form = page.getByRole('form', { name: 'scorecard rule builder' });
  await form.getByLabel('Slug', { exact: true }).fill('ownership-live');
  await form.getByLabel('Title', { exact: true }).fill('Live ownership');
  await form.getByLabel('Owner', { exact: true }).fill('platform');
  await form.getByLabel('Code', { exact: true }).fill('service.has-owner');
  await form.getByLabel('Field', { exact: true }).fill('owner');
  await form.getByLabel('Message', { exact: true }).fill('Owner required by live rule');
  await form.getByLabel('Activate on create', { exact: true }).check();
  await form.getByRole('button', { name: 'Create scorecard', exact: true }).click();
  await expect(form.getByLabel('Slug', { exact: true })).toHaveValue('');
  async function evaluate() {
    await page.goto('/scorecards');
    await page.getByRole('tab', { name: 'Evaluate entity', exact: true }).click();
    await page.getByLabel('Namespace', { exact: true }).fill('default');
    await page.getByLabel('Name', { exact: true }).fill('scorecard-live-app');
    await page.getByRole('button', { name: 'Evaluate', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'ownership-live', exact: true })).toBeVisible();
  }
  await evaluate();
  await expect(page.getByText('All rules pass.', { exact: true })).toBeVisible();
  await page.goto('/catalog/Application/default/scorecard-live-app');
  await page.getByRole('button', { name: 'Edit entity', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Specification JSON', { exact: true }).fill('{}');
  await dialog.getByRole('button', { name: 'Save entity', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await evaluate();
  await expect(page.getByTestId('finding-list')).toContainText('Owner required by live rule');
  await expect(page.getByText('All rules pass.', { exact: true })).toHaveCount(0);
});
