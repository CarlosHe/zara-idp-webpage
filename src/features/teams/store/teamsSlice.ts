import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/shared/lib/api';
import type { Team, OnCallInfo } from '@/shared/types';

interface TeamsState {
  items: Team[];
  selectedTeam: Team | null;
  onCall: OnCallInfo | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
}

const initialState: TeamsState = {
  items: [],
  selectedTeam: null,
  onCall: null,
  loading: false,
  error: null,
  saving: false,
  saveError: null,
};

export const fetchTeams = createAsyncThunk(
  'teams/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const teams = await api.listTeams();
      return teams;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchTeam = createAsyncThunk(
  'teams/fetchOne',
  async (name: string, { rejectWithValue }) => {
    try {
      const team = await api.getTeam(name);
      return team;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchTeamOnCall = createAsyncThunk(
  'teams/fetchOnCall',
  async (name: string, { rejectWithValue }) => {
    try {
      const onCall = await api.getTeamOnCall(name);
      return onCall;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createTeam = createAsyncThunk(
  'teams/create',
  async (data: { name: string; namespace?: string; displayName?: string; slackChannel?: string }, { rejectWithValue }) => {
    try {
      const team = await api.createTeam(data);
      return team;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateTeam = createAsyncThunk(
  'teams/update',
  async ({ id, data }: { id: string; data: { displayName?: string; slackChannel?: string } }, { rejectWithValue }) => {
    try {
      const team = await api.updateTeam(id, data);
      return team;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteTeam = createAsyncThunk(
  'teams/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.deleteTeam(id);
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    clearSelectedTeam: (state) => {
      state.selectedTeam = null;
      state.onCall = null;
    },
    clearSaveError: (state) => {
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTeam.fulfilled, (state, action) => {
        state.selectedTeam = action.payload;
      })
      .addCase(fetchTeamOnCall.fulfilled, (state, action) => {
        state.onCall = action.payload as unknown as OnCallInfo;
      })
      // Create
      .addCase(createTeam.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.saving = false;
        state.items.push(action.payload);
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload as string;
      })
      // Update
      .addCase(updateTeam.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(updateTeam.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.items.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTeam.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload as string;
      })
      // Delete
      .addCase(deleteTeam.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteTeam.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload as string;
      });
  },
});

export const { clearSelectedTeam, clearSaveError } = teamsSlice.actions;
export default teamsSlice.reducer;
