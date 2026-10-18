import { test, expect } from '../fixtures';

// Sprint-32 / L-3203 — plugin marketplace journey.

test.describe('plugins journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('plugins page renders registry items returned by the API', async ({ page }) => {
    await page.route('**/api/v1/plugins*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'plg-1',
              name: 'github-source',
              version: '1.4.0',
              lifecycle: 'installed',
              health: { state: 'healthy', consecutiveFailures: 0 }, displayName: 'github-source', status: 'installed', runtime: 'wasm', resources: { cpuMilli: 100, memoryMiB: 64 }, permissions: {}, signing: { digest: 'sha256:test', signatureRef: 'sig', sbomRef: 'sbom' }, installedBy: 'platform', installedAt: '2026-10-18T00:00:00Z', updatedAt: '2026-10-18T00:00:00Z',
              signed: true,
              sbom: 'cyclonedx-1.5',
            },
          ],
          total: 1,
        }),
      }),
    );
    await page.goto('/plugins');
    await expect(page.getByText(/github-source/i).first()).toBeVisible();
  });
});
