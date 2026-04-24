import { describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react';
import { useAppDispatch, useAppSelector } from './redux';

// We build a tiny store inline so this test doesn't depend on the full
// app store wiring. The goal here is just to prove the typed hooks
// resolve to React-Redux's useDispatch / useSelector at runtime.
function makeStore() {
  return configureStore({
    reducer: {
      sample: (state: { count: number } = { count: 42 }) => state,
    },
  });
}

describe('typed redux hooks', () => {
  it('useAppSelector reads state through React-Redux', () => {
    const store = makeStore();
    const { result } = renderHook(
      () => useAppSelector((s) => (s as unknown as { sample: { count: number } }).sample.count),
      { wrapper: ({ children }) => <Provider store={store}>{children}</Provider> },
    );
    expect(result.current).toBe(42);
  });

  it('useAppDispatch returns the store dispatch function', () => {
    const store = makeStore();
    const { result } = renderHook(() => useAppDispatch(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
    expect(typeof result.current).toBe('function');
  });
});
