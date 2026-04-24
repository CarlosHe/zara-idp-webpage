import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { AuditEntry, PaginationParams } from '@/shared/types';

export interface AuditFilters {
  resourceKind?: string;
  resourceNamespace?: string;
  resourceName?: string;
  actor?: string;
  startTime?: string;
  endTime?: string;
}

export const auditApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAuditLogs: build.query<AuditEntry[], (AuditFilters & PaginationParams) | void>({
      query: (params) => ({ url: '/audit', params: params ?? {} }),
      transformResponse: (raw: unknown) => unwrapItems<AuditEntry>(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Audit' as const, id })),
              { type: 'Audit' as const, id: 'LIST' },
            ]
          : [{ type: 'Audit' as const, id: 'LIST' }],
    }),

    getAuditEntry: build.query<AuditEntry, string>({
      query: (id) => `/audit/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Audit', id }],
    }),
  }),
  overrideExisting: false,
});

export const { useListAuditLogsQuery, useGetAuditEntryQuery } = auditApi;
