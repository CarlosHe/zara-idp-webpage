import { useCallback, useState } from 'react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import {
  useGetApprovalQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
} from '@/features/approvals/services/approvalsApi';
import type { Approval } from '@/shared/types';

type RtkError = FetchBaseQueryError | SerializedError | undefined;

interface UseApprovalDetailResult {
  approval: Approval | undefined;
  loading: boolean;
  loadError: RtkError;
  approveError: RtkError;
  rejectError: RtkError;
  submitting: boolean;
  showRejectForm: boolean;
  rejectReason: string;
  setShowRejectForm: (open: boolean) => void;
  setRejectReason: (value: string) => void;
  approve: () => Promise<void>;
  reject: () => Promise<void>;
}

export function useApprovalDetail(id: string | undefined): UseApprovalDetailResult {
  const {
    data: approval,
    isLoading: loading,
    error: loadError,
  } = useGetApprovalQuery(id ?? '', { skip: !id });
  const [approveRequest, approveState] = useApproveRequestMutation();
  const [rejectRequest, rejectState] = useRejectRequestMutation();
  const submitting = approveState.isLoading || rejectState.isLoading;
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const approve = useCallback(async () => {
    if (id) {
      await approveRequest({ id })
        .unwrap()
        .catch(() => undefined);
    }
  }, [approveRequest, id]);

  const reject = useCallback(async () => {
    if (id && rejectReason.trim()) {
      await rejectRequest({ id, reason: rejectReason })
        .unwrap()
        .catch(() => undefined);
      setShowRejectForm(false);
      setRejectReason('');
    }
  }, [id, rejectReason, rejectRequest]);

  return {
    approval,
    loading,
    loadError,
    approveError: approveState.error,
    rejectError: rejectState.error,
    submitting,
    showRejectForm,
    rejectReason,
    setShowRejectForm,
    setRejectReason,
    approve,
    reject,
  };
}
