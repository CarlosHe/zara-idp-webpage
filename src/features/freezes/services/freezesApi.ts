import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { Freeze } from '@/shared/types';

export const freezesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listFreezes: build.query<Freeze[], void>({
      query: () => '/freezes',
      transformResponse: (raw: unknown) => unwrapItems<Freeze>(raw),
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
      providesTags: (_result, _err, id) => [{ type: 'Freeze', id }],
    }),
  }),
  overrideExisting: false,
});

export const { useListFreezesQuery, useGetFreezeQuery } = freezesApi;
