import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { CatalogRegistration } from '../src/features/catalog/types';

// Native browser + actual local API and simulator. No intercepted responses,
// no API fixture seeding and no cloud write credentials.
test.use({ screenshot: 'off', video: 'off', trace: 'off', actionTimeout: 20_000 });
const inventoryFile = process.env.ZARA_MEUCONTROLE_INVENTORY;
const manifestFile = process.env.ZARA_MEUCONTROLE_MANIFESTS;
test.beforeEach(async ({ page }) => {
  test.skip(!process.env.ZARA_LIVE_TOKEN || !inventoryFile, 'Requires the local token and private read-only inventory snapshot');
  await page.goto('/login');
  await page.getByLabel('Access token', { exact: true }).fill(process.env.ZARA_LIVE_TOKEN!);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.waitForURL((url) => url.pathname !== '/login');
});

async function importInventory(page: Page, expected: number, retry: boolean) {
  await page.goto('/catalog');
  await page.getByRole('button', { name: 'Import inventory', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Inventory JSON file', { exact: true }).setInputFiles(inventoryFile!);
  if (!retry) await dialog.getByRole('checkbox', { name: 'Refresh specifications and relationships of existing registrations', exact: true }).check();
  await dialog.getByRole('button', { name: 'Preview inventory', exact: true }).click();
  await expect(dialog.getByRole('region', { name: 'Inventory preview' })).toContainText(`${expected} registrations`);
  await dialog.getByRole('button', { name: 'Register inventory', exact: true }).click();
  const completed = dialog.getByText(/\d+ created, \d+ updated, \d+ skipped, \d+ failed/);
  await expect(completed).toBeVisible({ timeout: 600_000 });
  for (let attempt = 0; attempt < 2 && !(await completed.textContent())!.endsWith('0 failed'); attempt++) {
    console.info('UI inventory: resume the partial import using its retry button');
    await dialog.getByRole('button', { name: 'Register inventory', exact: true }).click();
    await expect(dialog.getByText('Registering inventory. Keep this dialog open until the import completes.', { exact: true })).toHaveCount(0, { timeout: 600_000 });
    await expect(completed).toBeVisible({ timeout: 600_000 });
  }
  await expect(completed).toContainText('0 failed');
  console.info(`UI inventory: ${await completed.textContent()}`);
  if (retry) await expect(dialog.getByRole('status')).toHaveText(`0 created, 0 updated, ${expected} skipped, 0 failed`);
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click();
}

test('catalog: register complete inventory through UI, retry safely and inspect each resource category', async ({ page }, info) => {
  test.setTimeout(900_000);
  const inventory = JSON.parse(readFileSync(inventoryFile!, 'utf8')) as CatalogRegistration[];
  const failures: string[] = [];
  page.on('pageerror', (error) => { failures.push(error.message); console.info(`Browser page error: ${error.message}`); });
  page.on('response', (response) => { if (response.url().includes('/api/') && response.status() >= 400 && response.status() !== 429) failures.push(`${response.status()} ${new URL(response.url()).pathname}`); });
  await importInventory(page, inventory.length, false);
  await importInventory(page, inventory.length, true);
  await page.reload();
  await page.getByLabel('Filter catalog', { exact: true }).fill('meucontrole-dev/');
  await expect(page.getByRole('status')).toContainText(`${inventory.length} of`);
  const observed = new Set<string>();
  while (true) {
    for (const name of await page.getByRole('region', { name: 'Catalog entities' }).getByRole('link').allTextContents()) observed.add(name);
    const next = page.getByRole('button', { name: 'Next', exact: true });
    if (await next.isDisabled()) break;
    await next.click();
  }
  expect(observed.size).toBe(inventory.length);
  console.info(`UI catalog: traversed ${observed.size} registrations across every page`);
  const categories = new Map<string, CatalogRegistration>();
  for (const entity of inventory) categories.set(String(entity.spec.type ?? entity.kind), entity);
  for (const [category, entity] of categories) {
    await test.step(category, async () => {
      await page.getByRole('link', { name: /^Catalog(?: \(current page\))?$/ }).click();
      await page.getByLabel('Filter catalog', { exact: true }).fill(`meucontrole-dev/${entity.name}`);
      await page.getByRole('link', { name: `meucontrole-dev/${entity.name}`, exact: true }).click();
      await expect(page.getByRole('heading', { name: `meucontrole-dev/${entity.name}`, exact: true })).toBeVisible();
      if (entity.spec.managementMode === 'catalog-only') await expect(page.getByText('Inventory snapshot · Metadata only', { exact: true })).toBeVisible();
      await expect(page.getByRole('region', { name: 'Catalog entity graph' })).toBeVisible();
      await expect(page.getByText('Catalog entity graph unavailable')).toHaveCount(0);
      console.info(`UI catalog inspected: ${category}`);
    });
  }
  await page.screenshot({ path: info.outputPath('catalog-inventory.png'), fullPage: true });
  expect(failures).toEqual([]);
  console.info(`UI: ${inventory.length} entities registered, retry idempotent, all pages traversed, ${categories.size} resource categories inspected`);
});

test('runtime: create local namespace and provision ten databases, schema, cache, AWS simulator and database witness', async ({ page }, info) => {
  test.skip(!manifestFile, 'Requires private generated local manifests');
  test.setTimeout(360_000);
  await page.goto('/teams');
  await page.waitForLoadState('networkidle');
  for (const [name, displayName] of [['platform-team', 'MeuControle Platform'], ['orders-team', 'MeuControle Orders'], ['identity-team', 'MeuControle Identity']]) {
    if (await page.getByText(name, { exact: true }).count()) continue;
    await page.getByRole('button', { name: 'Create Team', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name', { exact: true }).fill(name);
    await dialog.getByLabel('Display Name', { exact: true }).fill(displayName);
    await dialog.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(dialog).not.toBeVisible();
  }
  await page.goto('/namespaces');
  await page.waitForLoadState('networkidle');
  if (!(await page.getByRole('heading', { name: 'meucontrole-dev', exact: true }).count())) {
    await page.getByRole('button', { name: 'Create Namespace', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name', { exact: true }).fill('meucontrole-dev');
    await dialog.getByLabel('Owner Team', { exact: true }).fill('platform-team');
    await dialog.getByLabel('Owner Contact', { exact: true }).fill('local-admin@zara.local');
    await dialog.getByRole('button', { name: 'Create Namespace', exact: true }).click();
    await expect(dialog).not.toBeVisible();
  }
  await page.goto('/resources');
  await page.getByRole('button', { name: 'Apply manifests', exact: true }).click();
  await page.getByLabel('Manifest YAML', { exact: true }).fill(readFileSync(manifestFile!, 'utf8'));
  await page.getByRole('button', { name: 'Validate plan', exact: true }).click();
  await expect(page.getByText('Dry run: no resources or jobs have been created.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Request provisioning', exact: true }).click();
  await page.getByRole('link', { name: 'Open ChangeSet', exact: true }).click();
  await expect(page.getByText('applied', { exact: true })).toBeVisible({ timeout: 180_000 });
  await expect(page.getByText('COMPLETED', { exact: true })).toHaveCount(15, { timeout: 180_000 });
  await page.goto('/runtime');
  for (const name of ['meucontrole-aws-simulator', 'meucontrole-cache', 'meucontrole-infrastructure-check']) {
    await expect(page.getByRole('button', { name: `Select workload ${name}`, exact: true })).toContainText('1/1', { timeout: 180_000 });
  }
  await page.screenshot({ path: info.outputPath('local-runtime.png'), fullPage: true });
  console.info('UI: 15 real local provisioning jobs completed; all three workloads have one ready replica');
});

test('simulation: initialize AWS equivalents and prove event delivery, object persistence and PostgreSQL writes via frontend', async ({ page }, info) => {
  test.skip(!process.env.ZARA_MEUCONTROLE_SIMULATOR_READY, 'Start loopback port forwards for simulator and database witness after provisioning');
  test.setTimeout(240_000);
  await page.goto('/development');
  await page.getByLabel('Local simulation inventory', { exact: true }).setInputFiles(inventoryFile!);
  await expect(page.getByText(/86 queues, 13 buckets, 7 event buses available/)).toBeVisible();
  await page.getByRole('button', { name: 'Initialize local simulation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Initialize local simulation', exact: true })).toBeEnabled({ timeout: 180_000 });
  await expect(page.getByRole('status', { name: 'Local simulation progress', exact: true })).toHaveText('Local simulation ready');
  await expect(page.getByLabel('Local simulation results')).toContainText('86 queues, 13 buckets, 7 buses, 57 rules');
  await expect(page.getByLabel('Local simulation results')).toContainText('1 additional local DLQs configured');
  // A second initialization must preserve resources and handle existing buses.
  await page.getByRole('button', { name: 'Initialize local simulation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Initialize local simulation', exact: true })).toBeEnabled({ timeout: 180_000 });
  await expect(page.getByRole('status', { name: 'Local simulation progress', exact: true })).toHaveText('Local simulation ready');
  await page.screenshot({ path: info.outputPath('local-aws-inventory.png'), fullPage: true });
  await page.getByRole('button', { name: 'Test event and object flows', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Test event and object flows', exact: true })).toBeEnabled({ timeout: 30_000 });
  await expect(page.getByRole('status', { name: 'Local simulation progress', exact: true })).toHaveText('Local data flows verified');
  await expect(page.getByLabel('Local simulation results')).toContainText('PASS: EventBridge event delivered to SQS and acknowledged.');
  await expect(page.getByLabel('Local simulation results')).toContainText('PASS: S3 object written and read with matching content.');
  await page.getByRole('button', { name: 'Test event and object flows', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Test event and object flows', exact: true })).toBeEnabled({ timeout: 30_000 });
  await expect(page.getByRole('status', { name: 'Local simulation progress', exact: true })).toHaveText('Local data flows verified');
  await page.screenshot({ path: info.outputPath('local-aws-data-flows.png'), fullPage: true });
  await page.goto('http://127.0.0.1:18082');
  await expect(page.getByText('Conectado ao PostgreSQL', { exact: true })).toBeVisible();
  const counter = page.locator('#count');
  await expect(counter).toHaveText(/^\d+ visitas persistidas$/);
  const initialVisits = Number((await counter.textContent())!.split(' ')[0]);
  await page.getByRole('button', { name: 'Registrar visita', exact: true }).click();
  await expect(counter).toHaveText(`${initialVisits + 1} visitas persistidas`);
  await page.reload();
  await expect(counter).toHaveText(`${initialVisits + 1} visitas persistidas`);
  await page.screenshot({ path: info.outputPath('local-postgres-write.png'), fullPage: true });
  console.info('UI: original queue/bus/rule topology instantiated locally; EventBridge→SQS delivery and ACK, S3 PUT/GET and PostgreSQL persistence passed');
});
