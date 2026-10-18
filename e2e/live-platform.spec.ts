import { test, expect } from './fixtures';

test('real platform: resources, approval persistence, applied changes and freeze lifecycle', async ({ context, page }) => {
  test.setTimeout(90_000);
  test.skip(!process.env.ZARA_LIVE_API || !process.env.ZARA_LIVE_TOKEN, 'Run through scripts/smoke-platform.py --browser');
  await context.addInitScript(({ token }) => {
    localStorage.setItem('zara.authToken', token);
    localStorage.setItem('zara.tenant', 'smoke');
  }, { token: process.env.ZARA_LIVE_TOKEN! });
  await page.route('**/api/**', async (route) => {
    const original = new URL(route.request().url());
    const headers = { ...route.request().headers() };
    delete headers.host;
    const response = await route.fetch({ url: process.env.ZARA_LIVE_API! + original.pathname + original.search, headers });
    await route.fulfill({ response });
  });
  await page.goto('/resources');
  await expect(page.getByText('smoke-database', { exact: true }).first()).toBeVisible();
  await page.goto('/changesets');
  await expect(page.getByText('applied', { exact: true }).first()).toBeVisible();
  await page.goto(`/approvals/${process.env.ZARA_LIVE_APPROVAL_ID}`);
  await expect(page.getByText('default', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(page.getByText('Approvals recorded: 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Pending', { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText('Approvals recorded: 1', { exact: true })).toBeVisible();
  await page.goto('/freezes');
  await page.getByRole('button', { name: 'Create freeze', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill('browser-proof-freeze');
  await dialog.getByLabel('Reason', { exact: true }).fill('Real browser validation');
  await dialog.getByLabel('Namespaces', { exact: true }).fill('default');
  await dialog.getByRole('button', { name: 'Create freeze', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('link', { name: 'browser-proof-freeze' }).click();
  await page.getByRole('button', { name: 'Edit freeze' }).click();
  await dialog.getByLabel('Reason', { exact: true }).fill('Updated through real HTTP');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Updated through real HTTP', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Updated through real HTTP', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete freeze', exact: true }).click();
  await dialog.getByRole('button', { name: 'Delete freeze', exact: true }).click();
  await expect(page.getByText('No active freezes', { exact: true })).toBeVisible();
  await page.goto('/docs');
  await page.getByRole('button', { name: 'Select OpenAPI', exact: true }).click();
  await expect(page.getByText('/api/v1/resources', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'View raw spec' }).click();
  await expect(page.locator('pre')).toContainText('"openapi"');
});

test('real platform: every top-level screen renders against the actual API', async ({ context, page }) => {
  test.setTimeout(120_000);
  test.skip(!process.env.ZARA_LIVE_API || !process.env.ZARA_LIVE_TOKEN, 'Run through scripts/smoke-platform.py --browser');
  await context.addInitScript(({ token }) => {
    localStorage.setItem('zara.authToken', token);
    localStorage.setItem('zara.tenant', 'smoke');
  }, { token: process.env.ZARA_LIVE_TOKEN! });
  const failures: string[] = [];
  await page.route('**/api/**', async (route) => {
    const original = new URL(route.request().url());
    const headers = { ...route.request().headers() };
    delete headers.host;
    const response = await route.fetch({ url: process.env.ZARA_LIVE_API! + original.pathname + original.search, headers });
    if (response.status() >= 400) failures.push(`${original.pathname}: ${response.status()}`);
    await route.fulfill({ response });
  });
  for (const path of ['/home', '/resources', '/changesets', '/stacks', '/catalog', '/catalog/sources',
    '/search', '/docs', '/apis', '/teams', '/approvals', '/audit', '/policies', '/freezes', '/golden-paths',
    '/calendar', '/domains', '/clusters', '/namespaces', '/analytics', '/analytics/executive', '/runtime',
    '/scorecards', '/plugins', '/notifications', '/incidents', '/cost', '/environments', '/tenants', '/assistant', '/remediation']) {
    await test.step(path, async () => {
      await page.goto(path);
      await expect(page.locator('main').getByRole('heading').first()).toBeVisible();
      await page.waitForLoadState('networkidle');
    });
  }
  expect(failures, 'Actual API failures while rendering platform screens').toEqual([]);
});
