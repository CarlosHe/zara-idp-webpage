import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Badge, StatusBadge, badgeVariants } from './Badge';

describe('<Badge />', () => {
  it('renders children inside a span with the default variant classes', () => {
    render(<Badge>new</Badge>);
    const el = screen.getByText('new');
    expect(el.tagName).toBe('SPAN');
    expect(el.className).toContain('bg-slate-700');
  });

  it('switches to the requested variant', () => {
    render(<Badge variant="danger">down</Badge>);
    expect(screen.getByText('down').className).toContain('bg-red-500/15');
  });

  it('merges an override className without duplicating core classes', () => {
    render(<Badge className="uppercase tracking-wide">tag</Badge>);
    const el = screen.getByText('tag');
    expect(el.className).toContain('uppercase');
    expect(el.className).toContain('rounded-full'); // base class still there
  });

  it('forwards a ref to the span', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref}>x</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

describe('<StatusBadge />', () => {
  it('renders the mapped label for a known status', () => {
    render(<StatusBadge type="health" status="Healthy" />);
    expect(screen.getByText(/healthy/i)).toBeInTheDocument();
  });

  it('falls back to rendering the raw status when no config matches', () => {
    render(<StatusBadge type="health" status={'WeirdValue' as never} />);
    expect(screen.getByText('WeirdValue')).toBeInTheDocument();
  });
});

describe('badgeVariants', () => {
  it('returns distinct classnames per variant', () => {
    expect(badgeVariants({ variant: 'success' })).toContain('bg-emerald-500/15');
    expect(badgeVariants({ variant: 'info' })).toContain('bg-blue-500/15');
  });
});
