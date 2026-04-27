import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, CheckCircle2, Settings } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import {
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
} from '../services/notificationsApi';
import type { Notification } from '../types/notifications';
import { SEVERITY_DOT, SEVERITY_LABEL, SEVERITY_TONE } from './NotificationUtils';
import { PreferencesPanel } from './PreferencesPanel';

// Sprint-25 / L-2504 — the notification center. Two surfaces in one
// page: the inbox (left) and the preferences editor (right). The
// inbox is the source of truth for the home alert feed, so marking a
// notification as read invalidates the home snapshot too.
export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const { data, isFetching, error, refetch } = useListNotificationsQuery({
    unread: unreadOnly,
    limit: 50,
  });
  const [markRead] = useMarkNotificationReadMutation();

  const notifications = data?.notifications ?? [];
  const unread = data?.unread ?? 0;

  if (isFetching && !data) {
    return <LoadingState message="Loading notifications..." />;
  }

  if (error && !data) {
    return (
      <ErrorState
        message={errorMessage(error) || 'Failed to load notifications'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div
      className="space-y-6 animate-fade-in"
      aria-label="Notification center"
      data-testid="notifications-page"
    >
      <PageHeader
        icon={<BellRing className="h-6 w-6" />}
        iconClassName="text-amber-400"
        title="Notifications"
        description="Approvals, alerts, drift, scorecard burns, and plugin health, scoped to you."
        onRefresh={refetch}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" data-testid="notifications-unread-badge">
              {unread} unread
            </Badge>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setUnreadOnly((v) => !v)}
              aria-pressed={unreadOnly}
              data-testid="notifications-unread-toggle"
            >
              {unreadOnly ? 'Show all' : 'Unread only'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPrefs((v) => !v)}
              aria-pressed={showPrefs}
              data-testid="notifications-preferences-toggle"
            >
              <Settings className="h-4 w-4" aria-hidden /> Preferences
            </Button>
          </div>
        }
      />

      <div
        className={`grid gap-6 ${
          showPrefs ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
        }`}
      >
        <InboxList
          items={notifications}
          onMarkRead={(id) => {
            void markRead(id);
          }}
        />
        {showPrefs ? <PreferencesPanel /> : null}
      </div>
    </div>
  );
}

interface InboxListProps {
  items: Notification[];
  onMarkRead: (id: string) => void;
}

function InboxList({ items, onMarkRead }: InboxListProps) {
  if (items.length === 0) {
    return (
      <Card role="region" aria-label="Inbox" data-testid="notifications-inbox">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" aria-hidden /> Inbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">No notifications yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card role="region" aria-label="Inbox" data-testid="notifications-inbox">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" aria-hidden /> Inbox
          <Badge variant="outline">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id} data-testid={`notification-${n.id}`}>
              <article
                className={`rounded-md border ${
                  n.readAt
                    ? 'border-slate-700/40 bg-slate-800/30'
                    : 'border-amber-500/40 bg-slate-800/60'
                } px-3 py-2`}
              >
                <header className="flex items-start gap-3">
                  <span
                    className={`mt-1 inline-block h-2 w-2 rounded-full ${SEVERITY_DOT[n.severity]}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={n.action.path || '#'}
                        className="truncate text-sm font-medium text-slate-100 hover:text-white"
                      >
                        {n.title}
                      </Link>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${SEVERITY_TONE[n.severity]}`}
                        aria-label={`Severity ${SEVERITY_LABEL[n.severity]}`}
                      >
                        {SEVERITY_LABEL[n.severity]}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                      {n.body || n.source}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                      <time dateTime={n.occurredAt}>{n.occurredAt}</time>
                      {n.namespace ? <span>· {n.namespace}</span> : null}
                      <span className="ml-auto flex items-center gap-1">
                        {n.channels.map((c) => (
                          <Badge key={c} variant="outline">
                            {c}
                          </Badge>
                        ))}
                      </span>
                    </div>
                  </div>
                </header>
                {!n.readAt ? (
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onMarkRead(n.id)}
                      data-testid={`mark-read-${n.id}`}
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden /> Mark read
                    </Button>
                  </div>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
