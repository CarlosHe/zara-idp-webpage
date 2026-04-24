import {
  forwardRef,
  useEffect,
  useRef,
  useCallback,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils';
import { Button } from './Button';

const modalVariants = cva(
  [
    'w-full rounded-lg border border-slate-700 bg-slate-800 shadow-xl',
    'transform transition-all animate-scale-in',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface ModalProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'title'>,
    VariantProps<typeof modalVariants> {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  closeOnOverlayClick?: boolean;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      description,
      children,
      size,
      className,
      closeOnOverlayClick = true,
      ...rest
    },
    ref,
  ) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);

    const trapFocus = useCallback((event: KeyboardEvent) => {
      const node = contentRef.current;
      if (!node || event.key !== 'Tab') return;

      const focusables = node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }, []);

    useEffect(() => {
      if (!isOpen) return;

      previouslyFocused.current = document.activeElement as HTMLElement | null;

      const node = contentRef.current;
      const firstFocusable = node?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      firstFocusable?.focus();

      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
          return;
        }
        trapFocus(event);
      };

      document.addEventListener('keydown', handleKeydown);
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeydown);
        document.body.style.overflow = previousOverflow;
        previouslyFocused.current?.focus?.();
      };
    }, [isOpen, onClose, trapFocus]);

    if (!isOpen) return null;

    const handleOverlayClick = (event: React.MouseEvent) => {
      if (closeOnOverlayClick && event.target === overlayRef.current) {
        onClose();
      }
    };

    const content = (
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      >
        <div
          ref={(node) => {
            contentRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby={description ? 'modal-description' : undefined}
          className={cn(modalVariants({ size }), className)}
          {...rest}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-700 px-6 py-4">
            <div className="min-w-0 flex-1">
              <h2 id="modal-title" className="text-lg font-semibold text-white">
                {title}
              </h2>
              {description ? (
                <p id="modal-description" className="mt-1 text-sm text-slate-400">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    );

    return typeof document === 'undefined'
      ? content
      : createPortal(content, document.body);
  },
);
Modal.displayName = 'Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="mb-6 text-slate-300">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

export { Modal, ConfirmModal, modalVariants };
export type { ModalProps, ConfirmModalProps };
