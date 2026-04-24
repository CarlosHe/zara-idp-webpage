import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  resolved: ResolvedTheme;
}

const STORAGE_KEY = 'zara-idp.theme';

function readSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    // localStorage unavailable (private mode, storage quota, etc.) — fall through.
  }
  return 'dark';
}

function resolve(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? readSystemPreference() : mode;
}

const initialMode = readStoredMode();
const initialState: ThemeState = {
  mode: initialMode,
  resolved: resolve(initialMode),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      state.resolved = resolve(action.payload);
    },
    toggleTheme: (state) => {
      const next: ThemeMode = state.resolved === 'dark' ? 'light' : 'dark';
      state.mode = next;
      state.resolved = next;
    },
    // Fired when the OS-level `prefers-color-scheme` flips while mode is 'system'.
    syncSystemPreference: (state) => {
      if (state.mode === 'system') {
        state.resolved = readSystemPreference();
      }
    },
  },
});

export const { setTheme, toggleTheme, syncSystemPreference } = themeSlice.actions;
export const themeStorageKey = STORAGE_KEY;

export const selectThemeMode = (state: RootState) => state.theme.mode;
export const selectResolvedTheme = (state: RootState) => state.theme.resolved;

export default themeSlice.reducer;
