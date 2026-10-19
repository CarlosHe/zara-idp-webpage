import { test, expect } from '@playwright/test';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { architectureExample } from '../src/features/resources/types/architectureExample';

const run = promisify(execFile);
test.use({ screenshot: 'off', trace: 'off', video: 'off' });
test('persistent architecture: frontend migration, PVC, application, actual scheduled execution; CLI and teardown', async ({ page }) => {
  test.setTimeout(420_000);
  test.skip(!process.env.ZARA_LIVE_TOKEN || !process.env.ZARA_LOCAL_KUBECONFIG, 'Requires explicit local credentials');
  const namespace = `architecture-${Date.now().toString(36)}`;
  const env = { ...process.env, KUBECONFIG: process.env.ZARA_LOCAL_KUBECONFIG!, ZARA_TOKEN: process.env.ZARA_LIVE_TOKEN! };
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'zara-architecture-'));
  let forward: ReturnType<typeof spawn> | undefined;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const applied = async () => {
    await expect(page.getByText('applied', { exact: true })).toBeVisible({ timeout: 150_000 });
    await expect(page.getByText('COMPLETED', { exact: true }).first()).toBeVisible();
  };
  try {
    await page.goto('/login');
    await page.getByLabel('Access token', { exact: true }).fill(process.env.ZARA_LIVE_TOKEN!);
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await page.waitForURL((url) => url.pathname !== '/login');
    await page.goto('/namespaces');
    await page.getByRole('button', { name: 'Create Namespace', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name', { exact: true }).fill(namespace);
    await dialog.getByLabel('Owner Team', { exact: true }).fill('platform-team');
    await dialog.getByLabel('Owner Contact', { exact: true }).fill('local@zara.local');
    await dialog.getByRole('button', { name: 'Create Namespace', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await page.goto('/resources');
    await page.getByRole('button', { name: 'Apply manifests', exact: true }).click();
    await page.getByLabel('Example namespace', { exact: true }).fill(namespace);
    await page.getByRole('button', { name: 'Load persistent architecture example', exact: true }).click();
    await page.getByRole('button', { name: 'Validate plan', exact: true }).click();
    await expect(page.getByText('Dry run: no resources or jobs have been created.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Request provisioning', exact: true }).click();
    await page.getByRole('link', { name: 'Open ChangeSet', exact: true }).click();
    await applied();
    await run('kubectl', ['-n', namespace, 'rollout', 'status', 'deployment/architecture-web', '--timeout=90s'], { env });
    const job = JSON.parse((await run('kubectl', ['-n', namespace, 'get', 'job/architecture-migrate', '-o', 'json'], { env })).stdout);
    expect(job.status.succeeded).toBe(1);
    const pvc = JSON.parse((await run('kubectl', ['-n', namespace, 'get', 'pvc/architecture-data', '-o', 'json'], { env })).stdout);
    expect(pvc.status.phase).toBe('Bound');
    const file = await run('kubectl', ['-n', namespace, 'exec', 'deployment/architecture-web', '--', 'cat', '/data/index.html'], { env });
    expect(file.stdout.trim()).toBe('Zara persistent architecture ready');
    // Probe clients are test instrumentation; all seven managed objects above are created through the frontend.
    for (const [name, label] of [['allowed-probe', 'architecture-client'], ['blocked-probe', 'untrusted-client']]) {
      await run('kubectl', ['-n', namespace, 'run', name, '--image=nginx:alpine', `--labels=app=${label}`, '--restart=Never', '--command', '--', 'sleep', '300'], { env });
      await run('kubectl', ['-n', namespace, 'wait', '--for=condition=Ready', `pod/${name}`, '--timeout=60s'], { env });
    }
    const probe = async (name: string) => {
      try { return (await run('kubectl', ['-n', namespace, 'exec', name, '--', 'wget', '-q', '-T', '2', '-O', '-', 'http://architecture-web:8080'], { env, timeout: 12_000 })).stdout.trim(); }
      catch (error) {
        const failure = error as { code?: number; stderr?: string };
        if (failure.code === 1 && /wget:.*(timed out|refused|unreachable)/i.test(failure.stderr ?? '')) return 'connection-denied';
        throw error;
      }
    };
    // A positive control proves that a timeout isn't merely a broken application or DNS.
    await expect.poll(() => probe('allowed-probe'), { timeout: 45_000 }).toBe('Zara persistent architecture ready');
    await expect.poll(() => probe('blocked-probe'), { timeout: 45_000 }).toBe('connection-denied');
    await run('kubectl', ['-n', namespace, 'delete', 'pod', 'allowed-probe', 'blocked-probe', '--wait=false'], { env });
    const secret = JSON.parse((await run('kubectl', ['-n', namespace, 'get', 'secret/architecture-credentials', '-o', 'json'], { env })).stdout);
    expect(Buffer.from(secret.data.API_KEY, 'base64').length).toBe(43);
    expect(secret.immutable).toBe(true);
    await page.goto('/runtime');
    await page.getByRole('button', { name: 'Select workload architecture-migrate', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Instances \/ pods/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /View logs for architecture-migrate-/ })).toBeVisible();
    await page.getByRole('button', { name: /View logs for architecture-migrate-/ }).click();
    await expect(page.getByRole('dialog')).toContainText('Zara migration completed');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Governed actions', exact: true })).not.toBeVisible();
    const manifests = architectureExample(namespace);
    const input = path.join(dir, 'architecture.yaml');
    await fs.writeFile(input, manifests.map((resource) => JSON.stringify(resource)).join('\n---\n'), { mode: 0o600 });
    const cli = path.resolve('../zaractl/bin/zaractl');
    const plan = await run(cli, ['--server', 'http://127.0.0.1:8080', 'plan', '-f', input, '-o', 'json'], { env });
    expect(JSON.parse(plan.stdout).summary).toMatchObject({ create: 0, update: 0, unchanged: 7 });
    // No manually created Job: this file must come from the actual CronJob controller.
    await expect.poll(async () => {
      try { return (await run('kubectl', ['-n', namespace, 'exec', 'deployment/architecture-web', '--', 'cat', '/data/last-refresh.txt'], { env })).stdout.trim(); }
      catch { return ''; }
    }, { timeout: 100_000, intervals: [2000, 5000] }).not.toBe('');
    await expect.poll(async () => {
      const scheduled = JSON.parse((await run('kubectl', ['-n', namespace, 'get', 'jobs', '-o', 'json'], { env })).stdout).items;
      return scheduled.some((item: { metadata: { ownerReferences?: { kind: string; name: string }[] }; status: { succeeded?: number } }) => item.metadata.ownerReferences?.some((owner) => owner.kind === 'CronJob' && owner.name === 'architecture-refresh') && item.status.succeeded === 1);
    }, { timeout: 30_000 }).toBe(true);
    const cronInput = path.join(dir, 'cron.json');
    const cron = manifests.find((resource) => resource.kind === 'CronJob')!;
    await fs.writeFile(cronInput, JSON.stringify({ ...cron, spec: { ...cron.spec, suspend: true } }), { mode: 0o600 });
    const cliApply = await run(cli, ['--server', 'http://127.0.0.1:8080', 'apply', '-f', cronInput], { env });
    const changeSet = cliApply.stdout.match(/ID: ([A-Za-z0-9-]+)/)?.[1];
    expect(changeSet).toBeTruthy();
    await page.goto(`/changesets/${changeSet}`); await applied();
    const suspended = JSON.parse((await run('kubectl', ['-n', namespace, 'get', 'cronjob/architecture-refresh', '-o', 'json'], { env })).stdout);
    expect(suspended.spec.suspend).toBe(true);
    // Recreate the application's Pod; the data must survive on the same PVC.
    const beforeRestart = JSON.parse((await run('kubectl', ['-n', namespace, 'get', 'pods', '-l', 'app=architecture-web', '-o', 'json'], { env })).stdout).items.map((pod: { metadata: { uid: string } }) => pod.metadata.uid);
    await page.goto('/runtime');
    await page.getByRole('button', { name: 'Select workload architecture-web', exact: true }).click();
    await page.getByLabel('Reason (optional)', { exact: true }).fill('Verify persistent data after a governed restart');
    await page.getByRole('button', { name: 'Restart workload', exact: true }).click();
    await page.getByRole('link', { name: 'Open ChangeSet', exact: true }).click();
    await page.getByRole('button', { name: 'Apply / Retry execution', exact: true }).click();
    await applied();
    await run('kubectl', ['-n', namespace, 'rollout', 'status', 'deployment/architecture-web', '--timeout=90s'], { env });
    const afterRestart = JSON.parse((await run('kubectl', ['-n', namespace, 'get', 'pods', '-l', 'app=architecture-web', '-o', 'json'], { env })).stdout).items.map((pod: { metadata: { uid: string } }) => pod.metadata.uid);
    expect(afterRestart).not.toEqual(beforeRestart);
    const socket = net.createServer(); await new Promise<void>((resolve) => socket.listen(0, '127.0.0.1', resolve));
    const port = (socket.address() as net.AddressInfo).port; await new Promise<void>((resolve) => socket.close(() => resolve()));
    forward = spawn('kubectl', ['-n', namespace, 'port-forward', 'service/architecture-web', `${port}:8080`, '--address=127.0.0.1'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Port-forward timeout')), 20_000);
      forward!.once('error', reject); forward!.once('exit', (code) => reject(new Error(`Port-forward exited ${code}`)));
      forward!.stdout!.on('data', (data) => { if (String(data).includes('Forwarding from')) { clearTimeout(timer); resolve(); } });
    });
    await page.goto(`http://127.0.0.1:${port}`); await expect(page.locator('body')).toContainText('Zara persistent architecture ready');
    forward.kill('SIGTERM'); forward = undefined;
    for (const [kind, name] of [['NetworkPolicy', 'architecture-ingress'], ['CronJob', 'architecture-refresh'], ['Application', 'architecture-web'], ['Job', 'architecture-migrate'], ['Volume', 'architecture-data'], ['ConfigMap', 'architecture-settings'], ['Secret', 'architecture-credentials']]) {
      await page.goto('/resources');
      await page.getByLabel('Namespace', { exact: true }).selectOption(namespace);
      await page.getByRole('button', { name: `Delete ${kind} ${name}`, exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
      await page.waitForURL('**/changesets/*'); await applied();
    }
    await expect.poll(async () => JSON.parse((await run('kubectl', ['-n', namespace, 'get', 'pvc,jobs,cronjobs,deployments,services,secrets,networkpolicies', '-o', 'json'], { env })).stdout).items.length, { timeout: 45_000 }).toBe(0);
    // A real failing migration must prevent the dependent Deployment from being created.
    const negative = [
      { apiVersion: 'zara.internal/v1', kind: 'Job', metadata: { name: 'blocked-migrate', namespace }, spec: { name: 'blocked-migrate', namespace, image: 'nginx:alpine', command: ['sh', '-c', 'exit 7'], backoff_limit: 0, active_deadline_seconds: 30 } },
      { apiVersion: 'zara.internal/v1', kind: 'Application', metadata: { name: 'blocked-web', namespace }, spec: { name: 'blocked-web', namespace, image: 'nginx:alpine', platform: 'kubernetes', dependsOn: [{ kind: 'Job', name: 'blocked-migrate' }] } },
    ];
    await page.goto('/resources');
    await page.getByRole('button', { name: 'Apply manifests', exact: true }).click();
    await page.getByLabel('Manifest YAML', { exact: true }).fill(negative.map((item) => JSON.stringify(item)).join('\n---\n'));
    await page.getByRole('button', { name: 'Validate plan', exact: true }).click();
    await expect(page.getByText('Dry run: no resources or jobs have been created.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Request provisioning', exact: true }).click();
    await page.getByRole('link', { name: 'Open ChangeSet', exact: true }).click();
    await expect(page.getByText('failed', { exact: true }).first()).toBeVisible({ timeout: 120_000 });
    await expect(page.getByText('FAILED', { exact: true }).first()).toBeVisible();
    await page.goto('/resources');
    await page.getByLabel('Namespace', { exact: true }).selectOption(namespace);
    for (const name of ['blocked-migrate', 'blocked-web']) {
      const row = page.getByRole('row').filter({ has: page.getByText(name, { exact: true }) });
      await expect(row).toContainText('FAILED');
    }
    const blocked = JSON.parse((await run('kubectl', ['-n', namespace, 'get', 'deployment', '-o', 'json'], { env })).stdout);
    expect(blocked.items).toEqual([]);
    const failedMigration = JSON.parse((await run('kubectl', ['-n', namespace, 'get', 'job/blocked-migrate', '-o', 'json'], { env })).stdout);
    expect(failedMigration.status.conditions.some((condition: { type: string; status: string }) => condition.type === 'Failed' && condition.status === 'True')).toBe(true);
    for (const [kind, name] of [['Application', 'blocked-web'], ['Job', 'blocked-migrate']]) {
      await page.goto('/resources');
      await page.getByLabel('Namespace', { exact: true }).selectOption(namespace);
      await page.getByRole('button', { name: `Delete ${kind} ${name}`, exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
      await page.waitForURL('**/changesets/*'); await applied();
    }
    await page.goto('/namespaces');
    await page.getByRole('button', { name: `Delete namespace ${namespace}`, exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete Namespace', exact: true }).click();
    await expect(page.getByText(namespace, { exact: true })).not.toBeVisible();
    await run('kubectl', ['delete', 'namespace', namespace, '--wait=true', '--timeout=45s'], { env });
    expect(errors).toEqual([]);
  } finally { forward?.kill('SIGTERM'); await fs.rm(dir, { recursive: true, force: true }); }
});
