import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/app/store';
import {
  selectResolvedTheme,
  selectThemeMode,
  setTheme,
  syncSystemPreference,
  themeStorageKey,
  toggleTheme,
  type ThemeMode,
} from '../store/themeSlice';

export function useTheme() {
  const dispatch = useDispatch<AppDispatch>();
  const mode = useSelector(selectThemeMode);
  const resolved = useSelector(selectResolvedTheme);

  const setMode = useCallback(
    (next: ThemeMode) => dispatch(setTheme(next)),
    [dispatch],
  );
  const toggle = useCallback(() => dispatch(toggleTheme()), [dispatch]);

  return { mode, resolved, setMode, toggle };
}

// Side effects: (1) flip the <html> class to match the resolved theme,
// (2) persist the mode choice to localStorage, (3) listen for OS-level
// preference changes while mode === 'system'. Mount once near the root.
export function useThemeEffect() {
  const dispatch = useDispatch<AppDispatch>();
  const mode = useSelector(selectThemeMode);
  const resolved = useSelector(selectResolvedTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.dataset.theme = resolved;
  }, [resolved]);

  useEffect(() => {
    try {
      window.localStorage.setItem(themeStorageKey, mode);
    } catch {
      // localStorage unavailable — silently ignore.
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => dispatch(syncSystemPreference());
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [mode, dispatch]);
}
