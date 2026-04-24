import { Filter, Search } from 'lucide-react';
import { Card, CardContent, Input } from '@/shared/components/ui';

export function AuditFilters() {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
        </div>

        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Search audit logs..."
              className="pl-9"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
