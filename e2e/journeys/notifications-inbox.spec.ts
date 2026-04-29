import { test, expect } from '@playwright/test';

// Sprint-32 / L-3203 — notification center journey.

test.describe('notifications journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('zara.authToken', 'e2e-token');
    });
  });

  test('notifications page renders inbox + unread badge', async ({ page }) => {
    await page.route('**/api/v1/notifications*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          notifications: [
            {
              id: 'n-1',
              recipient: { subject: 'alice' },
              source: 'approval',
              severity: 'critical',
              title: 'Approval pending: deploy v42',
              channels: ['in_app'],
              deliveries: [],
              action: { kind: 'changeset', id: 'cs-42', path: '/approvals/cs-42' },
              occurredAt: '2026-04-28T12:00:00Z',
              createdAt: '2026-04-28T12:00:00Z',
            },
          ],
          unread: 1,
        }),
      }),
    );
    await page.goto('/notifications');
    await expect(page.getByText(/Approval pending: deploy v42/).first()).toBeVisible();
    await expect(page.getByTestId('notifications-unread-badge')).toContainText('1');
  });
});
