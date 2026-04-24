import type { ReactNode } from 'react';
import { XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: ReactNode;
}

/**
 * Componente padronizado para exibir estados de erro.
 */
export function ErrorState({ 
  title = 'Error',
  message, 
  onRetry, 
  retryLabel = 'Retry',
  icon
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      {icon || <XCircle className="h-12 w-12 text-red-400 mb-4" />}
      {title && <h3 className="text-lg font-medium text-red-400 mb-2">{title}</h3>}
      <p className="text-red-400 mb-4">{message}</p>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
