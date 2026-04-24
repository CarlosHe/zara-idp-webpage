import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmModal, Modal, modalVariants } from './Modal';

function noop() {}

describe('<Modal />', () => {
  it('does not render anything when closed', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={noop} title="Hidden">
        body
      </Modal>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the portaled dialog when open with title + description', () => {
    render(
      <Modal isOpen onClose={noop} title="New resource" description="Declarative">
        <button>submit</button>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'New resource' })).toBeInTheDocument();
    expect(screen.getByText('Declarative')).toBeInTheDocument();
  });

  it('calls onClose when the user presses Escape', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="T">
        <button>x</button>
      </Modal>,
    );
    await userEvent.setup().keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the close (×) button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="T">
        <button>x</button>
      </Modal>,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: /close dialog/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('<ConfirmModal />', () => {
  it('renders message + default confirm/cancel buttons', () => {
    render(
      <ConfirmModal
        isOpen
        onClose={noop}
        onConfirm={noop}
        title="Delete"
        message="Are you sure?"
      />,
    );
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('invokes onConfirm when the confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        isOpen
        onClose={noop}
        onConfirm={onConfirm}
        title="Delete"
        message="really?"
      />,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('disables both buttons while loading (cancel via disabled, confirm via aria-busy)', () => {
    render(
      <ConfirmModal
        isOpen
        onClose={noop}
        onConfirm={noop}
        title="Delete"
        message="wait"
        loading
      />,
    );
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    const confirm = screen.getByRole('button', { name: /confirm/i });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute('aria-busy', 'true');
  });
});

describe('modalVariants', () => {
  it('maps size to max-width classes', () => {
    expect(modalVariants({ size: 'sm' })).toContain('max-w-md');
    expect(modalVariants({ size: 'xl' })).toContain('max-w-4xl');
  });
});
