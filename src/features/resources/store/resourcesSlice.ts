import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ResourceKind } from '@/shared/types';

// Server state for resources lives in RTK Query (see
// `features/resources/services/resourcesApi.ts`). This slice owns only
// UI state: the filter set the user is driving on the list view.
export interface ResourcesFilters {
  kind: ResourceKind | null;
  namespace: string | null;
  healthStatus: string | null;
}

interface ResourcesState {
  filters: ResourcesFilters;
}

const initialState: ResourcesState = {
  filters: {
    kind: null,
    namespace: null,
    healthStatus: null,
  },
};

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
  },
});

export const { setKindFilter, setNamespaceFilter, setHealthFilter, clearFilters } =
  resourcesSlice.actions;

export default resourcesSlice.reducer;
