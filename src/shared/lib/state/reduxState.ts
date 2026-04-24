// ReduxState<T> is the canonical wrapper for non-server UI state that
// still benefits from a loading/error lifecycle (optimistic edits,
// multi-step wizards). Server state goes through RTK Query; this is
// specifically for things RTK Query can't express — e.g. the current
// filter set on a table, a draft form, a selection carried across
// routes.
//
// The `old` field is there so reducers can roll back after a failed
// mutation without the page having to keep a shadow copy.

export type ReduxStateStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ReduxState<T> {
  data: T;
  old: T | null;
  error: string;
  status: ReduxStateStatus;
}

export function initialReduxState<T>(data: T): ReduxState<T> {
  return { data, old: null, error: '', status: 'idle' };
}

export function beginMutation<T>(state: ReduxState<T>, next: T): ReduxState<T> {
  return { data: next, old: state.data, error: '', status: 'loading' };
}

export function succeedMutation<T>(state: ReduxState<T>, next?: T): ReduxState<T> {
  return {
    data: next ?? state.data,
    old: null,
    error: '',
    status: 'succeeded',
  };
}

export function failMutation<T>(state: ReduxState<T>, error: string): ReduxState<T> {
  return {
    data: state.old ?? state.data,
    old: null,
    error,
    status: 'failed',
  };
}
