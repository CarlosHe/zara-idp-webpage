import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, buttonVariants } from './Button';

describe('<Button />', () => {
  it('renders its children inside a <button>', () => {
    render(<Button>Apply</Button>);
    const btn = screen.getByRole('button', { name: /apply/i });
    expect(btn).toBeInTheDocument();
    expect(btn.tagName).toBe('BUTTON');
  });

  it('applies the primary + md variants by default', () => {
    render(<Button>Apply</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-blue-600'); // primary
    expect(btn.className).toContain('h-10'); // md
  });

  it('maps variant + size props to CVA classes', () => {
    render(
      <Button variant="danger" size="lg">
        Delete
      </Button>,
    );
    const btn = screen.getByRole('button', { name: /delete/i });
    expect(btn.className).toContain('bg-red-600');
    expect(btn.className).toContain('h-11');
  });

  it('disables the button and sets aria-busy when loading', () => {
    render(<Button loading>Saving</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('is disabled when `disabled` is set independently of loading', () => {
    render(<Button disabled>Idle</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('forwards a ref to the underlying <button>', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>x</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('fires onClick when not disabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.setup().click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('suppresses onClick when loading', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        Go
      </Button>,
    );
    await userEvent.setup().click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('buttonVariants exposes a stable CVA factory', () => {
    const className = buttonVariants({ variant: 'outline', size: 'sm' });
    expect(className).toContain('border-slate-600');
    expect(className).toContain('h-8');
  });
});
