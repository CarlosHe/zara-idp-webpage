import { baseApi } from '@/shared/lib/api';
import type {
  Notification,
  NotificationListResponse,
  NotificationPreferences,
} from '../types/notifications';

// Sprint-25 / L-2502..L-2504 — RTK Query slice for the notification
// inbox + preferences. The slice is registered against the shared
// `baseApi` so cache invalidation cooperates with the rest of the app
// (e.g. acknowledging a notification invalidates the home alert
// feed).

interface ListArgs {
  unread?: boolean;
  limit?: number;
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listNotifications: build.query<NotificationListResponse, ListArgs | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.unread) params.set('unread', 'true');
        if (args?.limit) params.set('limit', String(args.limit));
        const qs = params.toString();
        return qs ? `/notifications?${qs}` : '/notifications';
      },
      providesTags: (result) =>
        result
          ? [
              { type: 'Notification', id: 'LIST' },
              ...result.notifications.map(
                (n: Notification) =>
                  ({ type: 'Notification', id: n.id }) as const,
              ),
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),

    markNotificationRead: build.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id },
        { type: 'Home', id: 'SNAPSHOT' },
      ],
    }),

    getNotificationPreferences: build.query<NotificationPreferences, void>({
      query: () => '/notifications/preferences',
      providesTags: [{ type: 'NotificationPreferences', id: 'ME' }],
    }),

    saveNotificationPreferences: build.mutation<
      NotificationPreferences,
      NotificationPreferences
    >({
      query: (body) => ({
        url: '/notifications/preferences',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [
        { type: 'NotificationPreferences', id: 'ME' },
        { type: 'Notification', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useGetNotificationPreferencesQuery,
  useSaveNotificationPreferencesMutation,
} = notificationsApi;
