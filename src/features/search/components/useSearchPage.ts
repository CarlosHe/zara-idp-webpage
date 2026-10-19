import { useCallback, useState } from 'react';
import {
  useCreateSavedSearchMutation,
  useDeleteSavedSearchMutation,
  useListSavedSearchesQuery,
  useRecordSearchClickMutation,
  useSearchMutation,
} from '../services/searchApi';
import type { SavedSearch, SearchScope } from '../types';

export const ALL_SCOPES: SearchScope[] = ['catalog', 'docs', 'audit'];

export interface AdvancedFiltersState {
  kind: string;
  namespace: string;
  owner: string;
  lifecycle: string;
}

export const EMPTY_FILTERS: AdvancedFiltersState = {
  kind: '',
  namespace: '',
  owner: '',
  lifecycle: '',
};

export function buildFilters(state: AdvancedFiltersState): Record<string, string> {
  return Object.fromEntries(
    Object.entries(state)
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(([, value]) => value !== ''),
  );
}

export function useSearchPage() {
  const [text, setText] = useState('');
  const [scopes, setScopes] = useState<SearchScope[]>(['catalog', 'docs']);
  const [advanced, setAdvanced] = useState<AdvancedFiltersState>(EMPTY_FILTERS);
  const [name, setName] = useState('');
  const [runSearch, searchState] = useSearchMutation();
  const savedQuery = useListSavedSearchesQuery();
  const [createSaved, createSavedState] = useCreateSavedSearchMutation();
  const [deleteSaved, deleteSavedState] = useDeleteSavedSearchMutation();
  const [recordClick] = useRecordSearchClickMutation();

  const submit = useCallback(() => {
    const filters = buildFilters(advanced);
    void runSearch({ text, scopes, filters, limit: 25 });
  }, [advanced, runSearch, scopes, text]);

  const toggleScope = useCallback((scope: SearchScope) => {
    setScopes((current) =>
      current.includes(scope)
        ? current.filter((candidate) => candidate !== scope)
        : [...current, scope],
    );
  }, []);

  const updateAdvanced = useCallback((partial: Partial<AdvancedFiltersState>) => {
    setAdvanced((current) => ({ ...current, ...partial }));
  }, []);

  const saveCurrent = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try { await createSaved({
      name: trimmed,
      text,
      scopes,
      filters: buildFilters(advanced),
    }).unwrap();
    setName('');
    } catch { /* Preserve the draft; the page displays the mutation error. */ }
  }, [advanced, createSaved, name, scopes, text]);

  const applySaved = useCallback((saved: SavedSearch) => {
    setText(saved.text);
    setScopes(saved.scopes);
    setAdvanced({
      kind: saved.filters.kind ?? '',
      namespace: saved.filters.namespace ?? '',
      owner: saved.filters.owner ?? '',
      lifecycle: saved.filters.lifecycle ?? '',
    });
  }, []);

  const removeSaved = useCallback(
    (id: string) => {
      void deleteSaved(id);
    },
    [deleteSaved],
  );

  const trackClick = useCallback(
    (scope: SearchScope, rank: number) => {
      void recordClick({ scope, queryText: text, rank });
    },
    [recordClick, text],
  );

  return {
    state: { text, scopes, advanced, name },
    setText,
    setName,
    toggleScope,
    updateAdvanced,
    submit,
    saveCurrent,
    applySaved,
    removeSaved,
    trackClick,
    searchState,
    savedQuery,
    savedError: createSavedState.error || deleteSavedState.error || savedQuery.error,
  };
}
