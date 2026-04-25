// Sprint-16 / L-1613 — plugin registry endpoint slice. Replaces the
// hardcoded `demoSlots` constant inside `PluginsPage` so the UI is fed
// by the real `/api/v1/plugins` endpoint (introduced server-side in
// Sprint 23 per the post-GA plan). When the endpoint is empty or
// unavailable the page renders the canonical empty state instead of a
// fake demo carousel.

import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { PluginSlot } from '../types/plugins';

export const pluginsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listPluginSlots: build.query<PluginSlot[], void>({
      query: () => ({ url: '/plugins' }),
      transformResponse: (raw: unknown) => unwrapItems<PluginSlot>(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.map((slot) => ({ type: 'Plugin' as const, id: slot.id })),
              { type: 'Plugin' as const, id: 'LIST' },
            ]
          : [{ type: 'Plugin' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const { useListPluginSlotsQuery } = pluginsApi;
