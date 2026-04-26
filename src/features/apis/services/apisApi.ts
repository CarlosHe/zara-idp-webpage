import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { APIDiffResult, APIEntry, APISummary } from '../types';

export const apisApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAPIEntries: build.query<APISummary[], { namespace?: string } | void>({
      query: (arg) => {
        const namespace = arg?.namespace;
        return namespace ? `/apis?namespace=${encodeURIComponent(namespace)}` : '/apis';
      },
      transformResponse: (raw: unknown) => unwrapItems<APISummary>(raw),
      providesTags: [{ type: 'APIEntry', id: 'LIST' }],
    }),
    getAPIEntry: build.query<APIEntry, { namespace: string; name: string }>({
      query: ({ namespace, name }) => `/apis/${namespace}/${name}`,
      providesTags: (_r, _e, { namespace, name }) => [{ type: 'APIEntry', id: `${namespace}/${name}` }],
    }),
    diffAPIEntry: build.mutation<
      APIDiffResult,
      {
        namespace: string;
        name: string;
        semver: string;
        specDigest: string;
        specYAML?: string;
        previousSpecYAML?: string;
      }
    >({
      query: ({ namespace, name, ...body }) => ({
        url: `/apis/${namespace}/${name}/diff`,
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListAPIEntriesQuery,
  useGetAPIEntryQuery,
  useDiffAPIEntryMutation,
} = apisApi;
