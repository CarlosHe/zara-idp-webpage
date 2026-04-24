import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui';
import { cn } from '@/shared/utils';

interface StatCardProps {
  icon: ReactNode;
  iconBgColor?: string;
  value: string | number;
  label: string;
  trend?: number;
  trendLabel?: string;
  href?: string;
}

/**
 * Card de estatística padronizado para dashboards e headers de páginas.
 */
export function StatCard({ 
  icon, 
  iconBgColor = 'bg-blue-500/20', 
  value, 
  label,
  trend,
  trendLabel = 'from last week',
  href,
}: StatCardProps) {
  const content = (
    <Card className={cn('h-full', href && 'hover:bg-slate-700/50 cursor-pointer transition-colors')}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={cn('text-xs', trend >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {trend >= 0 ? '+' : ''}{trend}% {trendLabel}
                </span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${iconBgColor}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href} className="h-full block">{content}</Link>;
  }

  return content;
}
