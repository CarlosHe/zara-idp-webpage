import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
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

// Memoized filter selector so consumers read a stable reference across
// renders that don't touch `state.resources.filters`. Returning the
// inner state directly (without createSelector) would be fine today
// because RTK produces immutable slices — but derived selectors start
// relying on reference equality the moment we compose them.
const selectResourcesState = (state: RootState) => state.resources;

export const selectResourcesFilters = createSelector(
  [selectResourcesState],
  (resources) => resources.filters,
);

export const selectHasActiveResourceFilters = createSelector(
  [selectResourcesFilters],
  (filters) => Boolean(filters.kind || filters.namespace || filters.healthStatus),
);

export default resourcesSlice.reducer;
