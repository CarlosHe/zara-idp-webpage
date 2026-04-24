import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/shared/lib/api';
import type { DashboardSummary, DashboardHealth, CorrelationResult, BlastRadius, ResourceKind } from '@/shared/types';

interface DashboardState {
  summary: DashboardSummary | null;
  health: DashboardHealth | null;
  correlation: CorrelationResult | null;
  blastRadius: BlastRadius | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  summary: null,
  health: null,
  correlation: null,
  blastRadius: null,
  loading: false,
  error: null,
};

export const fetchDashboardSummary = createAsyncThunk(
  'dashboard/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const summary = await api.getDashboardSummary();
      return summary;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchDashboardHealth = createAsyncThunk(
  'dashboard/fetchHealth',
  async (_, { rejectWithValue }) => {
    try {
      const health = await api.getDashboardHealth();
      return health;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchCorrelation = createAsyncThunk(
  'dashboard/fetchCorrelation',
  async ({ kind, namespace, name }: { kind: ResourceKind; namespace: string; name: string }, { rejectWithValue }) => {
    try {
      const correlation = await api.correlateResource(kind, namespace, name);
      return correlation;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchBlastRadius = createAsyncThunk(
  'dashboard/fetchBlastRadius',
  async ({ kind, namespace, name }: { kind: ResourceKind; namespace: string; name: string }, { rejectWithValue }) => {
    try {
      const blastRadius = await api.getBlastRadius(kind, namespace, name);
      return blastRadius;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearCorrelation: (state) => {
      state.correlation = null;
      state.blastRadius = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Summary
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Health
      .addCase(fetchDashboardHealth.fulfilled, (state, action) => {
        state.health = action.payload;
      })
      // Correlation
      .addCase(fetchCorrelation.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCorrelation.fulfilled, (state, action) => {
        state.loading = false;
        state.correlation = action.payload;
      })
      .addCase(fetchCorrelation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Blast Radius
      .addCase(fetchBlastRadius.fulfilled, (state, action) => {
        state.blastRadius = action.payload;
      });
  },
});

export const { clearCorrelation } = dashboardSlice.actions;
export default dashboardSlice.reducer;
