import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  iconClassName?: string;
}

/**
 * Componente padronizado para exibir estados de carregamento.
 */
export function LoadingState({ 
  message = 'Loading...', 
  iconClassName = 'text-blue-400' 
}: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className={`h-8 w-8 animate-spin ${iconClassName}`} />
      <span className="ml-2 text-slate-400">{message}</span>
    </div>
  );
}
