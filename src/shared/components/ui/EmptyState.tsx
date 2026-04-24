import { Package } from 'lucide-react';
import { cn } from '@/shared/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
        {icon || <Package className="h-6 w-6 text-slate-500" />}
      </div>
      <h3 className="text-sm font-medium text-slate-200">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
