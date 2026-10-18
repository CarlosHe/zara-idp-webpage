import { test, expect } from '../fixtures';
import type { Freeze, FreezeInput } from '../../src/shared/types';

test('creates, edits and removes a deployment freeze', async ({ context, page }) => {
  await context.addInitScript(() => localStorage.setItem('zara.authToken', 'e2e-token'));
  let saved: Freeze | undefined;
  await page.route('**/api/v1/freezes**', async (route) => {
    const request = route.request();
    if (request.method() === 'DELETE') { saved = undefined; await route.fulfill({ status: 204 }); return; }
    if (request.method() === 'POST' || request.method() === 'PUT') {
      const input = request.postDataJSON() as FreezeInput;
      saved = { ...input, id: 'frz-lifecycle', version: (saved?.version ?? 0) + 1, active: true,
        allowedOperations: [], createdAt: new Date().toISOString(), createdBy: 'browser-test' };
      await route.fulfill({ json: saved, status: request.method() === 'POST' ? 201 : 200 }); return;
    }
    await route.fulfill({ json: new URL(request.url()).pathname.endsWith('/freezes') ? { items: saved ? [saved] : [] } : saved });
  });
  await page.goto('/freezes');
  await page.getByRole('button', { name: 'Create freeze' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill('release-freeze');
  await dialog.getByLabel('Reason', { exact: true }).fill('Release validation');
  await dialog.getByLabel('Namespaces', { exact: true }).fill('prod');
  await dialog.getByRole('button', { name: 'Create freeze', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('link', { name: 'release-freeze' }).click();
  await expect(page.getByRole('heading', { name: 'release-freeze' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit freeze' }).click();
  await dialog.getByLabel('Reason', { exact: true }).fill('Validation extended');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Validation extended', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Validation extended', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete freeze' }).click();
  await dialog.getByRole('button', { name: 'Delete freeze' }).click();
  await expect(page.getByText('No active freezes', { exact: true })).toBeVisible();
  expect(saved).toBeUndefined();
});

test('displays persisted freeze scope and deployment restrictions', async ({ context, page }) => {
  await context.addInitScript(() => localStorage.setItem('zara.authToken', 'e2e-token'));
  await page.route('**/api/v1/freezes*', (route) => route.fulfill({ json: { items: [{ id: 'frz-1', name: 'black-friday', reason: 'Peak sales', createdBy: 'sre@example.com', createdAt: new Date().toISOString(), expiresAt: '2099-01-01T00:00:00Z', scope: { namespaces: ['prod'], teams: [], kinds: [], global: false }, allowedOperations: [], active: true }], total: 1 } }));
  await page.goto('/freezes');
  await expect(page.getByText('black-friday')).toBeVisible();
  await expect(page.getByText(/Changes may be restricted/)).toBeVisible();
  await expect(page.getByText('1 namespace(s)', { exact: true }).first()).toBeVisible();
});
