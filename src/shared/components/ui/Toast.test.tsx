import { describe, expect, it } from 'vitest';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster, toastStore, useToast, useToasts } from './Toast';

describe('toastStore', () => {
  it('push returns a stable id and appends the toast', () => {
    const id = toastStore.push({ kind: 'info', message: 'hi', title: 'title' });
    expect(typeof id).toBe('string');
    expect(toastStore.getSnapshot()).toHaveLength(1);
    expect(toastStore.getSnapshot()[0]).toMatchObject({ id, kind: 'info', title: 'title' });
  });

  it('dismiss removes only the requested id', () => {
    const a = toastStore.push({ kind: 'info', message: 'a' });
    const b = toastStore.push({ kind: 'info', message: 'b' });
    toastStore.dismiss(a);
    const list = toastStore.getSnapshot();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(b);
  });

  it('clear empties the store', () => {
    toastStore.push({ kind: 'info', message: 'x' });
    toastStore.push({ kind: 'info', message: 'y' });
    toastStore.clear();
    expect(toastStore.getSnapshot()).toHaveLength(0);
  });

  it('subscribe notifies listeners on every push', () => {
    let calls = 0;
    const unsubscribe = toastStore.subscribe(() => {
      calls += 1;
    });
    toastStore.push({ kind: 'info', message: '1' });
    toastStore.push({ kind: 'info', message: '2' });
    expect(calls).toBe(2);
    unsubscribe();
    toastStore.push({ kind: 'info', message: '3' });
    expect(calls).toBe(2);
  });
});

describe('useToasts', () => {
  it('returns the live snapshot via useSyncExternalStore', () => {
    const { result } = renderHook(() => useToasts());
    expect(result.current).toHaveLength(0);
    act(() => {
      toastStore.push({ kind: 'info', message: 'hi' });
    });
    expect(result.current).toHaveLength(1);
  });
});

describe('useToast', () => {
  it('exposes ergonomic helpers per level', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.success('yay');
      result.current.error('oops');
      result.current.warning('hmm');
      result.current.info('fyi');
    });
    expect(toastStore.getSnapshot().map((t) => t.kind)).toEqual([
      'success',
      'error',
      'warning',
      'info',
    ]);
  });
});

describe('<Toaster />', () => {
  it('renders toasts and dismisses them via the close button', async () => {
    render(<Toaster />);
    act(() => {
      toastStore.push({ kind: 'error', message: 'failed', title: 'Boom' });
    });
    expect(await screen.findByText('failed')).toBeInTheDocument();
    const dismiss = screen.getByRole('button', { name: /dismiss notification/i });
    const user = userEvent.setup();
    await user.click(dismiss);
    await waitFor(() => expect(toastStore.getSnapshot()).toHaveLength(0));
  });

  it('uses role="alert" for error/warning kinds and role="status" otherwise', () => {
    render(<Toaster />);
    act(() => {
      toastStore.push({ kind: 'error', message: 'bad' });
      toastStore.push({ kind: 'info', message: 'ok' });
    });
    expect(screen.getByRole('alert')).toHaveTextContent('bad');
    expect(screen.getByRole('status')).toHaveTextContent('ok');
  });
});
