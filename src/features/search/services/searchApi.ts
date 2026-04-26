import { baseApi, unwrapItems } from '@/shared/lib/api';
import type {
  SavedSearch,
  SavedSearchInput,
  SearchClickInput,
  SearchQuery,
  SearchResponse,
} from '../types';

export const searchApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    search: build.mutation<SearchResponse, SearchQuery>({
      query: (body) => ({ url: '/search', method: 'POST', body }),
      invalidatesTags: [{ type: 'Search', id: 'LIST' }],
    }),
    listSavedSearches: build.query<SavedSearch[], void>({
      query: () => ({ url: '/search/saved' }),
      transformResponse: (raw: unknown) => unwrapItems<SavedSearch>(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'SavedSearch' as const, id })),
              { type: 'SavedSearch' as const, id: 'LIST' },
            ]
          : [{ type: 'SavedSearch' as const, id: 'LIST' }],
    }),
    createSavedSearch: build.mutation<SavedSearch, SavedSearchInput>({
      query: (body) => ({ url: '/search/saved', method: 'POST', body }),
      invalidatesTags: [{ type: 'SavedSearch', id: 'LIST' }],
    }),
    deleteSavedSearch: build.mutation<void, string>({
      query: (id) => ({ url: `/search/saved/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'SavedSearch', id },
        { type: 'SavedSearch', id: 'LIST' },
      ],
    }),
    recordSearchClick: build.mutation<void, SearchClickInput>({
      query: (body) => ({ url: '/search/click', method: 'POST', body }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useSearchMutation,
  useListSavedSearchesQuery,
  useCreateSavedSearchMutation,
  useDeleteSavedSearchMutation,
  useRecordSearchClickMutation,
} = searchApi;
