import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/shared/utils';

interface SkipLinkProps extends ComponentPropsWithoutRef<'a'> {
  targetId?: string;
}

// First focusable element on every page. Hidden until it receives focus
// (`sr-only` + `focus:not-sr-only`), lets keyboard users jump over the
// sidebar straight to the main landmark. WCAG 2.1 AA §2.4.1.
export function SkipLink({
  targetId = 'main-content',
  children = 'Skip to main content',
  className,
  ...rest
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      {...rest}
      className={cn(
        'sr-only focus:not-sr-only',
        'focus:fixed focus:left-4 focus:top-4 focus:z-[100]',
        'focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
        className,
      )}
    >
      {children}
    </a>
  );
}
