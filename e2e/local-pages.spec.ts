import { test, expect, type Page } from '@playwright/test';

// Real browser, real login, real API. Do not import the contract fixture here.
test.use({ screenshot: 'off', video: 'off', trace: 'off' });
test.beforeEach(async ({ page }) => {
  test.skip(!process.env.ZARA_LIVE_TOKEN, 'Set ZARA_LIVE_TOKEN for the running local control plane');
  await page.goto('/login');
  await page.getByLabel('Access token', { exact: true }).fill(process.env.ZARA_LIVE_TOKEN!);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.waitForURL((url) => url.pathname !== '/login');
});

const screens = ['/', '/home', '/resources', '/changesets', '/stacks', '/catalog', '/catalog/sources',
  '/search', '/docs', '/apis', '/teams', '/approvals', '/audit', '/policies', '/freezes', '/golden-paths',
  '/calendar', '/domains', '/clusters', '/namespaces', '/analytics', '/analytics/executive', '/runtime',
  '/scorecards', '/plugins', '/notifications', '/incidents', '/cost', '/environments', '/tenants', '/assistant', '/remediation', '/access', '/settings'];

async function loaded(page: Page) {
  await expect(page.locator('#main-content').getByRole('heading').first()).toBeVisible();
  await page.waitForLoadState('networkidle');
}

test('all 34 screens: fresh session has no API failures, tenant pages guide selection', async ({ page }) => {
  test.setTimeout(180_000);
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.url().includes('/api/') && response.status() >= 400) failures.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  for (const route of screens) {
    await test.step(route, async () => {
      await page.goto(route);
      await loaded(page);
      await expect(page.locator('#main-content')).not.toContainText('missing X-Zara-Tenant');
      await expect(page.locator('#main-content').getByText('Error', { exact: true })).toHaveCount(0);
      await expect(page.locator('main')).toHaveCount(1);
    });
  }
  await page.goto('/remediation');
  await expect(page.getByRole('heading', { name: 'Choose a tenant to continue' })).toBeVisible();
  await page.getByLabel('Select tenant', { exact: true }).selectOption('system');
  await expect(page.getByTestId('remediation-page')).toBeVisible();
  await page.goto('/assistant');
  await expect(page.getByTestId('assistant-page')).toBeVisible();
  expect(failures).toEqual([]);
});

test('tenant creation, selection, suspend recovery, reinstate and archive persist', async ({ page }) => {
  test.setTimeout(120_000);
  const id = `ui-tenant-${Date.now().toString(36)}`;
  const me = await page.request.get('/api/v1/me', { headers: { Authorization: `Bearer ${process.env.ZARA_LIVE_TOKEN}` } });
  const { email } = await me.json() as { email: string };
  await page.goto('/tenants');
  await page.getByTestId('tenants-create-id').fill(id);
  await page.getByTestId('tenants-create-slug').fill(id);
  await page.getByTestId('tenants-create-display').fill(`UI validation ${id}`);
  await page.getByTestId('tenants-create-owner').fill(email);
  await page.getByTestId('tenants-create-submit').click();
  await expect(page.getByTestId(`tenants-row-${id}`)).toBeVisible();
  await Promise.all([page.waitForEvent('load'), page.getByLabel('Tenant', { exact: true }).selectOption(id)]);
  await expect(page.getByLabel('Tenant', { exact: true })).toHaveValue(id);
  await page.goto('/assistant');
  await expect(page.getByTestId('assistant-page')).toBeVisible();
  const prompt = `What services exist in tenant ${id}?`;
  await page.getByLabel('Prompt', { exact: true }).fill(prompt);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByLabel('Prompt', { exact: true })).toHaveValue('');
  await page.reload();
  await expect(page.getByText(prompt, { exact: true }).first()).toBeVisible();
  await page.goto('/tenants');
  await page.getByTestId(`tenants-suspend-${id}`).click();
  await expect(page.getByTestId(`tenants-reinstate-${id}`)).toBeVisible();
  await page.goto('/assistant');
  await expect(page.getByRole('heading', { name: 'Tenant unavailable' })).toBeVisible();
  await page.goto('/tenants');
  await page.getByTestId(`tenants-reinstate-${id}`).click();
  await expect(page.getByTestId(`tenants-suspend-${id}`)).toBeVisible();
  await page.goto('/assistant');
  await expect(page.getByTestId('assistant-page')).toBeVisible();
  await page.goto('/tenants');
  await page.getByTestId(`tenants-archive-${id}`).click();
  await expect(page.getByTestId(`tenants-row-${id}`)).toContainText('archived');
  await page.goto('/remediation');
  await expect(page.getByRole('heading', { name: 'Tenant unavailable' })).toBeVisible();
  await page.getByLabel('Select tenant', { exact: true }).selectOption('system');
  await expect(page.getByTestId('remediation-page')).toBeVisible();
  await page.goto('/assistant');
  await expect(page.getByText(prompt, { exact: true })).toHaveCount(0);
});

