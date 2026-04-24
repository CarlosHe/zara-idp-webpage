import { forwardRef, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  kind: ToastKind;
  title?: ReactNode;
  message: ReactNode;
  durationMs: number;
}

interface ToastStore {
  getSnapshot: () => ReadonlyArray<Toast>;
  subscribe: (listener: () => void) => () => void;
  push: (input: Omit<Toast, 'id' | 'durationMs'> & { durationMs?: number }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

function createToastStore(): ToastStore {
  let state: ReadonlyArray<Toast> = [];
  const listeners = new Set<() => void>();

  function publish() {
    listeners.forEach((listener) => listener());
  }

  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    push: (input) => {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      const toast: Toast = {
        id,
        kind: input.kind,
        title: input.title,
        message: input.message,
        durationMs: input.durationMs ?? 5000,
      };
      state = [...state, toast];
      publish();
      return id;
    },
    dismiss: (id) => {
      state = state.filter((toast) => toast.id !== id);
      publish();
    },
    clear: () => {
      state = [];
      publish();
    },
  };
}

export const toastStore = createToastStore();

function emptySnapshot(): ReadonlyArray<Toast> {
  return EMPTY_SNAPSHOT;
}
const EMPTY_SNAPSHOT: ReadonlyArray<Toast> = Object.freeze([]);

export function useToasts(): ReadonlyArray<Toast> {
  return useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, emptySnapshot);
}

export function useToast() {
  return useMemo(
    () => ({
      info: (message: ReactNode, title?: ReactNode, durationMs?: number) =>
        toastStore.push({ kind: 'info', message, title, durationMs }),
      success: (message: ReactNode, title?: ReactNode, durationMs?: number) =>
        toastStore.push({ kind: 'success', message, title, durationMs }),
      warning: (message: ReactNode, title?: ReactNode, durationMs?: number) =>
        toastStore.push({ kind: 'warning', message, title, durationMs }),
      error: (message: ReactNode, title?: ReactNode, durationMs?: number) =>
        toastStore.push({ kind: 'error', message, title, durationMs: durationMs ?? 8000 }),
      dismiss: (id: string) => toastStore.dismiss(id),
      clear: () => toastStore.clear(),
    }),
    [],
  );
}

const toastItemVariants = cva(
  [
    'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-3 shadow-lg',
    'animate-slide-in',
  ],
  {
    variants: {
      kind: {
        info: 'border-blue-500/40 bg-blue-500/15 text-blue-100',
        success: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100',
        warning: 'border-yellow-500/40 bg-yellow-500/15 text-yellow-100',
        error: 'border-red-500/40 bg-red-500/15 text-red-100',
      },
    },
    defaultVariants: { kind: 'info' },
  },
);

const iconByKind = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
} as const;

interface ToastItemProps extends VariantProps<typeof toastItemVariants> {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem = forwardRef<HTMLDivElement, ToastItemProps>(
  ({ toast, onDismiss }, ref) => {
    useEffect(() => {
      if (toast.durationMs <= 0) return;
      const timer = window.setTimeout(() => onDismiss(toast.id), toast.durationMs);
      return () => window.clearTimeout(timer);
    }, [toast.id, toast.durationMs, onDismiss]);

    const Icon = iconByKind[toast.kind];

    return (
      <div
        ref={ref}
        role={toast.kind === 'error' || toast.kind === 'warning' ? 'alert' : 'status'}
        className={cn(toastItemVariants({ kind: toast.kind }))}
      >
        <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          {toast.title ? <p className="font-medium leading-5">{toast.title}</p> : null}
          <p className="text-sm opacity-90">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          className="rounded-md p-1 text-current/70 transition-colors hover:bg-black/20 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  },
);
ToastItem.displayName = 'ToastItem';

export function Toaster() {
  const toasts = useToasts();

  if (typeof document === 'undefined') return null;

  const node = (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed right-4 top-4 z-[60] flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={toastStore.dismiss} />
      ))}
    </div>
  );

  return createPortal(node, document.body);
}
