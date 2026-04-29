import { test, expect } from '@playwright/test';
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
  ['/login', /sign in|login|access token/i],
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
];

const skip = process.env.SKIP_A11Y === '1';

test.describe('a11y audit (axe-core, all major routes)', () => {
  test.skip(skip, 'SKIP_A11Y=1 set — axe audit deliberately skipped');

  test.beforeEach(async ({ context, page }) => {
    // Seed the auth token so the ProtectedRoute guard does not bounce
    // every navigation to /login.
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'a11y-token');
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
        return;
      }
      const body =
        /(list|search|history|approvals|notifications|incidents|tenants|environments|alerts|recommendations)/i.test(
          url,
        )
          ? '[]'
          : '{}';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body,
      });
    });
  });

  for (const [path, headingRegex] of ROUTES) {
    test(`route ${path} has zero critical/serious axe violations`, async ({ page }) => {
      await page.goto(path);

      // Wait for either the heading we expect, or any landmark — both
      // tell us the shell is rendered. axe needs *some* DOM.
      await Promise.race([
        page.getByRole('heading', { name: headingRegex }).first().waitFor({ timeout: 15_000 }),
        page.locator('main, [role="main"]').first().waitFor({ timeout: 15_000 }),
      ]).catch(() => {
        // If neither rendered we still run axe: a totally empty body
        // will at minimum surface document-title / html-has-lang
        // findings, which we want to know about.
      });

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