test('preferences save, domain CRUD, scorecard create and evaluate use persisted APIs', async ({ page }) => {
  test.setTimeout(150_000);
  const suffix = Date.now().toString(36);
  await page.goto('/notifications');
  await page.getByRole('button', { name: 'Preferences', exact: true }).click();
  const preferences = page.getByTestId('notification-preferences');
  await expect(preferences.getByRole('button', { name: 'Save', exact: true })).toBeEnabled();
  await preferences.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(preferences.getByRole('status')).toHaveText('Preferences saved');
  await page.reload();
  await page.getByRole('button', { name: 'Preferences', exact: true }).click();
  await expect(preferences.getByRole('button', { name: 'Save', exact: true })).toBeEnabled();
  await page.goto('/domains');
  await page.getByRole('button', { name: 'Create Domain', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill(`ui-domain-${suffix}`);
  await dialog.getByLabel('Display Name', { exact: true }).fill(`UI Domain ${suffix}`);
  await dialog.getByLabel('Owner Team', { exact: true }).fill('ui-platform');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.getByText(`UI Domain ${suffix}`, { exact: true }).first()).toBeVisible();
  // Actions have explicit accessible names on the domain card.
  await page.getByRole('button', { name: /edit.*domain/i }).last().click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Description', { exact: true }).fill('Validated through the real frontend');
  await dialog.getByRole('button', { name: 'Update', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: /delete.*domain/i }).last().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText(`UI Domain ${suffix}`, { exact: true })).toHaveCount(0);
  await page.goto('/catalog');
  await page.getByRole('button', { name: 'Register entity', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill(`ui-catalog-${suffix}`);
  await dialog.getByLabel('Namespace', { exact: true }).fill('ui-architecture');
  await dialog.getByLabel('Specification JSON', { exact: true }).fill(JSON.stringify({ owner: 'ui-platform', description: 'Browser validation', lifecycle: 'development' }));
  await dialog.getByRole('button', { name: 'Register entity', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('link', { name: `ui-architecture/ui-catalog-${suffix}`, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Desired specification', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit entity', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Specification JSON', { exact: true }).fill(JSON.stringify({ owner: 'ui-platform', description: 'Updated through browser' }));
  await page.getByRole('button', { name: 'Save entity', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.reload();
  await expect(page.locator('pre')).toContainText('Updated through browser');
  await page.goto('/search');
  await page.getByLabel('Search query').fill(`ui-catalog-${suffix}`);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('button', { name: new RegExp(`Open search result .*ui-catalog-${suffix}`) })).toBeVisible();
  await page.goto('/scorecards');
  await page.getByRole('tab', { name: 'Rule builder', exact: true }).click();
  const form = page.getByRole('form', { name: 'scorecard rule builder' });
  await form.getByLabel('Slug', { exact: true }).fill(`ui-score-${suffix}`);
  await form.getByLabel('Title', { exact: true }).fill(`UI Score ${suffix}`);
  await form.getByLabel('Owner', { exact: true }).fill('ui-platform');
  await form.getByLabel('Code', { exact: true }).fill('service.has-name');
  await form.getByLabel('Field', { exact: true }).fill('name');
  await form.getByLabel('Message', { exact: true }).fill('Service has a name');
  await form.getByRole('button', { name: 'Create scorecard', exact: true }).click();
  await expect(form.getByLabel('Slug', { exact: true })).toHaveValue('');
  await page.getByRole('tab', { name: 'Inventory', exact: true }).click();
  await expect(page.getByText(`UI Score ${suffix}`, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(`UI Score ${suffix}`, { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Evaluate entity', exact: true }).click();
  await page.getByLabel('Namespace', { exact: true }).fill('ui-architecture');
  await page.getByLabel('Name', { exact: true }).fill(`ui-catalog-${suffix}`);
  await page.getByRole('button', { name: 'Evaluate', exact: true }).click();
  await expect(page.getByText('No active scorecards target this entity', { exact: true })).toBeVisible();
  await page.goto(`/catalog/Application/ui-architecture/ui-catalog-${suffix}`);
  await page.getByRole('button', { name: 'Delete entity', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete registration', exact: true }).click();
  await page.waitForURL('**/catalog');
  await expect(page.getByText(`ui-architecture/ui-catalog-${suffix}`, { exact: true })).toHaveCount(0);
});

test('environment provisioning and teardown execute real Kubernetes jobs', async ({ page }) => {
  test.setTimeout(240_000);
  const name = `ui-env-${Date.now().toString(36)}`;
  await page.goto('/environments');
  await page.getByRole('button', { name: 'Create environment', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Environment name', { exact: true }).fill(name);
  await dialog.getByLabel('Namespace', { exact: true }).selectOption('ui-architecture');
  await dialog.getByLabel('Team', { exact: true }).fill('ui-platform');
  await dialog.getByLabel('Container image', { exact: true }).fill('nginx:alpine');
  await dialog.getByRole('button', { name: 'Request environment', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.waitForURL('**/changesets/*');
  await expect(page.getByText('applied', { exact: true })).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText('COMPLETED', { exact: true }).first()).toBeVisible();
  await page.goto('/runtime');
  const workload = page.getByRole('button', { name: `Select workload ${name}`, exact: true });
  await expect(workload).toContainText('1/1', { timeout: 90_000 });
  await workload.click();
  await expect(page.getByText('Running', { exact: true }).first()).toBeVisible();
  await page.goto('/environments');
  const row = page.getByText(name, { exact: true }).locator('..').locator('..');
  await expect(row).toContainText('ready', { timeout: 30_000 });
  const expires = await row.innerText();
  page.once('dialog', (prompt) => prompt.accept('1'));
  await row.getByRole('button', { name: 'Extend TTL', exact: true }).click();
  await expect(row).not.toHaveText(expires);
  page.once('dialog', (prompt) => prompt.accept('Real browser validation teardown'));
  await row.getByRole('button', { name: 'Destroy', exact: true }).click();
  await expect(row).toContainText('destroying');
  await row.getByRole('link', { name: 'Open ChangeSet', exact: true }).click();
  await expect(page.getByText('applied', { exact: true })).toBeVisible({ timeout: 120_000 });
  await page.goto('/environments');
  await expect(page.getByText(name, { exact: true }).locator('..').locator('..')).toContainText('destroyed', { timeout: 30_000 });
  await page.goto('/runtime');
  await expect(page.getByRole('button', { name: `Select workload ${name}`, exact: true })).toHaveCount(0);
});

test('access inspection and account sign out use the actual session', async ({ page }) => {
  await page.goto('/access');
  await page.getByRole('button', { name: 'Check permission', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Allowed');
  await page.goto('/settings');
  await expect(page.locator('#main-content')).toContainText('local-admin');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.waitForURL('**/login');
  expect(await page.evaluate(() => localStorage.getItem('zara.authToken'))).toBeNull();
  await page.goto('/settings');
  await page.waitForURL('**/login?redirect=*');
});

test('incident creation, notes and all lifecycle transitions persist', async ({ page }) => {
  const suffix = Date.now().toString(36);
  const title = `UI incident ${suffix}`;
  await page.goto('/incidents');
  await page.getByRole('button', { name: 'Open incident', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Incident slug', { exact: true }).fill(`ui-incident-${suffix}`);
  await dialog.getByLabel('Incident title', { exact: true }).fill(title);
  await dialog.getByLabel('Incident summary', { exact: true }).fill('Real browser lifecycle validation');
  await dialog.getByLabel('Affected service', { exact: true }).fill('ui-architecture-api');
  await dialog.getByLabel('Affected namespace', { exact: true }).fill('ui-architecture');
  await dialog.getByRole('button', { name: 'Create incident', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const detail = page.getByRole('region', { name: 'Incident detail', exact: true });
  await expect(detail).toContainText(title);
  await detail.getByLabel('Incident note', { exact: true }).fill('Persisted investigation note');
  await detail.getByRole('button', { name: 'Append', exact: true }).click();
  await expect(detail.getByText('Persisted investigation note', { exact: true })).toBeVisible();
  await detail.getByRole('button', { name: 'Acknowledge', exact: true }).click();
  await expect(detail.getByRole('button', { name: 'Acknowledge', exact: true })).toHaveCount(0);
  await detail.getByRole('button', { name: 'Mitigate', exact: true }).click();
  await expect(detail.getByRole('button', { name: 'Mitigate', exact: true })).toHaveCount(0);
  await detail.getByRole('button', { name: 'Resolve', exact: true }).click();
  await expect(detail.getByRole('button', { name: 'Resolve', exact: true })).toHaveCount(0);
  await page.reload();
  await page.getByTestId('incidents-filter-resolved').click();
  await page.getByRole('button').filter({ hasText: title }).click();
  await expect(detail).toContainText('Persisted investigation note');
  await expect(detail.getByRole('button', { name: 'Resolve', exact: true })).toHaveCount(0);
});

test('cost budget create, edit and delete persist without fabricated provider costs', async ({ page }) => {
  test.setTimeout(90_000);
  const name = `UI Budget ${Date.now().toString(36)}`;
  await page.goto('/cost');
  await page.getByRole('button', { name: 'Manage budgets', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Budget name', { exact: true }).fill(name);
  await dialog.getByLabel('Budget amount', { exact: true }).fill('120');
  await dialog.getByLabel('Budget team', { exact: true }).fill('ui-platform');
  await dialog.getByRole('button', { name: 'Save budget', exact: true }).click();
  await expect(dialog.getByRole('status')).toHaveText('Budget saved');
  await page.reload();
  await page.getByRole('button', { name: 'Manage budgets', exact: true }).click();
  await dialog.getByRole('button', { name: `Edit ${name}`, exact: true }).click();
  await expect(dialog.getByLabel('Budget amount', { exact: true })).toHaveValue('120');
  await dialog.getByLabel('Budget amount', { exact: true }).fill('150');
  await dialog.getByRole('button', { name: 'Save budget', exact: true }).click();
  await expect(dialog.getByRole('status')).toHaveText('Budget saved');
  await page.reload();
  await page.getByRole('button', { name: 'Manage budgets', exact: true }).click();
  await dialog.getByRole('button', { name: `Edit ${name}`, exact: true }).click();
  await expect(dialog.getByLabel('Budget amount', { exact: true })).toHaveValue('150');
  await dialog.getByRole('button', { name: `Delete ${name}`, exact: true }).click();
  await dialog.getByRole('button', { name: 'Confirm delete budget', exact: true }).click();
  await expect(dialog.getByRole('status')).toHaveText('Budget deleted');
  await expect(dialog.getByRole('button', { name: `Edit ${name}`, exact: true })).toHaveCount(0);
});

test('notification publication reaches the inbox and read state persists', async ({ page }) => {
  const title = `UI notification ${Date.now().toString(36)}`;
  const headers = { Authorization: `Bearer ${process.env.ZARA_LIVE_TOKEN}` };
  const principal = await page.request.get('/api/v1/me', { headers });
  expect(principal.ok()).toBeTruthy();
  const { subject } = await principal.json() as { subject: string };
  // Seed through the actual publisher; no mocked inbox response.
  const published = await page.request.post('/api/v1/notifications/publish', { headers, data: {
    source: 'system', severity: 'info', title, body: 'Persisted inbox validation', subjects: [subject],
    scope: 'ui-validation', idempotencyKey: title, action: { kind: 'environment', id: 'ui-validation', path: '/environments' },
  } });
  expect(published.ok()).toBeTruthy();
  await page.goto('/notifications');
  const article = page.locator('article').filter({ has: page.getByRole('link', { name: title, exact: true }) });
  await expect(article).toBeVisible();
  await article.getByRole('button', { name: 'Mark read', exact: true }).click();
  await expect(article.getByRole('button', { name: 'Mark read', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(article).toBeVisible();
  await expect(article.getByRole('button', { name: 'Mark read', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Unread only', exact: true }).click();
  await expect(article).toHaveCount(0);
});
