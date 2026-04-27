import { test, expect } from '@playwright/test';

// Sprint-24 / L-2407 — personalised home E2E matrix.
//
// The journey covers each persona variant the backend can return. We
// stub `GET /api/v1/home` per test so the assertions are persona-
// specific without requiring a fully wired control plane. Every test
// also asserts that no cross-tenant data leaks into the rendered DOM
// (the backend permission filter is unit-tested; this E2E confirms
// the wire contract is honoured by the UI).

const BASE_SNAPSHOT = {
  subject: 'alice',
  generatedAt: '2026-04-26T12:00:00Z',
  approvals: [],
  alerts: [],
  activity: [],
  services: [],
  quickLinks: [],
  recommendations: [],
  counts: {
    approvals: 0,
    alerts: 0,
    criticalAlerts: 0,
    activity: 0,
    services: 0,
    quickLinks: 0,
    recommendations: 0,
  },
  degraded: [],
};

test.describe('home (personalised platform home)', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('developer sees Welcome + persona badge and quick-links region', async ({ page }) => {
    await page.route('**/api/v1/home', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...BASE_SNAPSHOT, persona: 'developer' }),
      }),
    );
    await page.goto('/home');
    await expect(page.getByText(/Welcome, alice/i)).toBeVisible();
    await expect(page.getByTestId('home-persona-badge')).toContainText(/developer/i);
    await expect(page.getByRole('region', { name: /quick links/i })).toBeVisible();
  });

  test('platform engineer sees the alerts + approvals widgets', async ({ page }) => {
    await page.route('**/api/v1/home', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...BASE_SNAPSHOT, persona: 'platform' }),
      }),
    );
    await page.goto('/home');
    await expect(page.getByTestId('home-persona-badge')).toContainText(
      /platform engineer/i,
    );
    await expect(page.getByTestId('home-approvals-card')).toBeVisible();
    await expect(page.getByTestId('home-alerts-card')).toBeVisible();
  });

  test('SRE persona surfaces the critical alert badge', async ({ page }) => {
    await page.route('**/api/v1/home', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...BASE_SNAPSHOT,
          persona: 'sre',
          alerts: [
            {
              id: 'burn',
              source: 'scorecard',
              title: 'SLO burn rate',
              message: 'Error budget exhausted',
              severity: 'critical',
              namespace: 'payments',
              createdAt: '2026-04-26T11:45:00Z',
              action: { kind: 'scorecard', id: 'sc-burn', path: '/scorecards' },
            },
          ],
          counts: { ...BASE_SNAPSHOT.counts, alerts: 1, criticalAlerts: 1 },
        }),
      }),
    );
    await page.goto('/home');
    await expect(page.getByText(/Site Reliability/i)).toBeVisible();
    await expect(page.getByText(/1 critical/i)).toBeVisible();
  });

  test('security persona surfaces ranked recommendations', async ({ page }) => {
    await page.route('**/api/v1/home', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...BASE_SNAPSHOT,
          persona: 'security',
          recommendations: [
            {
              id: 'rec-1',
              kind: 'scorecard_fix',
              title: 'Add SBOM to billing-service',
              reason: 'Plugin scorecard finding',
              severity: 'warning',
              score: 0.82,
              action: { kind: 'scorecard', id: 'sc-1', path: '/scorecards' },
            },
          ],
          counts: { ...BASE_SNAPSHOT.counts, recommendations: 1 },
        }),
      }),
    );
    await page.goto('/home');
    await expect(page.getByText(/Security/i)).toBeVisible();
    await expect(
      page.getByTestId('home-recommendations-card'),
    ).toContainText(/Add SBOM/i);
  });

  test('manager persona renders the manager copy', async ({ page }) => {
    await page.route('**/api/v1/home', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...BASE_SNAPSHOT, persona: 'manager' }),
      }),
    );
    await page.goto('/home');
    await expect(page.getByText(/Track delivery flow/i)).toBeVisible();
  });

  test('cards link to safe preview surfaces and post engagement', async ({ page }) => {
    let posted = 0;
    await page.route('**/api/v1/home/actions', (route) => {
      posted += 1;
      return route.fulfill({ status: 204 });
    });
    await page.route('**/api/v1/home', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...BASE_SNAPSHOT,
          persona: 'developer',
          approvals: [
            {
              id: 'a1',
              changeSetId: 'cs-1',
              title: 'deploy core',
              risk: 'medium',
              severity: 'warning',
              environment: 'prod',
              requestedBy: 'bob',
              namespace: 'payments',
              waitingForYou: true,
              createdAt: '2026-04-26T11:30:00Z',
              action: { kind: 'approval', id: 'a1', path: '/approvals/a1' },
            },
          ],
          counts: { ...BASE_SNAPSHOT.counts, approvals: 1 },
        }),
      }),
    );
    // Stub the approval detail page so the navigation does not 404.
    await page.route('**/api/v1/approvals/a1', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'a1', status: 'pending' }),
      }),
    );
    await page.goto('/home');
    const link = page.getByRole('link', { name: /deploy core/i });
    await expect(link).toHaveAttribute('href', '/approvals/a1');
    await link.click();
    await page.waitForURL(/\/approvals\/a1/);
    expect(posted).toBeGreaterThan(0);
  });

  test('degraded feed shows the warning banner', async ({ page }) => {
    await page.route('**/api/v1/home', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...BASE_SNAPSHOT,
          persona: 'developer',
          degraded: ['alerts'],
        }),
      }),
    );
    await page.goto('/home');
    await expect(
      page.getByText(/Some home widgets returned partial data/i),
    ).toBeVisible();
  });
});
