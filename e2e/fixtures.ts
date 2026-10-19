import { test as base, expect } from '@playwright/test';

// Browser contract tests stub their feature APIs. Keep the session endpoint
// deterministic too; never mistake a hanging authentication screen for a pass.
// Use E2E_LIVE_API=1 to let a configured environment authenticate real tokens.
export const test = base.extend<{ sessionContract: void }>({
  sessionContract: [async ({ context, page }, use) => {
    const errors: string[] = [];
    const unexpected = new Set<string>();
    page.on('pageerror', (error) => errors.push(error.message));
    if (process.env.E2E_LIVE_API !== '1') {
      // Contract tests must never accidentally reach a developer's live API.
      // Page-level feature routes take precedence over this context fallback.
      await context.route('**/api/**', async (route) => {
        unexpected.add(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
        await route.fulfill({ status: 400, json: { error: 'API route missing from browser contract fixture' } });
      });
      await context.route('**/api/v1/tenants', (route) => route.fulfill({ json: { items: [], count: 0 } }));
      await context.route('**/api/v1/me', async (route) => {
        const authenticated = !!route.request().headers().authorization;
        await route.fulfill({
          status: authenticated ? 200 : 401,
          contentType: 'application/json',
          body: JSON.stringify({
            authenticated, username: 'browser-test', subject: 'browser-test',
            email: 'browser-test@zara.local', roles: ['admin'], is_admin: true,
            namespaces: ['default', 'production', 'platform'], current_namespace: 'default',
          }),
        });
      });
    }
    await use();
    expect(errors, 'Unexpected browser runtime errors').toEqual([]);
    expect([...unexpected], 'API requests missing from contract fixtures').toEqual([]);
  }, { auto: true }],
});
export { expect };
