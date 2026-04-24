import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

function Bomb({ on = true }: { on?: boolean }) {
  if (on) throw new Error('kaboom');
  return <div>safe</div>;
}

describe('<ErrorBoundary />', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary boundaryName="unit">
        <div>happy path</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('happy path')).toBeInTheDocument();
  });

  it('swaps to the default ErrorFallback when a child throws', () => {
    // React logs componentDidCatch output; silence to keep test noise low.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary boundaryName="unit" onError={() => {}}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/kaboom/)).toBeInTheDocument();
  });

  it('invokes the custom fallback renderer with the captured error + reset', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fallback = vi.fn((error: Error) => <div>captured: {error.message}</div>);
    render(
      <ErrorBoundary boundaryName="unit" fallback={fallback} onError={() => {}}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(fallback).toHaveBeenCalled();
    expect(screen.getByText(/captured: kaboom/)).toBeInTheDocument();
  });

  it('routes through onError instead of logErrorToService when supplied', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();
    render(
      <ErrorBoundary boundaryName="widget" onError={onError}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledOnce();
    const [error, info] = onError.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(info.componentStack).toBeTruthy();
  });

  it('reset rerenders children after the parent stops throwing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    function Parent() {
      const [failing, setFailing] = useState(true);
      return (
        <ErrorBoundary
          boundaryName="unit"
          onError={() => {}}
          fallback={(_error, reset) => (
            <button
              onClick={() => {
                setFailing(false);
                reset();
              }}
            >
              retry
            </button>
          )}
        >
          <Bomb on={failing} />
        </ErrorBoundary>
      );
    }

    render(<Parent />);
    const retry = screen.getByRole('button', { name: /retry/i });
    const user = userEvent.setup();
    await user.click(retry);
    expect(screen.getByText('safe')).toBeInTheDocument();
  });
});
