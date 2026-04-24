import { Boxes } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import type { ResourceByKind } from '@/features/analytics/hooks/useAnalyticsDashboard';

interface ResourcesByKindCardProps {
  resources: ResourceByKind[];
}

export function ResourcesByKindCard({ resources }: ResourcesByKindCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-purple-400" />
          Resources by Kind
        </CardTitle>
      </CardHeader>
      <CardContent>
        {resources.length > 0 ? (
          <div className="space-y-4">
            {resources.map((item) => (
              <div key={item.kind}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">{item.kind}</span>
                  <span className="text-sm text-slate-400">{item.count}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">No resource data available</p>
        )}
      </CardContent>
    </Card>
  );
}
