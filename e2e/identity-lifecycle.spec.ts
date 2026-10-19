import { test, expect } from '@playwright/test';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const run = promisify(execFile);
test.use({ screenshot: 'off', trace: 'off', video: 'off', actionTimeout: 15_000, navigationTimeout: 30_000 });

test('local identity: frontend provisions migrations and real Kratos/Hydra; auth survives governed restart', async ({ page }) => {
  test.setTimeout(480_000);
  test.skip(!process.env.ZARA_LIVE_TOKEN || !process.env.ZARA_LOCAL_KUBECONFIG, 'Requires explicit local credentials and prepared identity manifests');
  const input = path.resolve('../zara-control-plane/.local/meucontrole-dev/identity-manifests.yaml');
  const manifestText = await fs.readFile(input, 'utf8');
  const manifests = manifestText.split('\n---\n').map((item) => JSON.parse(item) as { kind: string; metadata: { name: string } });
  const withSso = manifests.some((item) => item.metadata.name === 'meucontrole-sso-web');
  const env = { ...process.env, KUBECONFIG: process.env.ZARA_LOCAL_KUBECONFIG!, ZARA_TOKEN: process.env.ZARA_LIVE_TOKEN! };
  const forwards: ReturnType<typeof spawn>[] = [];
  const applied = async () => expect(page.getByText('applied', { exact: true })).toBeVisible({ timeout: 180_000 });
  try {
    await page.goto('/login');
    await page.getByLabel('Access token', { exact: true }).fill(process.env.ZARA_LIVE_TOKEN!);
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await page.waitForURL((url) => url.pathname !== '/login');
    await page.goto('/resources');
    await page.getByRole('button', { name: 'Apply manifests', exact: true }).click();
    await page.getByLabel('Manifest YAML', { exact: true }).fill(manifestText);
    await page.getByRole('button', { name: 'Validate plan', exact: true }).click();
    await expect(page.getByText('Dry run: no resources or jobs have been created.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Request provisioning', exact: true }).click();
    await page.getByRole('link', { name: 'Open ChangeSet', exact: true }).click();
    await applied();
    console.info('Identity ChangeSet applied');
    for (const engine of ['kratos', 'hydra']) {
      await run('kubectl', ['-n', 'meucontrole-dev', 'rollout', 'status', `deployment/meucontrole-${engine}`, '--timeout=120s'], { env });
      console.info(`Identity rollout ready: ${engine}`);
      const job = JSON.parse((await run('kubectl', ['-n', 'meucontrole-dev', 'get', `job/meucontrole-${engine}-migrate-v1`, '-o', 'json'], { env })).stdout);
      expect(job.status.succeeded).toBe(1);
      await page.goto('/runtime');
      await page.getByRole('button', { name: `Select workload meucontrole-${engine}`, exact: true }).click();
      await expect(page.getByRole('button', { name: new RegExp(`View logs for meucontrole-${engine}-`) })).toBeVisible();
    }
    console.info('Identity Runtime views loaded');
    const cliPlan = await run(path.resolve('../zaractl/bin/zaractl'), ['--server', 'http://127.0.0.1:8080', 'plan', '-f', input, '-o', 'json'], { env });
    expect(JSON.parse(cliPlan.stdout).summary).toMatchObject({ create: 0, update: 0, unchanged: manifests.length });
    for (const [engine, ports] of [['kratos', ['18433:4433', '18434:4434']], ['hydra', ['18444:4444', '18445:4445']]] as const) {
      const forward = spawn('kubectl', ['-n', 'meucontrole-dev', 'port-forward', `service/meucontrole-${engine}`, ...ports, '--address=127.0.0.1'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
      forwards.push(forward);
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Port-forward timeout for ${engine}`)), 20_000);
        forward.once('error', reject);
        forward.once('exit', (code) => reject(new Error(`Port-forward exited ${code}`)));
        forward.stdout.on('data', (data) => { if (String(data).includes('Forwarding from')) { clearTimeout(timer); resolve(); } });
      });
    }
    if (withSso) {
      for (const component of ['gateway', 'web']) {
        await run('kubectl', ['-n', 'meucontrole-dev', 'rollout', 'status', `deployment/meucontrole-sso-${component}`, '--timeout=90s'], { env });
        const port = component === 'gateway' ? '18500:3000' : '18580:8080';
        const forward = spawn('kubectl', ['-n', 'meucontrole-dev', 'port-forward', `service/meucontrole-sso-${component}`, port, '--address=127.0.0.1'], { env, stdio: 'ignore' });
        forwards.push(forward);
      }
    }
    console.info('Identity CLI plan matched; local endpoints forwarded');
    const email = `zara-${Date.now()}@local.invalid`;
    const password = crypto.randomBytes(24).toString('base64url');
    const registration = await (await page.request.get('http://127.0.0.1:18433/self-service/registration/api')).json();
    const registered = await page.request.post(`http://127.0.0.1:18433/self-service/registration?flow=${registration.id}`, { data: { method: 'password', password, traits: { email } } });
    expect(registered.ok()).toBe(true);
    const account = await registered.json();
    expect(account.identity.traits.email).toBe(email);
    const session = account.session_token as string;
    expect(session).toBeTruthy();
    const sessionHeaders = { 'X-Session-Token': session };
    expect((await page.request.get('http://127.0.0.1:18433/sessions/whoami', { headers: sessionHeaders })).ok()).toBe(true);
    const login = await (await page.request.get('http://127.0.0.1:18433/self-service/login/api')).json();
    const wrongPassword = await page.request.post(`http://127.0.0.1:18433/self-service/login?flow=${login.id}`, { data: { method: 'password', identifier: email, password: 'incorrect-password' } });
    expect(wrongPassword.ok()).toBe(false);
    const goodLogin = await page.request.post(`http://127.0.0.1:18433/self-service/login?flow=${login.id}`, { data: { method: 'password', identifier: email, password } });
    expect(goodLogin.ok()).toBe(true);
    console.info('Identity registration and login API verified');
    const discovery = await page.request.get('http://127.0.0.1:18444/.well-known/openid-configuration');
    expect(discovery.ok()).toBe(true);
    expect((await discovery.json()).issuer).toBe('http://127.0.0.1:18444/');
    const clientId = `zara-local-${Date.now()}`;
    const clientSecret = crypto.randomBytes(24).toString('base64url');
    const client = await page.request.post('http://127.0.0.1:18445/admin/clients', { data: { client_id: clientId, client_secret: clientSecret, grant_types: ['client_credentials'], response_types: ['token'], token_endpoint_auth_method: 'client_secret_basic', scope: 'local-test' } });
    expect(client.ok()).toBe(true);
    const token = await page.request.post('http://127.0.0.1:18444/oauth2/token', { headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}` }, form: { grant_type: 'client_credentials', scope: 'local-test' } });
    expect(token.ok()).toBe(true);
    const access = await token.json();
    const introspection = await page.request.post('http://127.0.0.1:18445/admin/oauth2/introspect', { form: { token: access.access_token } });
    expect((await introspection.json()).active).toBe(true);
    console.info('Hydra discovery, token and introspection verified');
    await page.goto('/runtime');
    await page.getByRole('button', { name: 'Select workload meucontrole-kratos', exact: true }).click();
    await page.getByLabel('Reason (optional)', { exact: true }).fill('Verify local identity persistence and sessions after restart');
    await page.getByRole('button', { name: 'Restart workload', exact: true }).click();
    await page.getByRole('link', { name: 'Open ChangeSet', exact: true }).click();
    await page.getByRole('button', { name: 'Apply / Retry execution', exact: true }).click();
    await applied();
    await run('kubectl', ['-n', 'meucontrole-dev', 'rollout', 'status', 'deployment/meucontrole-kratos', '--timeout=90s'], { env });
    // The old port-forward targets the old Pod; reconnect to the replacement.
    forwards[0].kill('SIGTERM');
    const replacement = spawn('kubectl', ['-n', 'meucontrole-dev', 'port-forward', 'service/meucontrole-kratos', '18433:4433', '18434:4434', '--address=127.0.0.1'], { env, stdio: 'ignore' });
    forwards.push(replacement);
    await expect.poll(async () => { try { return (await page.request.get('http://127.0.0.1:18433/sessions/whoami', { headers: sessionHeaders })).status(); } catch { return 0; } }, { timeout: 30_000 }).toBe(200);
    console.info('Identity session survived governed restart');
    const logout = await page.request.delete('http://127.0.0.1:18433/self-service/logout/api', { data: { session_token: session } });
    expect(logout.status()).toBe(204);
    expect((await page.request.get('http://127.0.0.1:18433/sessions/whoami', { headers: sessionHeaders })).status()).toBe(401);
    expect((await page.request.delete(`http://127.0.0.1:18434/admin/identities/${account.identity.id}`)).status()).toBe(204);
    expect((await page.request.delete(`http://127.0.0.1:18445/admin/clients/${clientId}`)).status()).toBe(204);
    if (withSso) {
      // Exercise the actual MeuControle SSO frontend with browser cookies and CSRF protection.
      const uiEmail = `zara-browser-${Date.now()}@local.invalid`;
      const uiPassword = `Za1!${crypto.randomBytes(24).toString('base64url')}`;
      await page.goto('http://127.0.0.1:18580/registration');
      await page.getByPlaceholder('Email', { exact: true }).fill(uiEmail);
      await page.getByPlaceholder('Nome', { exact: true }).fill('Zara Local');
      if (await page.getByPlaceholder('Telefone', { exact: true }).count()) await page.getByPlaceholder('Telefone', { exact: true }).fill('11999990000');
      if (await page.getByRole('button', { name: 'Continuar', exact: true }).count()) await page.getByRole('button', { name: 'Continuar', exact: true }).click();
      await page.getByPlaceholder('Senha', { exact: true }).fill(uiPassword);
      await page.getByPlaceholder('Confirmar senha', { exact: true }).fill(uiPassword);
      await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
      await page.waitForURL((url) => url.port === '18580' && url.pathname === '/settings', { timeout: 30_000 });
      await expect(page.getByRole('heading', { name: 'Definir nova senha', exact: true })).toBeVisible();
      const browserSession = await page.request.get('http://127.0.0.1:18433/sessions/whoami');
      expect(browserSession.ok()).toBe(true);
      const browserIdentity = (await browserSession.json()).identity;
      expect(browserIdentity.traits.email).toBe(uiEmail);
      expect((await page.request.delete(`http://127.0.0.1:18434/admin/identities/${browserIdentity.id}`)).status()).toBe(204);
    }

  } finally {
    for (const forward of forwards) forward.kill('SIGTERM');
  }
});
