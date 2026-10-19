import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const run = promisify(execFile);
test.use({ screenshot: 'off', trace: 'off', video: 'off', actionTimeout: 15_000, navigationTimeout: 30_000 });
test('frontend and CLI reject inline Secret values before persistence', async ({ page }) => {
  test.skip(!process.env.ZARA_LIVE_TOKEN, 'Requires the explicit local session');
  const name = `invalid-secret-${Date.now().toString(36)}`;
  const manifest = { apiVersion: 'zara.internal/v1', kind: 'Secret', metadata: { name, namespace: 'meucontrole-dev' }, spec: { name, namespace: 'meucontrole-dev', type: 'opaque', data: { PASSWORD: 'invalid-inline-test-marker' } } };
  await page.goto('/login');
  await page.getByLabel('Access token', { exact: true }).fill(process.env.ZARA_LIVE_TOKEN!);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.waitForURL((url) => url.pathname !== '/login');
  await page.goto('/resources');
  await page.getByRole('button', { name: 'Apply manifests', exact: true }).click();
  await page.getByLabel('Manifest YAML', { exact: true }).fill(JSON.stringify(manifest));
  await page.getByRole('button', { name: 'Validate plan', exact: true }).click();
  await expect(page.getByText('Manifest request failed', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('inline Secret data is forbidden');
  await expect(page.getByRole('button', { name: 'Request provisioning', exact: true })).toBeDisabled();
  await page.goto('/resources');
  await page.getByLabel('Namespace', { exact: true }).selectOption('meucontrole-dev');
  await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'zara-inline-secret-'));
  try {
    const input = path.join(dir, 'invalid.json');
    await fs.writeFile(input, JSON.stringify(manifest), { mode: 0o600 });
    let failure: { code?: number; stderr?: string } | undefined;
    try {
      await run(path.resolve('../zaractl/bin/zaractl'), ['--server', 'http://127.0.0.1:8080', 'plan', '-f', input, '-o', 'json'], { env: { ...process.env, ZARA_TOKEN: process.env.ZARA_LIVE_TOKEN! } });
    } catch (error) { failure = error as typeof failure; }
    expect(failure?.code).toBe(1);
    expect(failure?.stderr).toContain('inline Secret data is forbidden');
    expect(failure?.stderr).not.toContain('invalid-inline-test-marker');
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
