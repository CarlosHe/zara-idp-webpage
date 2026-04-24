import { useCallback } from 'react';
import {
  useGetDashboardSummaryQuery,
  useGetDashboardHealthQuery,
} from '@/features/dashboard/services/dashboardApi';
import { useListAuditLogsQuery } from '@/features/audit/services/auditApi';
import type {
  AuditEntry,
  DashboardHealth,
  DashboardSummary,
} from '@/shared/types';

interface UseDashboardResult {
  summary: DashboardSummary | undefined;
  health: DashboardHealth | undefined;
  auditLogs: AuditEntry[] | undefined;
  loading: boolean;
  error: unknown;
  refresh: () => void;
}

export function useDashboard(): UseDashboardResult {
  const summaryQuery = useGetDashboardSummaryQuery();
  const healthQuery = useGetDashboardHealthQuery();
  const auditQuery = useListAuditLogsQuery();

  const refresh = useCallback(() => {
    summaryQuery.refetch();
    healthQuery.refetch();
  }, [summaryQuery, healthQuery]);

  return {
    summary: summaryQuery.data,
    health: healthQuery.data,
    auditLogs: auditQuery.data,
    loading: summaryQuery.isLoading || healthQuery.isLoading,
    error: summaryQuery.error || healthQuery.error,
    refresh,
  };
}
