import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/shared/lib/api';

export interface Cluster {
  id: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
  };
  spec: {
    displayName: string;
    provider: string;
    region: string;
    environment: string;
    version?: string;
    endpoints?: {
      api?: string;
      argocd?: string;
      dashboard?: string;
    };
    labels?: Record<string, string>;
  };
  status: {
    health: string;
    nodeCount: number;
    resourceCount: number;
    cpu: {
      used: number;
      total: number;
    };
    memory: {
      used: number;
      total: number;
    };
    lastSyncAt: string;
  };
  createdAt: string;
  updatedAt: string;
  // Backward compatibility fields
  name?: string;
  namespace?: string;
  displayName?: string;
  provider?: string;
  environment?: string;
  region?: string;
  labels?: Record<string, string>;
}

interface ClustersState {
  items: Cluster[];
  selectedCluster: Cluster | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
}

const initialState: ClustersState = {
  items: [],
  selectedCluster: null,
  loading: false,
  error: null,
  saving: false,
  saveError: null,
};

export const fetchClusters = createAsyncThunk(
  'clusters/fetchAll',
  async (params: { provider?: string; environment?: string } | undefined, { rejectWithValue }) => {
    try {
      const clusters = await api.listClusters(params);
      return clusters as Cluster[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchCluster = createAsyncThunk(
  'clusters/fetchOne',
  async (name: string, { rejectWithValue }) => {
    try {
      const cluster = await api.getCluster(name);
      return cluster as Cluster;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createCluster = createAsyncThunk(
  'clusters/create',
  async (data: { 
    name: string; 
    namespace?: string; 
    displayName?: string; 
    provider: string; 
    environment: string; 
    region: string 
  }, { rejectWithValue }) => {
    try {
      const cluster = await api.createCluster(data);
      return cluster as Cluster;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateCluster = createAsyncThunk(
  'clusters/update',
  async ({ id, data }: { id: string; data: { displayName?: string; environment?: string } }, { rejectWithValue }) => {
    try {
      const cluster = await api.updateCluster(id, data);
      return cluster as Cluster;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteCluster = createAsyncThunk(
  'clusters/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.deleteCluster(id);
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const clustersSlice = createSlice({
  name: 'clusters',
  initialState,
  reducers: {
    clearSelectedCluster: (state) => {
      state.selectedCluster = null;
    },
    clearSaveError: (state) => {
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClusters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClusters.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchClusters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCluster.fulfilled, (state, action) => {
        state.selectedCluster = action.payload;
      })
      // Create
      .addCase(createCluster.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(createCluster.fulfilled, (state, action) => {
        state.saving = false;
        state.items.push(action.payload);
      })
      .addCase(createCluster.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload as string;
      })
      // Update
      .addCase(updateCluster.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(updateCluster.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.items.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateCluster.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload as string;
      })
      // Delete
      .addCase(deleteCluster.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(deleteCluster.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteCluster.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload as string;
      });
  },
});

export const { clearSelectedCluster, clearSaveError } = clustersSlice.actions;
export default clustersSlice.reducer;
