import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ApprovalStatus } from '@/shared/types';

// Server state for approvals is owned by
// `features/approvals/services/approvalsApi.ts`. This slice keeps only
// the status filter selected on the list view. Adding it to the global
// store (instead of useState) lets the approval detail route preserve
// the caller's filter when navigating back.
interface ApprovalsState {
  filter: ApprovalStatus | 'all';
}

const initialState: ApprovalsState = {
  filter: 'pending',
};

const approvalsSlice = createSlice({
  name: 'approvals',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<ApprovalStatus | 'all'>) => {
      state.filter = action.payload;
    },
  },
});

export const { setFilter } = approvalsSlice.actions;

export default approvalsSlice.reducer;
