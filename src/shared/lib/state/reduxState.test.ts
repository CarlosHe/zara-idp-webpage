import { describe, expect, it } from 'vitest';
import {
  beginMutation,
  failMutation,
  initialReduxState,
  succeedMutation,
} from './reduxState';

describe('ReduxState helpers', () => {
  it('initialReduxState seeds an idle wrapper around the starting data', () => {
    const s = initialReduxState<number[]>([]);
    expect(s).toEqual({ data: [], old: null, error: '', status: 'idle' });
  });

  it('beginMutation snapshots the previous data and swaps in the next one', () => {
    const s = beginMutation(initialReduxState([1, 2]), [1, 2, 3]);
    expect(s.data).toEqual([1, 2, 3]);
    expect(s.old).toEqual([1, 2]);
    expect(s.status).toBe('loading');
    expect(s.error).toBe('');
  });

  it('succeedMutation clears the rollback snapshot and marks succeeded', () => {
    const s = succeedMutation(
      { data: [1, 2, 3], old: [1, 2], error: '', status: 'loading' },
    );
    expect(s.data).toEqual([1, 2, 3]);
    expect(s.old).toBeNull();
    expect(s.status).toBe('succeeded');
  });

  it('succeedMutation can also replace data with the server-canonical value', () => {
    const s = succeedMutation(
      { data: [1, 2, 3], old: [1, 2], error: '', status: 'loading' },
      [99],
    );
    expect(s.data).toEqual([99]);
  });

  it('failMutation rolls back to .old and captures the error message', () => {
    const s = failMutation(
      { data: [1, 2, 3], old: [1, 2], error: '', status: 'loading' },
      'server exploded',
    );
    expect(s.data).toEqual([1, 2]);
    expect(s.old).toBeNull();
    expect(s.error).toBe('server exploded');
    expect(s.status).toBe('failed');
  });
});
