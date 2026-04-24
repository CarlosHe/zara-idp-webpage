import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/shared/lib/api';
import type { Resource, ResourceKind, ResourceEvent, ResourceDependency } from '@/shared/types';

interface ResourcesState {
  items: Resource[];
  selectedResource: Resource | null;
  resourceEvents: ResourceEvent[];
  resourceDependencies: ResourceDependency[];
  loading: boolean;
  error: string | null;
  filters: {
    kind: ResourceKind | null;
    namespace: string | null;
    healthStatus: string | null;
  };
}

const initialState: ResourcesState = {
  items: [],
  selectedResource: null,
  resourceEvents: [],
  resourceDependencies: [],
  loading: false,
  error: null,
  filters: {
    kind: null,
    namespace: null,
    healthStatus: null,
  },
};

// Async thunks
export const fetchResources = createAsyncThunk(
  'resources/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { resources: ResourcesState };
      const { kind } = state.resources.filters;
      
      if (kind) {
        const resources = await api.listResourcesByKind(kind);
        return resources;
      }
      
      const resources = await api.listResources();
      return resources;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchResource = createAsyncThunk(
  'resources/fetchOne',
  async ({ kind, namespace, name }: { kind: ResourceKind; namespace: string; name: string }, { rejectWithValue }) => {
    try {
      const resource = await api.getResource(kind, namespace, name);
      return resource;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchResourceEvents = createAsyncThunk(
  'resources/fetchEvents',
  async ({ kind, namespace, name }: { kind: ResourceKind; namespace: string; name: string }, { rejectWithValue }) => {
    try {
      const events = await api.getResourceEvents(kind, namespace, name);
      return events;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchResourceDependencies = createAsyncThunk(
  'resources/fetchDependencies',
  async ({ kind, namespace, name }: { kind: ResourceKind; namespace: string; name: string }, { rejectWithValue }) => {
    try {
      const deps = await api.getResourceDependencies(kind, namespace, name);
      return deps;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createResource = createAsyncThunk(
  'resources/create',
  async (
    data: {
      kind: string;
      name: string;
      namespace: string;
      spec?: Record<string, any>;
      metadata?: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const resource = await api.createResource(data);
      return resource;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateResource = createAsyncThunk(
  'resources/update',
  async (
    {
      kind,
      namespace,
      name,
      data,
    }: {
      kind: ResourceKind;
      namespace: string;
      name: string;
      data: {
        spec?: Record<string, any>;
        metadata?: {
          labels?: Record<string, string>;
          annotations?: Record<string, string>;
        };
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const resource = await api.updateResource(kind, namespace, name, data);
      return resource;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteResource = createAsyncThunk(
  'resources/delete',
  async (
    { id }: { id: string },
    { rejectWithValue }
  ) => {
    try {
      await api.deleteResource(id);
      return { id };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    setKindFilter: (state, action: PayloadAction<ResourceKind | null>) => {
      state.filters.kind = action.payload;
    },
    setNamespaceFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.namespace = action.payload;
    },
    setHealthFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.healthStatus = action.payload;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedResource: (state) => {
      state.selectedResource = null;
      state.resourceEvents = [];
      state.resourceDependencies = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all resources
      .addCase(fetchResources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch single resource
      .addCase(fetchResource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResource.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedResource = action.payload;
      })
      .addCase(fetchResource.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch resource events
      .addCase(fetchResourceEvents.fulfilled, (state, action) => {
        state.resourceEvents = action.payload;
      })
      // Fetch resource dependencies
      .addCase(fetchResourceDependencies.fulfilled, (state, action) => {
        state.resourceDependencies = action.payload;
      })
      // Create resource
      .addCase(createResource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createResource.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createResource.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update resource
      .addCase(updateResource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateResource.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedResource?.id === action.payload.id) {
          state.selectedResource = action.payload;
        }
      })
      .addCase(updateResource.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete resource
      .addCase(deleteResource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteResource.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((r) => r.id !== action.payload.id);
        if (state.selectedResource && state.selectedResource.id === action.payload.id) {
          state.selectedResource = null;
        }
      })
      .addCase(deleteResource.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setKindFilter,
  setNamespaceFilter,
  setHealthFilter,
  clearFilters,
  clearSelectedResource,
} = resourcesSlice.actions;

export default resourcesSlice.reducer;
