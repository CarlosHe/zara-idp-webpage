import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { TechDoc, TechDocSummary } from '../types';

export const docsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listTechDocs: build.query<TechDocSummary[], void>({
      query: () => '/docs',
      transformResponse: (raw: unknown) => unwrapItems<TechDocSummary>(raw),
      providesTags: [{ type: 'TechDocs', id: 'LIST' }],
    }),
    getTechDoc: build.query<TechDoc, string>({
      query: (slug) => `/docs/${slug}`,
      providesTags: (_result, _err, slug) => [{ type: 'TechDocs', id: slug }],
    }),
  }),
  overrideExisting: false,
});

export const { useListTechDocsQuery, useGetTechDocQuery } = docsApi;
