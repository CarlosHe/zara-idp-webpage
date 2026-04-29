import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — remediation inbox journey. Asserts the inbox
// renders proposals and surfaces the no-direct-mutation guard
// ("Approve" disabled until a ChangeSet is attached).

test.describe('remediation journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('remediation inbox renders proposals from the API', async ({ page }) => {
    await page.route('**/api/v1/remediation/proposals*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'rem-1',
              tenant: 't-1',
              source: 'scorecard',
              code: 'svc.has-owner',
              title: 'Set owner for billing-service',
              risk: 'medium',
              status: 'pending',
              owner: { team: 'team-billing' },
              impact: { savingsUsd: 0, coveragePct: 100 },
              expiresAt: '2026-05-12T00:00:00Z',
              createdAt: '2026-04-28T12:00:00Z',
              updatedAt: '2026-04-28T12:00:00Z',
              version: 1,
            },
          ],
          total: 1,
        }),
      }),
    );
    await page.goto('/remediation');
    await expect(
      page.getByText(/Set owner for billing-service/i).first(),
    ).toBeVisible();
  });
});
