import { useMemo } from 'react';
import { useListRuntimePoliciesQuery } from '@/features/policies/services/policiesApi';
import { errorMessage } from '@/shared/lib/api';
import type { RuntimePolicy } from '@/shared/types';

export interface PoliciesDashboardState {
  enabledPolicies: RuntimePolicy[];
  disabledPolicies: RuntimePolicy[];
  loading: boolean;
  error: unknown;
  errorText: string | null;
  refetch: () => void;
}

export function usePoliciesDashboard(): PoliciesDashboardState {
  const { data: runtimePolicies, isLoading: loading, error, refetch } =
    useListRuntimePoliciesQuery();

  const { enabledPolicies, disabledPolicies } = useMemo(() => {
    const safe = Array.isArray(runtimePolicies) ? runtimePolicies : [];
    return {
      enabledPolicies: safe.filter((p) => p.enabled),
      disabledPolicies: safe.filter((p) => !p.enabled),
    };
  }, [runtimePolicies]);

  const errorText = error ? errorMessage(error) || 'Failed to load runtime policies' : null;

  return {
    enabledPolicies,
    disabledPolicies,
    loading,
    error,
    errorText,
    refetch,
  };
}
