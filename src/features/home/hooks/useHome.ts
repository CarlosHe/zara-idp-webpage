// Sprint-24 / L-2403..L-2405 — UI hook for the personalised home
// page. The hook flattens the RTK Query state, pre-derives a couple
// of cheap projections the page header uses, and exposes a single
// `recordAction` callback every card calls when a user clicks a
// safe-handoff button.

import { useCallback } from 'react';
import {
  useGetHomeSnapshotQuery,
  useRecordHomeActionMutation,
} from '../services/homeApi';
import type { HomeSnapshot } from '../types/home';

interface UseHomeResult {
  snapshot: HomeSnapshot | undefined;
  loading: boolean;
  error: unknown;
  refresh: () => void;
  isDegraded: boolean;
  degraded: string[];
  recordAction: (widget: string, kind: string, id?: string) => void;
}

export function useHome(): UseHomeResult {
  const { data, isLoading, error, refetch } = useGetHomeSnapshotQuery();
  const [recordAction] = useRecordHomeActionMutation();

  const onRecordAction = useCallback(
    (widget: string, kind: string, id?: string) => {
      // Best-effort: the engagement signal is non-blocking. We
      // intentionally swallow the promise so a transient failure
      // never disrupts the user's navigation.
      void recordAction({ widget, kind, id });
    },
    [recordAction],
  );

  return {
    snapshot: data,
    loading: isLoading,
    error,
    refresh: refetch,
    isDegraded: !!data?.degraded?.length,
    degraded: data?.degraded ?? [],
    recordAction: onRecordAction,
  };
}
