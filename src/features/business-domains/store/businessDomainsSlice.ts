import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/shared/lib/api';

export interface BusinessDomain {
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
    description: string;
    ownership: {
      team: string;
      techLead?: string;
      productOwner?: string;
      costCenter?: string;
    };
    boundaries: {
      namespaces: string[];
      resourceKinds?: string[];
    };
    sla?: {
      tier: string;
      availability?: string;
      rto?: string;
      rpo?: string;
    };
    compliance?: {
      frameworks?: string[];
      dataClassification?: string;
    };
    dependencies?: Array<{
      domain: string;
      type?: string;
      direction?: string;
    }>;
    tags?: string[];
  };
  status: {
    resourceCount: number;
    teamCount: number;
    healthSummary: {
      healthy: number;
      degraded: number;
      unhealthy: number;
    };
    lastUpdated: string;
  };
  createdAt: string;
  updatedAt: string;
  // Backward compatibility fields
  name?: string;
  namespace?: string;
  displayName?: string;
  description?: string;
  team?: string;
  labels?: Record<string, string>;
}

interface DomainsState {
  items: BusinessDomain[];
  selectedDomain: BusinessDomain | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
}

const initialState: DomainsState = {
  items: [],
  selectedDomain: null,
  loading: false,
  error: null,
  saving: false,
  saveError: null,
};

export const fetchDomains = createAsyncThunk(
  'domains/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const domains = await api.listBusinessDomains();
      return domains as BusinessDomain[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchDomain = createAsyncThunk(
  'domains/fetchOne',
  async (name: string, { rejectWithValue }) => {
    try {
      const domain = await api.getBusinessDomain(name);
      return domain as BusinessDomain;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createDomain = createAsyncThunk(
  'domains/create',
  async (data: { 
    name: string; 
    namespace?: string; 
    displayName?: string; 
    description?: string; 
    team: string 
  }, { rejectWithValue }) => {
    try {
      const domain = await api.createBusinessDomain(data);
      return domain as BusinessDomain;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateDomain = createAsyncThunk(
  'domains/update',
  async ({ id, data }: { id: string; data: { displayName?: string; description?: string; team?: string } }, { rejectWithValue }) => {
    try {
      const domain = await api.updateBusinessDomain(id, data);
      return domain as BusinessDomain;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteDomain = createAsyncThunk(
  'domains/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.deleteBusinessDomain(id);
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const domainsSlice = createSlice({
  name: 'domains',
  initialState,
  reducers: {
    clearSelectedDomain: (state) => {
      state.selectedDomain = null;
    },
    clearSaveError: (state) => {
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDomains.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDomains.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDomains.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDomain.fulfilled, (state, action) => {
        state.selectedDomain = action.payload;
      })
      // Create
      .addCase(createDomain.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(createDomain.fulfilled, (state, action) => {
        state.saving = false;
        state.items.push(action.payload);
      })
      .addCase(createDomain.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload as string;
      })
      // Update
      .addCase(updateDomain.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(updateDomain.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.items.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateDomain.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload as string;
      })
      // Delete
      .addCase(deleteDomain.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(deleteDomain.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.filter((d) => d.id !== action.payload);
      })
      .addCase(deleteDomain.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload as string;
      });
  },
});

export const { clearSelectedDomain, clearSaveError } = domainsSlice.actions;
export default domainsSlice.reducer;
