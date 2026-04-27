import { baseApi } from '@/shared/lib/api';
import type { HomeActionEvent, HomeSnapshot } from '../types/home';

// Sprint-24 / L-2403..L-2406 — RTK Query slice for the personalised
// home page. The backend endpoint is `/api/v1/home`; engagement
// signals (action card clicks) are sent to `/api/v1/home/actions` so
// the home dashboard can show "time-to-action" / "stale widget"
// panels.
//
// The slice is registered against the shared `baseApi` so its cache
// invalidation cooperates with the rest of the app (e.g. approving a
// ChangeSet from the approvals feature can invalidate Home).

export const homeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getHomeSnapshot: build.query<HomeSnapshot, void>({
      query: () => '/home',
      providesTags: [{ type: 'Home', id: 'SNAPSHOT' }],
    }),

    recordHomeAction: build.mutation<void, HomeActionEvent>({
      query: (body) => ({
        url: '/home/actions',
        method: 'POST',
        body,
      }),
      // The action mutation does not invalidate the snapshot — it's a
      // pure engagement signal so we skip cache churn.
    }),
  }),
  overrideExisting: false,
});

export const { useGetHomeSnapshotQuery, useRecordHomeActionMutation } = homeApi;
