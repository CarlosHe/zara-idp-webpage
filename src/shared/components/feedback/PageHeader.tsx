import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui';

interface PageHeaderProps {
  icon?: ReactNode;
  iconClassName?: string;
  title: string;
  description?: string;
  onRefresh?: () => void;
  refreshLabel?: string;
  actions?: ReactNode;
}

export function PageHeader({
  icon,
  iconClassName = 'text-blue-400',
  title,
  description,
  onRefresh,
  refreshLabel = 'Sync All',
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          {icon && <span className={iconClassName}>{icon}</span>}
          {title}
        </h1>
        {description && (
          <p className="text-slate-400 mt-1">{description}</p>
        )}
      </div>
      <div className="flex gap-2">
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {refreshLabel}
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
