import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/shared/lib/api';
import type { Freeze } from '@/shared/types';

interface FreezesState {
  items: Freeze[];
  selected: Freeze | null;
  loading: boolean;
  error: string | null;
}

const initialState: FreezesState = {
  items: [],
  selected: null,
  loading: false,
  error: null,
};

export const fetchFreezes = createAsyncThunk(
  'freezes/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const freezes = await api.listFreezes();
      return freezes;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchFreeze = createAsyncThunk(
  'freezes/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const freeze = await api.getFreeze(id);
      return freeze;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const freezesSlice = createSlice({
  name: 'freezes',
  initialState,
  reducers: {
    clearSelectedFreeze: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFreezes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFreezes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFreezes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchFreeze.fulfilled, (state, action) => {
        state.selected = action.payload;
      });
  },
});

export const { clearSelectedFreeze } = freezesSlice.actions;
export default freezesSlice.reducer;
