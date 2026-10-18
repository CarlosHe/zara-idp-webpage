import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { Freeze, FreezeInput } from '@/shared/types';

function normalizeFreeze(raw: Freeze): Freeze {
  return { ...raw, expiresAt: raw.endTime ?? raw.expiresAt,
    scope: { global: raw.scope?.global ?? false, namespaces: raw.scope?.namespaces ?? [],
      teams: raw.scope?.teams ?? [], kinds: raw.scope?.kinds ?? [] },
    allowedOperations: raw.allowedOperations ?? [] };
}

export const freezesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listFreezes: build.query<Freeze[], void>({
      query: () => '/freezes',
      transformResponse: (raw: unknown) => unwrapItems<Freeze>(raw).map(normalizeFreeze),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Freeze' as const, id })),
              { type: 'Freeze' as const, id: 'LIST' },
            ]
          : [{ type: 'Freeze' as const, id: 'LIST' }],
    }),

    getFreeze: build.query<Freeze, string>({
      query: (id) => `/freezes/${id}`,
      transformResponse: normalizeFreeze,
      providesTags: (_result, _err, id) => [{ type: 'Freeze', id }],
    }),
    createFreeze: build.mutation<Freeze, FreezeInput>({
      extraOptions: { maxRetries: 0 },
      query: (body) => ({ url: '/freezes', method: 'POST', body }),
      invalidatesTags: [{ type: 'Freeze', id: 'LIST' }],
    }),
    updateFreeze: build.mutation<Freeze, { id: string; body: FreezeInput }>({
      extraOptions: { maxRetries: 0 },
      query: ({ id, body }) => ({ url: `/freezes/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Freeze', id }, { type: 'Freeze', id: 'LIST' }],
    }),
    deleteFreeze: build.mutation<void, string>({
      extraOptions: { maxRetries: 0 },
      query: (id) => ({ url: `/freezes/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Freeze', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const { useListFreezesQuery, useGetFreezeQuery, useCreateFreezeMutation,
  useUpdateFreezeMutation, useDeleteFreezeMutation } = freezesApi;
