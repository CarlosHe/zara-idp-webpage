import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorFallback } from './ErrorFallback';

describe('<ErrorFallback />', () => {
  it('renders the default title and wraps content in role="alert"', () => {
    render(<ErrorFallback />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
  });

  it('renders the error message when passed an Error instance', () => {
    render(<ErrorFallback error={new Error('fetch failed')} />);
    expect(screen.getByText('fetch failed')).toBeInTheDocument();
  });

  it('renders a plain-string error as-is', () => {
    render(<ErrorFallback error="string error" />);
    expect(screen.getByText('string error')).toBeInTheDocument();
  });

  it('renders the description prop alongside the title', () => {
    render(<ErrorFallback description="Try refreshing the page" />);
    expect(screen.getByText('Try refreshing the page')).toBeInTheDocument();
  });

  it('shows the retry button only when onRetry is provided, and invokes it', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<ErrorFallback />);
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();

    rerender(<ErrorFallback onRetry={onRetry} />);
    await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
