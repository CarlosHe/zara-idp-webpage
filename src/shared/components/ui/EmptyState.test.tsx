import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('<EmptyState />', () => {
  it('renders the title', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
  });

  it('renders optional description and action', () => {
    render(
      <EmptyState
        title="empty"
        description="there is nothing yet"
        action={<button>create one</button>}
      />,
    );
    expect(screen.getByText('there is nothing yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create one/i })).toBeInTheDocument();
  });

  it('renders a custom icon when provided', () => {
    render(<EmptyState title="e" icon={<span data-testid="icon" />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
