import type { ReactNode } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/shared/utils';

interface DataEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

/**
 * Componente padronizado para exibir estado vazio em listas, tabelas e grids.
 * Use `compact` para exibição dentro de cards/tabelas menores.
 */
export function DataEmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  compact = false,
  className 
}: DataEmptyStateProps) {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8' : 'py-12',
        className
      )}
    >
      <div className={cn(
        'rounded-full bg-slate-800 flex items-center justify-center mb-4',
        compact ? 'h-10 w-10' : 'h-12 w-12'
      )}>
        {icon || <Package className={cn(compact ? 'h-5 w-5' : 'h-6 w-6', 'text-slate-400')} />}
      </div>
      <h3 className={cn(
        'font-medium text-slate-300',
        compact ? 'text-xs' : 'text-sm'
      )}>
        {title}
      </h3>
      {description && (
        <p className={cn(
          'mt-1 text-slate-400',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
