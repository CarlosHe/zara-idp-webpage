import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/shared/lib/api';
import type { Namespace } from '@/shared/types';

interface NamespacesState {
  items: Namespace[];
  selectedNamespace: Namespace | null;
  loading: boolean;
  error: string | null;
}

const initialState: NamespacesState = {
  items: [],
  selectedNamespace: null,
  loading: false,
  error: null,
};

export const fetchNamespaces = createAsyncThunk(
  'namespaces/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const namespaces = await api.listNamespaces();
      return namespaces;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchNamespace = createAsyncThunk(
  'namespaces/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const namespace = await api.getNamespace(id);
      return namespace;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createNamespace = createAsyncThunk(
  'namespaces/create',
  async (namespace: Omit<Namespace, 'createdAt' | 'updatedAt' | 'status'>, { rejectWithValue }) => {
    try {
      const created = await api.createNamespace(namespace);
      return created;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateNamespace = createAsyncThunk(
  'namespaces/update',
  async ({ id, data }: { id: string; data: Partial<Namespace> }, { rejectWithValue }) => {
    try {
      const updated = await api.updateNamespace(id, data);
      return updated;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteNamespace = createAsyncThunk(
  'namespaces/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.deleteNamespace(id);
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const namespacesSlice = createSlice({
  name: 'namespaces',
  initialState,
  reducers: {
    clearSelectedNamespace: (state) => {
      state.selectedNamespace = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNamespaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNamespaces.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNamespaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchNamespace.fulfilled, (state, action) => {
        state.selectedNamespace = action.payload;
      })
      .addCase(createNamespace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNamespace.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createNamespace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateNamespace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNamespace.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedNamespace?.id === action.payload.id) {
          state.selectedNamespace = action.payload;
        }
      })
      .addCase(updateNamespace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteNamespace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNamespace.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        if (state.selectedNamespace?.id === action.payload) {
          state.selectedNamespace = null;
        }
      })
      .addCase(deleteNamespace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedNamespace } = namespacesSlice.actions;
export default namespacesSlice.reducer;
