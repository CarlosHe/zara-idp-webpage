import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/shared/lib/api';
import type { Approval, ApprovalStatus } from '@/shared/types';

interface ApprovalsState {
  items: Approval[];
  selectedApproval: Approval | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  filter: ApprovalStatus | 'all';
}

const initialState: ApprovalsState = {
  items: [],
  selectedApproval: null,
  loading: false,
  submitting: false,
  error: null,
  filter: 'pending',
};

export const fetchApprovals = createAsyncThunk(
  'approvals/fetchAll',
  async (status: ApprovalStatus | 'all' = 'all', { rejectWithValue }) => {
    try {
      const params = status !== 'all' ? { status } : {};
      const response = await api.listApprovals(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchApproval = createAsyncThunk(
  'approvals/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const approval = await api.getApproval(id);
      return approval;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const approveRequest = createAsyncThunk(
  'approvals/approve',
  async ({ id, comment }: { id: string; comment?: string }, { rejectWithValue }) => {
    try {
      const approval = await api.approveRequest(id, comment);
      return approval;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const rejectRequest = createAsyncThunk(
  'approvals/reject',
  async ({ id, reason }: { id: string; reason: string }, { rejectWithValue }) => {
    try {
      const approval = await api.rejectRequest(id, reason);
      return approval;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const approvalsSlice = createSlice({
  name: 'approvals',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<ApprovalStatus | 'all'>) => {
      state.filter = action.payload;
    },
    clearSelectedApproval: (state) => {
      state.selectedApproval = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchApprovals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApprovals.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchApprovals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch one
      .addCase(fetchApproval.fulfilled, (state, action) => {
        state.selectedApproval = action.payload;
      })
      // Approve
      .addCase(approveRequest.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(approveRequest.fulfilled, (state, action) => {
        state.submitting = false;
        state.selectedApproval = action.payload;
        // Update item in list
        const index = state.items.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(approveRequest.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      })
      // Reject
      .addCase(rejectRequest.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(rejectRequest.fulfilled, (state, action) => {
        state.submitting = false;
        state.selectedApproval = action.payload;
        const index = state.items.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(rejectRequest.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilter, clearSelectedApproval, clearError } = approvalsSlice.actions;
export default approvalsSlice.reducer;
