import { test, expect } from '@playwright/test';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import net from 'node:net';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { workloadExample } from '../src/features/resources/types/workloadExample';

const run = promisify(execFile);
test.use({ screenshot: 'off', trace: 'off', video: 'off' });

test('workload: frontend provisions ports, init, config, probes; CLI plans; update and teardown', async ({ page }) => {
  test.setTimeout(300_000);
  test.skip(!process.env.ZARA_LIVE_TOKEN || !process.env.ZARA_LOCAL_KUBECONFIG, 'Requires the explicit local test cluster and token');
  const namespace = `workload-${Date.now().toString(36)}`;
  const env = { ...process.env, KUBECONFIG: process.env.ZARA_LOCAL_KUBECONFIG! };
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'zara-workload-'));
  let forward: ReturnType<typeof spawn> | undefined;
  async function freePort() {
    const socket = net.createServer();
    await new Promise<void>((resolve) => socket.listen(0, '127.0.0.1', resolve));
    const port = (socket.address() as net.AddressInfo).port;
    await new Promise<void>((resolve) => socket.close(() => resolve()));
    return port;
  }
  async function applied() {
    await expect(page.getByText('applied', { exact: true })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText('COMPLETED', { exact: true }).first()).toBeVisible();
  }
  try {
    await page.goto('/login');
    await page.getByLabel('Access token', { exact: true }).fill(process.env.ZARA_LIVE_TOKEN!);
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await page.waitForURL((url) => url.pathname !== '/login');
    await page.goto('/namespaces');
    await page.getByRole('button', { name: 'Create Namespace', exact: true }).click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name', { exact: true }).fill(namespace);
    await dialog.getByLabel('Owner Team', { exact: true }).fill('platform-team');
    await dialog.getByLabel('Owner Contact', { exact: true }).fill('local@zara.local');
    await dialog.getByRole('button', { name: 'Create Namespace', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await page.goto('/resources');
    await page.getByRole('button', { name: 'Apply manifests', exact: true }).click();
    await page.getByLabel('Example namespace', { exact: true }).fill(namespace);
    await page.getByRole('button', { name: 'Load Kubernetes workload example', exact: true }).click();
    const manifest = workloadExample(namespace);
    const input = page.getByLabel('Manifest YAML', { exact: true });
    expect(JSON.parse(await input.inputValue())).toEqual(manifest);
    // A conflicting target namespace must fail during preview, before any job.
    await input.fill(JSON.stringify({ ...manifest, spec: { ...manifest.spec, namespace: `${namespace}-escape` } }));
    await page.getByRole('button', { name: 'Validate plan', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('must match metadata.namespace');
    await expect(page.getByRole('button', { name: 'Request provisioning', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Load Kubernetes workload example', exact: true }).click();
    await page.getByRole('button', { name: 'Validate plan', exact: true }).click();
    await expect(page.getByText('Dry run: no resources or jobs have been created.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Request provisioning', exact: true }).click();
    await page.getByRole('link', { name: 'Open ChangeSet', exact: true }).click();
    await applied();
    await page.goto('/runtime');
    const workload = page.getByRole('button', { name: 'Select workload workload-example', exact: true });
    await expect(workload).toContainText('1/1', { timeout: 90_000 });
    // Independent read-only verification of actual cluster objects.
    const { stdout } = await run('kubectl', ['-n', namespace, 'get', 'deployment/workload-example', '-o', 'json'], { env });
    const actual = JSON.parse(stdout).spec.template.spec;
    expect(actual.containers[0].ports).toHaveLength(2);
    expect(actual.initContainers[0].name).toBe('prepare');
    expect(actual.containers[0].env[0].valueFrom.configMapKeyRef.name).toBe('kube-root-ca.crt');
    expect(actual.containers[0].readinessProbe.httpGet.port).toBe(8080);
    expect(actual.containers[0].livenessProbe.tcpSocket.port).toBe(8081);
    expect(actual.containers[0].startupProbe.exec.command).toEqual(['test', '-s', '/work/nginx.conf']);
    const manifestPath = path.join(dir, 'workload.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest), { mode: 0o600 });
    const cli = path.resolve('../zaractl/bin/zaractl');
    const planned = await run(cli, ['--server', process.env.ZARA_LIVE_API ?? 'http://127.0.0.1:8080', 'plan', '-f', manifestPath, '-o', 'json'], { env: { ...env, ZARA_TOKEN: process.env.ZARA_LIVE_TOKEN! } });
    expect(planned.stdout).toContain('workload-example');
    expect(JSON.parse(planned.stdout).summary).toMatchObject({ create: 0, update: 0, unchanged: 1 });
    const ports = [await freePort(), await freePort()];
    forward = spawn('kubectl', ['-n', namespace, 'port-forward', 'service/workload-example', `${ports[0]}:8088`, `${ports[1]}:8081`, '--address=127.0.0.1'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Port-forward did not start')), 20_000);
      forward!.on('error', reject); forward!.on('exit', (code) => reject(new Error(`Port-forward exited ${code}`)));
      forward!.stdout!.on('data', (data) => { if (String(data).includes('Forwarding from')) { clearTimeout(timer); resolve(); } });
    });
    for (const [index, message] of ['Zara workload ready', 'Zara admin ready'].entries()) {
      await page.goto(`http://127.0.0.1:${ports[index]}`);
      await expect(page.locator('body')).toContainText(message);
    }
    await page.goto('/resources');
    await page.getByRole('button', { name: 'Edit Application workload-example', exact: true }).click();
    const specInput = page.getByLabel('Spec (JSON)', { exact: true });
    const edited = JSON.parse(await specInput.inputValue());
    edited.args = ['-c', '/work/nginx.conf', '-g', 'daemon off;', '-e', '/dev/stderr'];
    await specInput.fill(JSON.stringify(edited));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForURL('**/changesets/*'); await applied();
    const updated = await run('kubectl', ['-n', namespace, 'get', 'deployment/workload-example', '-o', 'json'], { env });
    expect(JSON.parse(updated.stdout).spec.template.spec.containers[0].args).toEqual(edited.args);
    await run('kubectl', ['-n', namespace, 'rollout', 'status', 'deployment/workload-example', '--timeout=90s'], { env });
    // Exercise the real CLI mutation path, restoring the original args. Follow
    // its ChangeSet in the frontend and verify the resulting cluster rollout.
    const appliedByCli = await run(cli, ['--server', process.env.ZARA_LIVE_API ?? 'http://127.0.0.1:8080', 'apply', '-f', manifestPath], { env: { ...env, ZARA_TOKEN: process.env.ZARA_LIVE_TOKEN! } });
    const cliChangeSet = appliedByCli.stdout.match(/ID: ([A-Za-z0-9-]+)/)?.[1];
    expect(cliChangeSet).toBeTruthy();
    await page.goto(`/changesets/${cliChangeSet}`); await applied();
    await run('kubectl', ['-n', namespace, 'rollout', 'status', 'deployment/workload-example', '--timeout=90s'], { env });
    const restored = await run('kubectl', ['-n', namespace, 'get', 'deployment/workload-example', '-o', 'json'], { env });
    expect(JSON.parse(restored.stdout).spec.template.spec.containers[0].args).toEqual(manifest.spec.args);
    forward.kill('SIGTERM'); forward = undefined;
    await page.goto('/resources');
    await page.getByRole('button', { name: 'Delete Application workload-example', exact: true }).click();
    dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.waitForURL('**/changesets/*'); await applied();
    const remaining = await run('kubectl', ['-n', namespace, 'get', 'deployments,services', '-o', 'json'], { env });
    expect(JSON.parse(remaining.stdout).items).toEqual([]);
    await page.goto('/namespaces');
    await page.getByRole('button', { name: `Delete namespace ${namespace}`, exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete Namespace', exact: true }).click();
    await expect(page.getByText(namespace, { exact: true })).not.toBeVisible();
    // Portal namespaces are governance records, not Kubernetes Namespace
    // resources. Clean up only this test's empty, uniquely named cluster namespace.
    await run('kubectl', ['delete', 'namespace', namespace, '--wait=true', '--timeout=45s'], { env });
    expect(errors).toEqual([]);
  } finally {
    forward?.kill('SIGTERM');
    await fs.rm(dir, { recursive: true, force: true });
  }
});
