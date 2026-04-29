# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys/a11y-audit.spec.ts >> a11y audit (axe-core, all major routes) >> route /plugins has zero critical/serious axe violations
- Location: e2e/journeys/a11y-audit.spec.ts:108:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4173/plugins
Call log:
  - navigating to "http://localhost:4173/plugins", waiting until "load"

```

# Test source

```ts
  9   | // in a real Chromium DOM via `@axe-core/playwright`.
  10  | //
  11  | // Acceptance: zero `critical` or `serious` violations on every major
  12  | // route. Lower-severity violations (`moderate`, `minor`) are surfaced
  13  | // in the run output but do not fail the spec — they're deferred to a
  14  | // follow-up incremental cleanup loop.
  15  | //
  16  | // CI emergency exit: set `SKIP_A11Y=1` to short-circuit the spec.
  17  | //
  18  | // Run locally: `npm run test:e2e -- a11y-audit`
  19  | //
  20  | // The spec stubs:
  21  | //   - `GET /api/v1/me`            → an admin principal (so guarded
  22  | //                                    routes render their shell).
  23  | //   - `GET /api/v1/**`            → empty JSON `{}` so query-driven
  24  | //                                    pages render the "no data" empty
  25  | //                                    state rather than the "loading"
  26  | //                                    skeleton (skeletons hide most
  27  | //                                    landmark structure).
  28  | 
  29  | const PRINCIPAL = {
  30  |   username: 'a11y-bot',
  31  |   email: 'a11y@zara.local',
  32  |   name: 'Accessibility Bot',
  33  |   subject: 'a11y-bot',
  34  |   roles: ['admin', 'developer', 'sre'],
  35  |   is_admin: true,
  36  |   namespaces: ['production', 'staging'],
  37  |   current_namespace: 'production',
  38  |   authenticated: true,
  39  | };
  40  | 
  41  | // Routes covered by the audit. The first column is the route path; the
  42  | // second column is a heading regex used to confirm the page actually
  43  | // rendered (otherwise an axe pass against a still-loading skeleton is
  44  | // meaningless).
  45  | const ROUTES: ReadonlyArray<readonly [string, RegExp]> = [
  46  |   ['/login', /sign in|login|access token/i],
  47  |   ['/home', /home|welcome|dashboard/i],
  48  |   ['/catalog', /catalog/i],
  49  |   ['/plugins', /plugin/i],
  50  |   ['/golden-paths', /golden path/i],
  51  |   ['/runtime', /runtime|cluster/i],
  52  |   ['/scorecards', /scorecard/i],
  53  |   ['/incidents', /incident/i],
  54  |   ['/cost', /cost|finops|spend/i],
  55  |   ['/environments', /environment/i],
  56  |   ['/analytics', /analytic/i],
  57  |   ['/tenants', /tenant/i],
  58  |   ['/assistant', /assistant|ai/i],
  59  |   ['/remediation', /remediation/i],
  60  |   ['/notifications', /notification/i],
  61  | ];
  62  | 
  63  | const skip = process.env.SKIP_A11Y === '1';
  64  | 
  65  | test.describe('a11y audit (axe-core, all major routes)', () => {
  66  |   test.skip(skip, 'SKIP_A11Y=1 set — axe audit deliberately skipped');
  67  | 
  68  |   test.beforeEach(async ({ context, page }) => {
  69  |     // Seed the auth token so the ProtectedRoute guard does not bounce
  70  |     // every navigation to /login.
  71  |     await context.addInitScript(() => {
  72  |       window.localStorage.setItem('zara.authToken', 'a11y-token');
  73  |     });
  74  | 
  75  |     // Principal stub.
  76  |     await page.route('**/api/v1/me', async (route) => {
  77  |       await route.fulfill({
  78  |         status: 200,
  79  |         contentType: 'application/json',
  80  |         body: JSON.stringify(PRINCIPAL),
  81  |       });
  82  |     });
  83  | 
  84  |     // Catch-all stub for every other API call so query-backed widgets
  85  |     // render an empty-state shell instead of a skeleton. Empty array
  86  |     // covers list endpoints; empty object covers detail endpoints.
  87  |     await page.route('**/api/v1/**', async (route) => {
  88  |       const url = route.request().url();
  89  |       // /me already handled above
  90  |       if (/\/api\/v1\/me(\?|$)/.test(url)) {
  91  |         return;
  92  |       }
  93  |       const body =
  94  |         /(list|search|history|approvals|notifications|incidents|tenants|environments|alerts|recommendations)/i.test(
  95  |           url,
  96  |         )
  97  |           ? '[]'
  98  |           : '{}';
  99  |       await route.fulfill({
  100 |         status: 200,
  101 |         contentType: 'application/json',
  102 |         body,
  103 |       });
  104 |     });
  105 |   });
  106 | 
  107 |   for (const [path, headingRegex] of ROUTES) {
  108 |     test(`route ${path} has zero critical/serious axe violations`, async ({ page }) => {
> 109 |       await page.goto(path);
      |                  ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4173/plugins
  110 | 
  111 |       // Wait for either the heading we expect, or any landmark — both
  112 |       // tell us the shell is rendered. axe needs *some* DOM.
  113 |       await Promise.race([
  114 |         page.getByRole('heading', { name: headingRegex }).first().waitFor({ timeout: 15_000 }),
  115 |         page.locator('main, [role="main"]').first().waitFor({ timeout: 15_000 }),
  116 |       ]).catch(() => {
  117 |         // If neither rendered we still run axe: a totally empty body
  118 |         // will at minimum surface document-title / html-has-lang
  119 |         // findings, which we want to know about.
  120 |       });
  121 | 
  122 |       const results = await new AxeBuilder({ page })
  123 |         .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
  124 |         .analyze();
  125 | 
  126 |       const criticalOrSerious = results.violations.filter(
  127 |         (v) => v.impact === 'critical' || v.impact === 'serious',
  128 |       );
  129 | 
  130 |       if (criticalOrSerious.length > 0) {
  131 |         // Pretty-print so failures are diagnosable in CI.
  132 |         const summary = criticalOrSerious
  133 |           .map(
  134 |             (v) =>
  135 |               `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'})`,
  136 |           )
  137 |           .join('\n');
  138 |         // eslint-disable-next-line no-console
  139 |         console.error(`axe violations on ${path}:\n${summary}`);
  140 |       }
  141 | 
  142 |       expect(criticalOrSerious, `axe critical/serious violations on ${path}`).toEqual([]);
  143 |     });
  144 |   }
  145 | });
  146 | 
```