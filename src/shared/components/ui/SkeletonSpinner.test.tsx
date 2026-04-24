import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonText, skeletonVariants } from './Skeleton';
import { LoadingState, Spinner, spinnerVariants } from './Spinner';

describe('<Skeleton />', () => {
  it('renders a div marked aria-hidden so it stays out of the a11y tree', () => {
    const { container } = render(<Skeleton data-testid="sk" className="h-4 w-24" />);
    const el = container.querySelector('[data-testid="sk"]')!;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.className).toContain('animate-shimmer');
    expect(el.className).toContain('h-4');
  });

  it('switches shape classes', () => {
    expect(skeletonVariants({ shape: 'circle' })).toContain('rounded-full');
    expect(skeletonVariants({ shape: 'rect' })).toContain('rounded-md');
  });
});

describe('<SkeletonText />', () => {
  it('renders N lines with the last one narrower', () => {
    const { container } = render(<SkeletonText lines={3} data-testid="st" />);
    const wrapper = container.querySelector('[data-testid="st"]')!;
    expect(wrapper.getAttribute('aria-busy')).toBe('true');
    const lines = wrapper.children;
    expect(lines).toHaveLength(3);
    expect((lines[2] as HTMLElement).className).toContain('w-2/3');
    expect((lines[0] as HTMLElement).className).toContain('w-full');
  });
});

describe('<Spinner />', () => {
  it('renders with role="status" and an accessible label', () => {
    render(<Spinner label="Reconciling" />);
    const el = screen.getByRole('status', { name: /reconciling/i });
    expect(el).toBeInTheDocument();
    expect(el.getAttribute('class')).toContain('animate-spin');
  });

  it('maps size + tone variants', () => {
    expect(spinnerVariants({ size: 'lg', tone: 'muted' })).toContain('h-8');
    expect(spinnerVariants({ size: 'lg', tone: 'muted' })).toContain('text-slate-400');
  });
});

describe('<LoadingState />', () => {
  it('renders the message in an aria-live region', () => {
    render(<LoadingState message="Fetching resources" />);
    const statuses = screen.getAllByRole('status');
    expect(statuses.length).toBeGreaterThan(0);
    expect(screen.getByText('Fetching resources')).toBeInTheDocument();
  });
});
