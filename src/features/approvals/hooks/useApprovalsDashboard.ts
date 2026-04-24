import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { setFilter } from '@/features/approvals/store/approvalsSlice';
import { useListApprovalsQuery } from '@/features/approvals/services/approvalsApi';
import type { Approval, ApprovalStatus } from '@/shared/types';

export type ApprovalFilter = ApprovalStatus | 'all';

interface UseApprovalsDashboardResult {
  filter: ApprovalFilter;
  items: Approval[];
  filteredItems: Approval[];
  pendingCount: number;
  loading: boolean;
  error: unknown;
  refetch: () => void;
  setFilter: (filter: ApprovalFilter) => void;
}

export function useApprovalsDashboard(): UseApprovalsDashboardResult {
  const dispatch = useAppDispatch();
  const filter = useAppSelector((state) => state.approvals.filter);
  const {
    data: items = [],
    isLoading: loading,
    error,
    refetch,
  } = useListApprovalsQuery({ status: filter });

  // Defensive: when the filter is 'all' we trust the server; otherwise
  // re-filter on the client to guard against stale cache entries.
  const filteredItems = useMemo(
    () => (filter === 'all' ? items : items.filter((a) => a.status === filter)),
    [filter, items],
  );

  const pendingCount = useMemo(
    () => items.filter((a) => a.status === 'pending').length,
    [items],
  );

  const setFilterValue = useCallback(
    (next: ApprovalFilter) => {
      dispatch(setFilter(next));
    },
    [dispatch],
  );

  return {
    filter,
    items,
    filteredItems,
    pendingCount,
    loading,
    error,
    refetch,
    setFilter: setFilterValue,
  };
}
