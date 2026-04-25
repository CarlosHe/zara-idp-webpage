import { baseApi } from '@/shared/lib/api';
import type { SearchQuery, SearchResponse } from '../types';

export const searchApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    search: build.mutation<SearchResponse, SearchQuery>({
      query: (body) => ({ url: '/search', method: 'POST', body }),
      invalidatesTags: [{ type: 'Search', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const { useSearchMutation } = searchApi;
