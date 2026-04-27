import { baseApi } from '@/shared/lib/api';
import type {
  Incident,
  IncidentEventKind,
  IncidentListResponse,
  IncidentState,
} from '../types/incidents';

// Sprint-25 / L-2505..L-2507 — RTK Query slice for the incident console.
// The slice is registered against the shared `baseApi` so cache
// invalidation cooperates with the rest of the app.

interface ListArgs {
  state?: IncidentState | '';
  limit?: number;
}

interface AppendTimelineArgs {
  id: string;
  kind: IncidentEventKind;
  title?: string;
  message?: string;
  references?: Record<string, string>;
}

export const incidentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listIncidents: build.query<IncidentListResponse, ListArgs | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.state) params.set('state', args.state);
        if (args?.limit) params.set('limit', String(args.limit));
        const qs = params.toString();
        return qs ? `/incidents?${qs}` : '/incidents';
      },
      providesTags: (result) =>
        result
          ? [
              { type: 'Incident', id: 'LIST' },
              ...result.incidents.map(
                (i: Incident) => ({ type: 'Incident', id: i.id }) as const,
              ),
            ]
          : [{ type: 'Incident', id: 'LIST' }],
    }),

    getIncident: build.query<Incident, string>({
      query: (id) => `/incidents/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Incident', id }],
    }),

    acknowledgeIncident: build.mutation<Incident, string>({
      query: (id) => ({ url: `/incidents/${id}/acknowledge`, method: 'POST' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Incident', id: 'LIST' },
        { type: 'Incident', id },
      ],
    }),

    mitigateIncident: build.mutation<
      Incident,
      { id: string; summary?: string }
    >({
      query: ({ id, summary }) => ({
        url: `/incidents/${id}/mitigate`,
        method: 'POST',
        body: { summary },
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Incident', id: 'LIST' },
        { type: 'Incident', id },
      ],
    }),

    resolveIncident: build.mutation<
      Incident,
      { id: string; summary?: string }
    >({
      query: ({ id, summary }) => ({
        url: `/incidents/${id}/resolve`,
        method: 'POST',
        body: { summary },
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Incident', id: 'LIST' },
        { type: 'Incident', id },
      ],
    }),

    appendIncidentTimeline: build.mutation<Incident, AppendTimelineArgs>({
      query: ({ id, ...body }) => ({
        url: `/incidents/${id}/timeline`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Incident', id: 'LIST' },
        { type: 'Incident', id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListIncidentsQuery,
  useGetIncidentQuery,
  useAcknowledgeIncidentMutation,
  useMitigateIncidentMutation,
  useResolveIncidentMutation,
  useAppendIncidentTimelineMutation,
} = incidentsApi;
