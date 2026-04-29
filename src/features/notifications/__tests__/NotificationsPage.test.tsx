// Sprint-32 / L-3202 — feature coverage for the notification center.
// Verifies the page (1) renders the unread badge from the API, (2)
// exposes the unread-only toggle and refetches with the right query
// param, and (3) calls the mark-read mutation when the user clicks
// the row's mark-as-read control.
import { describe, expect, it } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { NotificationsPage } from '../components/NotificationsPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';
import type { Notification } from '../types/notifications';

const baseNotif: Notification = {
  id: 'n-1',
  recipient: { subject: 'alice' },
  source: 'approval',
  severity: 'critical',
  title: 'Approval pending: deploy v42',
  body: 'You are listed as required approver',
  channels: ['in_app'],
  deliveries: [
    {
      channel: 'in_app',
      state: 'sent',
      attempts: 1,
      updatedAt: '2026-04-28T12:00:00Z',
    },
  ],
  action: { kind: 'changeset', id: 'cs-42', path: '/approvals/cs-42' },
  occurredAt: '2026-04-28T12:00:00Z',
  createdAt: '2026-04-28T12:00:00Z',
};

describe('<NotificationsPage />', () => {
  it('renders the inbox with the unread badge from the API', async () => {
    server.use(
      http.get('*/api/v1/notifications', () =>
        HttpResponse.json({ notifications: [baseNotif], unread: 1 }),
      ),
    );

    renderWithProviders(<NotificationsPage />);

    await screen.findByText(/Approval pending: deploy v42/);
    const badge = screen.getByTestId('notifications-unread-badge');
    expect(badge).toHaveTextContent('1 unread');
  });

  it('refetches with `unread=true` when the unread-only toggle flips', async () => {
    let lastQuery = '';
    server.use(
      http.get('*/api/v1/notifications', ({ request }) => {
        lastQuery = new URL(request.url).search;
        const isUnread = lastQuery.includes('unread=true');
        return HttpResponse.json({
          notifications: [baseNotif],
          unread: isUnread ? 1 : 0,
        });
      }),
    );

    renderWithProviders(<NotificationsPage />);

    await screen.findByText(/Approval pending: deploy v42/);
    expect(lastQuery).not.toContain('unread=true');

    fireEvent.click(screen.getByTestId('notifications-unread-toggle'));

    await waitFor(() => expect(lastQuery).toContain('unread=true'));
  });

  it('POSTs to the mark-read endpoint when the user marks a row read', async () => {
    let markCalled = '';
    server.use(
      http.get('*/api/v1/notifications', () =>
        HttpResponse.json({ notifications: [baseNotif], unread: 1 }),
      ),
      http.post('*/api/v1/notifications/:id/read', ({ params }) => {
        markCalled = params.id as string;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<NotificationsPage />);

    await screen.findByText(/Approval pending: deploy v42/);
    const markBtn = screen.getByRole('button', { name: /mark.*read/i });
    fireEvent.click(markBtn);

    await waitFor(() => expect(markCalled).toBe('n-1'));
  });
});
