import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  EmptyState,
} from '@/shared/components/ui';
import type { RuntimeEvent } from '../types';

interface Props {
  events: RuntimeEvent[];
}

export function EventList({ events }: Props) {
  if (events.length === 0) {
    return <EmptyState title="No events" description="No recent events for this workload." />;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Events ({events.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {events.map((e, i) => (
            <li key={`${e.lastSeen}-${i}`} className="border-b border-slate-800 pb-2 last:border-0">
              <div className="flex items-center gap-2">
                <Badge variant={e.type === 'Warning' ? 'warning' : 'default'}>{e.type}</Badge>
                <span className="font-medium">{e.reason}</span>
                <span className="text-slate-500">×{e.count}</span>
              </div>
              <div className="text-slate-400 mt-1">{e.message}</div>
              <div className="text-slate-600 text-xs mt-1">
                {new Date(e.lastSeen).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
