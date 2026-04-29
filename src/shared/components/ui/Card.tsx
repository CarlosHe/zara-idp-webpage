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

// Sprint 32 / L-3204 — CardTitle is the section-level heading inside
// a page's <main>. WCAG 2.2 §1.3.1 says headings must not skip levels;
// every page in this app uses <PageHeader> (h1) and then dropped into
// h3 on every CardTitle, which is a serious violation. The default
// is now h2 so the hierarchy reads h1 → h2 cleanly. Pages that nest a
// card inside another card can opt into h3 via the `as` prop.
type CardTitleProps = ComponentPropsWithoutRef<'h2'> & {
  as?: 'h2' | 'h3' | 'h4';
};
const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Tag = 'h2', ...rest }, ref) => (
    <Tag
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
