import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/shared/lib/api';
import type { AuditEntry } from '@/shared/types';

interface AuditState {
  auditLogs: AuditEntry[];
  selectedAuditEntry: AuditEntry | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuditState = {
  auditLogs: [],
  selectedAuditEntry: null,
  loading: false,
  error: null,
};

export const fetchAuditLogs = createAsyncThunk(
  'audit/fetchLogs',
  async (params: { resourceKind?: string; actor?: string; startTime?: string; endTime?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await api.listAuditLogs(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchAuditEntry = createAsyncThunk(
  'audit/fetchEntry',
  async (id: string, { rejectWithValue }) => {
    try {
      const entry = await api.getAuditEntry(id);
      return entry;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    clearSelectedAuditEntry: (state) => {
      state.selectedAuditEntry = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.auditLogs = action.payload;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAuditEntry.fulfilled, (state, action) => {
        state.selectedAuditEntry = action.payload;
      });
  },
});

export const { clearSelectedAuditEntry } = auditSlice.actions;
export default auditSlice.reducer;
