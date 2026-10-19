import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import net from 'node:net';

// Only explicit screenshots after leaving credential-bearing forms are saved.
test.use({ screenshot: 'off', trace: 'off', video: 'off' });

// Deliberately uses the real login and unmodified HTTP transport. Infrastructure
// setup is external; every resource mutation in this journey goes through UI.
test('local architecture: provision, use PostgreSQL, edit, inspect, protect and remove', async ({ page }, testInfo) => {
  test.setTimeout(480_000);
  test.skip(!process.env.ZARA_LOCAL_MANIFEST || !process.env.ZARA_LIVE_TOKEN || !process.env.ZARA_LOCAL_KUBECONFIG,
    'Prepare providers with make local-up and run scripts/test-local-ui.py');
  page.setDefaultTimeout(45_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const original = fs.readFileSync(process.env.ZARA_LOCAL_MANIFEST!, 'utf8').split(/\n---\n/).map((doc) => JSON.parse(doc));
  const namespace = `ui-e2e-${Date.now().toString(36)}`;
  const prefix = namespace.replaceAll('-', '_');
  const role = original.find((r) => r.kind === 'PostgresRole');
  const database = original.find((r) => r.kind === 'PostgresDatabase');
  const schema = original.find((r) => r.kind === 'PostgresSchema');
  const app = original.find((r) => r.kind === 'Application');
  const names = new Map(original.map((r) => [r.metadata.name, `${namespace}-${r.kind.toLowerCase()}`]));
  for (const resource of original) {
    resource.metadata = { ...resource.metadata, name: names.get(resource.metadata.name), namespace };
    for (const ref of resource.spec.dependsOn ?? []) { ref.name = names.get(ref.name); ref.namespace = namespace; }
  }
  role.spec.role_name = `${prefix}_owner`;
  database.spec.database_name = `${prefix}_db`;
  database.spec.owner = role.spec.role_name;
  schema.spec.database = database.spec.database_name;
  schema.spec.owner = role.spec.role_name;
  app.spec.name = app.metadata.name;
  app.spec.namespace = namespace;
  const url = new URL(app.spec.env.DATABASE_URL);
  url.username = role.spec.role_name;
  url.pathname = `/${database.spec.database_name}`;
  app.spec.env.DATABASE_URL = url.toString();
  let forward: ReturnType<typeof spawn> | undefined;
  async function login() {
    console.info("UI architecture: login");
    await page.goto('/login');
    await page.getByLabel('Access token', { exact: true }).fill(process.env.ZARA_LIVE_TOKEN!);
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await page.waitForURL((value) => value.pathname !== '/login');
  }
  async function applied(p: Page) {
    await expect(p.getByText('applied', { exact: true })).toBeVisible({ timeout: 120_000 });
    await expect(p.getByText('COMPLETED', { exact: true }).first()).toBeVisible();
  }
  try {
    await login();
    console.info('UI architecture: create namespace');
    await page.goto('/namespaces');
    await page.getByRole('button', { name: 'Create Namespace', exact: true }).click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name', { exact: true }).fill(namespace);
    await dialog.getByLabel('Owner Team', { exact: true }).fill('ui-platform');
    await dialog.getByLabel('Owner Contact', { exact: true }).fill('ui-test@zara.local');
    await dialog.getByRole('button', { name: 'Create Namespace', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await page.goto('/resources');
    await page.getByRole('button', { name: 'Apply manifests', exact: true }).click();
    // Reverse dependency order exercises validation and topological execution.
    await page.getByLabel('Manifest YAML', { exact: true }).fill([...original].reverse().map((r) => JSON.stringify(r)).join('\n---\n'));
    await page.getByRole('button', { name: 'Validate plan', exact: true }).click();
    await expect(page.getByText('Dry run: no resources or jobs have been created.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Request provisioning', exact: true }).click();
    await page.getByRole('link', { name: 'Open ChangeSet', exact: true }).click();
    await applied(page);
    console.info("UI architecture: four provisioning jobs completed");
    await page.goto('/resources');
    await page.screenshot({ path: testInfo.outputPath('provisioned.png'), fullPage: true });
    await page.goto('/runtime');
    const workload = page.getByRole('button', { name: `Select workload ${app.spec.name}`, exact: true });
    await expect(workload).toContainText('1/1', { timeout: 90_000 });
    await workload.click();
    await expect(page.getByText('Running', { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: /^View logs for / }).click();
    await expect(page.getByRole('dialog')).toContainText('local demo listening');
    await page.getByRole('dialog').getByRole('button', { name: 'Close dialog', exact: true }).click();
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as net.AddressInfo).port;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    forward = spawn('kubectl', ['-n', namespace, 'port-forward', `service/${app.spec.name}`, `${port}:8080`, '--address=127.0.0.1'], {
      env: { ...process.env, KUBECONFIG: process.env.ZARA_LOCAL_KUBECONFIG! }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Local application port-forward did not start')), 20_000);
      forward!.on('error', reject);
      forward!.on('exit', (code) => reject(new Error(`Port-forward exited: ${code}`)));
      forward!.stdout!.on('data', (chunk) => { if (String(chunk).includes('Forwarding from')) { clearTimeout(timer); resolve(); } });
    });
    await page.goto(`http://127.0.0.1:${port}`);
    await expect(page.getByText('Conectado ao PostgreSQL', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Registrar visita', exact: true }).click();
    await expect(page.locator('body')).toContainText('1 visitas persistidas');
    await page.screenshot({ path: testInfo.outputPath('application.png'), fullPage: true });
    await page.goto('/resources');
    await page.getByRole('button', { name: `Edit PostgresDatabase ${database.metadata.name}`, exact: true }).click();
    const spec = page.getByLabel('Spec (JSON)', { exact: true });
    const edited = JSON.parse(await spec.inputValue()); edited.connection_limit = 31;
    await spec.fill(JSON.stringify(edited));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForURL('**/changesets/*'); await applied(page);
    await page.goto(`http://127.0.0.1:${port}`);
    await expect(page.locator('body')).toContainText('1 visitas persistidas');
    await page.getByRole('button', { name: 'Registrar visita', exact: true }).click();
    await expect(page.locator('body')).toContainText('2 visitas persistidas');
    await page.goto('/resources');
    await page.getByRole('button', { name: `Detect drift on PostgresDatabase ${database.metadata.name}`, exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('No Drift Detected');
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    await page.goto('/namespaces');
    await page.getByRole('button', { name: `Delete namespace ${namespace}`, exact: true }).click();
    dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Delete Namespace', exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText('resources');
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    forward.kill('SIGTERM'); forward = undefined;
    await page.goto('/resources');
    await page.getByRole('button', { name: `Delete PostgresRole ${role.metadata.name}`, exact: true }).click();
    dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText('dependents');
    await dialog.getByLabel('Also delete dependent resources (administrator)', { exact: true }).check();
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.waitForURL('**/changesets/*'); await applied(page);
    await page.goto('/resources');
    for (const resource of original) await expect(page.getByText(resource.metadata.name, { exact: true })).not.toBeVisible();
    await page.goto('/namespaces');
    await page.getByRole('button', { name: `Delete namespace ${namespace}`, exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete Namespace', exact: true }).click();
    await expect(page.getByText(namespace, { exact: true })).not.toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    forward?.kill('SIGTERM');
    // Failed resources are retained for diagnosis; do not mask a failed journey
    // with out-of-band API writes or delete infrastructure behind the UI.
  }
});
