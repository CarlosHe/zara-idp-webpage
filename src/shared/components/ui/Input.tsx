import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils';

const fieldVariants = cva(
  [
    'w-full rounded-md border bg-slate-800 px-3 py-2 text-slate-200 placeholder-slate-500',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      invalid: {
        true: 'border-red-500',
        false: 'border-slate-700',
      },
    },
    defaultVariants: {
      invalid: false,
    },
  },
);

interface FieldShellProps {
  label?: ReactNode;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

function FieldShell({ label, error, htmlFor, children, className }: FieldShellProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-slate-300"
        >
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'size'>,
    Omit<VariantProps<typeof fieldVariants>, 'invalid'> {
  label?: ReactNode;
  error?: string;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, wrapperClassName, ...rest }, ref) => {
    const autoId = useId();
    const resolvedId = id ?? autoId;
    return (
      <FieldShell
        label={label}
        error={error}
        htmlFor={resolvedId}
        className={wrapperClassName}
      >
        <input
          ref={ref}
          id={resolvedId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${resolvedId}-error` : undefined}
          className={cn(fieldVariants({ invalid: !!error }), className)}
          {...rest}
        />
      </FieldShell>
    );
  },
);
Input.displayName = 'Input';

interface TextareaProps
  extends ComponentPropsWithoutRef<'textarea'> {
  label?: ReactNode;
  error?: string;
  wrapperClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, wrapperClassName, ...rest }, ref) => {
    const autoId = useId();
    const resolvedId = id ?? autoId;
    return (
      <FieldShell
        label={label}
        error={error}
        htmlFor={resolvedId}
        className={wrapperClassName}
      >
        <textarea
          ref={ref}
          id={resolvedId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${resolvedId}-error` : undefined}
          className={cn(
            fieldVariants({ invalid: !!error }),
            'resize-none',
            className,
          )}
          {...rest}
        />
      </FieldShell>
    );
  },
);
Textarea.displayName = 'Textarea';

interface SelectProps extends ComponentPropsWithoutRef<'select'> {
  label?: ReactNode;
  error?: string;
  options?: { value: string; label: string }[];
  wrapperClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, options, className, id, children, wrapperClassName, ...rest },
    ref,
  ) => {
    const autoId = useId();
    const resolvedId = id ?? autoId;
    return (
      <FieldShell
        label={label}
        error={error}
        htmlFor={resolvedId}
        className={wrapperClassName}
      >
        <select
          ref={ref}
          id={resolvedId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${resolvedId}-error` : undefined}
          className={cn(fieldVariants({ invalid: !!error }), className)}
          {...rest}
        >
          {options
            ? options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            : children}
        </select>
      </FieldShell>
    );
  },
);
Select.displayName = 'Select';

export { Input, Textarea, Select, fieldVariants };
export type { InputProps, TextareaProps, SelectProps };
