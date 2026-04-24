import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils';

const cardVariants = cva('rounded-lg border', {
  variants: {
    variant: {
      default: 'bg-slate-800/50 border-slate-700/50',
      elevated: 'bg-slate-800 border-slate-700 shadow-sm',
      outline: 'bg-transparent border-slate-700/50',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
});

interface CardProps
  extends ComponentPropsWithoutRef<'div'>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...rest}
    />
  ),
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('mb-4 flex flex-col gap-1', className)} {...rest} />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, ComponentPropsWithoutRef<'h3'>>(
  ({ className, ...rest }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-slate-100', className)}
      {...rest}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<'p'>>(
  ({ className, ...rest }, ref) => (
    <p ref={ref} className={cn('text-sm text-slate-400', className)} {...rest} />
  ),
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  ({ className, ...rest }, ref) => <div ref={ref} className={cn(className)} {...rest} />,
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('mt-4 flex items-center gap-2', className)} {...rest} />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants };
export type { CardProps };
