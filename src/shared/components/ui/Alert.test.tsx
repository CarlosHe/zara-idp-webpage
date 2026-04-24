import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, alertVariants } from './Alert';

describe('<Alert />', () => {
  it('renders children with the default info type and role="status"', () => {
    render(<Alert>heads up</Alert>);
    const el = screen.getByRole('status');
    expect(el).toHaveTextContent('heads up');
    expect(el.className).toContain('bg-blue-500/10');
  });

  it('switches role to alert for error and warning types', () => {
    const { rerender } = render(<Alert type="error">boom</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
    rerender(<Alert type="warning">warn</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('warn');
  });

  it('renders the optional title', () => {
    render(
      <Alert title="Heads up" type="success">
        done
      </Alert>,
    );
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('done')).toBeInTheDocument();
  });
});

describe('alertVariants', () => {
  it('emits distinct palettes per type', () => {
    expect(alertVariants({ type: 'success' })).toContain('bg-emerald-500/10');
    expect(alertVariants({ type: 'warning' })).toContain('bg-yellow-500/10');
    expect(alertVariants({ type: 'error' })).toContain('bg-red-500/10');
  });
});
