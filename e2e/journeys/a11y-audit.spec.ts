import { test, expect } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';

// Sprint-33 / L-3304 — axe-core wiring inside Playwright.
//
// Sprint-32 shipped an in-tree jsdom a11y auditor (lighter than axe,
// good enough for landmark + heading + role checks under jsdom). This
// spec adds the browser-grade complement: full axe-core rules running
// in a real Chromium DOM via `@axe-core/playwright`.
//
// Acceptance: zero `critical` or `serious` violations on every major
// route. Lower-severity violations (`moderate`, `minor`) are surfaced
// in the run output but do not fail the spec — they're deferred to a
// follow-up incremental cleanup loop.
//
// CI emergency exit: set `SKIP_A11Y=1` to short-circuit the spec.
//
// Run locally: `npm run test:e2e -- a11y-audit`
//
// The spec stubs:
//   - `GET /api/v1/me`            → an admin principal (so guarded
//                                    routes render their shell).
//   - `GET /api/v1/**`            → empty JSON `{}` so query-driven
//                                    pages render the "no data" empty
//                                    state rather than the "loading"
//                                    skeleton (skeletons hide most
//                                    landmark structure).

const PRINCIPAL = {
  username: 'a11y-bot',
  email: 'a11y@zara.local',
  name: 'Accessibility Bot',
  subject: 'a11y-bot',
  roles: ['admin', 'developer', 'sre'],
  is_admin: true,
  namespaces: ['production', 'staging'],
  current_namespace: 'production',
  authenticated: true,
};

// Routes covered by the audit. The first column is the route path; the
// second column is a heading regex used to confirm the page actually
// rendered (otherwise an axe pass against a still-loading skeleton is
// meaningless).
const ROUTES: ReadonlyArray<readonly [string, RegExp]> = [
  ['/login', /entrar|sign in|login|access token/i],
  ['/home', /home|welcome|dashboard/i],
  ['/catalog', /catalog/i],
  ['/plugins', /plugin/i],
  ['/golden-paths', /golden path/i],
  ['/runtime', /runtime|cluster/i],
  ['/scorecards', /scorecard/i],
  ['/incidents', /incident/i],
  ['/cost', /cost|finops|spend/i],
  ['/environments', /environment/i],
  ['/analytics', /analytic/i],
  ['/tenants', /tenant/i],
  ['/assistant', /assistant|ai/i],
  ['/remediation', /remediation/i],
  ['/notifications', /notification/i],
  ['/access', /access/i],
  ['/settings', /settings/i],
];

const skip = process.env.SKIP_A11Y === '1';

test.describe('a11y audit (axe-core, all major routes)', () => {
  test.skip(skip, 'SKIP_A11Y=1 set — axe audit deliberately skipped');

  test.beforeEach(async ({ context, page }) => {
    // Seed the auth token so the ProtectedRoute guard does not bounce
    // every navigation to /login.
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'a11y-token');
      window.localStorage.setItem('zara.tenant', 'acme');
    });

    // Principal stub.
    await page.route('**/api/v1/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PRINCIPAL),
      });
    });

    // Catch-all stub for every other API call so query-backed widgets
    // render an empty-state shell instead of a skeleton. Empty array
    // covers list endpoints; empty object covers detail endpoints.
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      // /me already handled above
      if (/\/api\/v1\/me(\?|$)/.test(url)) {
        return route.fallback();
      }
      const path = new URL(url).pathname;
      let payload: unknown = { items: [], total: 0 };
      if (path === '/api/v1/rbac/roles') payload = { roles: [] };
      if (path === '/api/v1/rbac/bindings' || path === '/api/v1/rbac/cluster-bindings') payload = { bindings: [] };
      if (path === '/api/v1/incidents') payload = { incidents: [] };
      if (path === '/api/v1/notifications') payload = { notifications: [], unreadCount: 0 };
      if (path === '/api/v1/home') payload = {
        persona: 'developer', subject: 'a11y-bot', generatedAt: new Date().toISOString(),
        approvals: [], alerts: [], activity: [], services: [], quickLinks: [], recommendations: [], degraded: [],
        counts: { approvals: 0, alerts: 0, criticalAlerts: 0, activity: 0, services: 0, quickLinks: 0, recommendations: 0 },
      };
      if (path === '/api/v1/governance/kpis') payload = { scorecards: { active: 0, draft: 0, archived: 0 }, waivers: { active: 0, expired: 0 } };
      if (path === '/api/v1/environments') payload = { environments: [], inventory: { totalEnvironments: 0, byState: {}, byKind: {}, bySource: {}, staleCount: 0, expiringSoonCount: 0, projectedDailySpendMinorUnits: 0 } };
      if (path === '/api/v1/tenants') payload = { items: [{ id: 'acme', displayName: 'Acme', lifecycle: 'active', owner: 'a11y@zara.local', admins: [] }] };
      if (path === '/api/v1/cost/dashboard') payload = {
        window: { since: '2026-10-01T00:00:00Z', until: '2026-10-18T00:00:00Z' }, currency: 'USD', totalSpend: { value: 0, minorUnits: 0, currency: 'USD' }, allocationsCount: 0,
        showback: [], chargeback: [], topServices: [], idleResources: [], budgets: [], anomalies: [], findings: [], costImpacts: [],
      };
      const body = JSON.stringify(payload);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body,
      });
    });
  });

  for (const [path, headingRegex] of ROUTES) {
    test(`route ${path} has zero critical/serious axe violations`, async ({ page }) => {
      if (path === '/login') {
        await page.route('**/api/v1/me', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }));
      }
      await page.goto(path);

      await expect(page.getByRole('heading', { name: headingRegex }).first()).toBeVisible({ timeout: 30_000 });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const criticalOrSerious = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );

      if (criticalOrSerious.length > 0) {
        // Pretty-print so failures are diagnosable in CI.
        const summary = criticalOrSerious
          .map(
            (v) =>
              `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'})`,
          )
          .join('\n');
        console.error(`axe violations on ${path}:\n${summary}`);
      }

      expect(criticalOrSerious, `axe critical/serious violations on ${path}`).toEqual([]);
    });
  }
});
