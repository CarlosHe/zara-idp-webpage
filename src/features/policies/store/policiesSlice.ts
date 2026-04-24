import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/shared/lib/api';
import type { RuntimePolicy } from '@/shared/types';

interface PoliciesState {
  items: RuntimePolicy[];
  loading: boolean;
  error: string | null;
}

const initialState: PoliciesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchRuntimePolicies = createAsyncThunk(
  'policies/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const policies = await api.listRuntimePolicies();
      return policies;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const policiesSlice = createSlice({
  name: 'policies',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRuntimePolicies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRuntimePolicies.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchRuntimePolicies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default policiesSlice.reducer;
