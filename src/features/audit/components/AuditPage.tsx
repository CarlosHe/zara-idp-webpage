import { History } from 'lucide-react';
import { useListAuditLogsQuery } from '@/features/audit/services/auditApi';
import { errorMessage } from '@/shared/lib/api';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  VIRTUALIZATION_THRESHOLD,
  VirtualList,
} from '@/shared/components/ui';
import { PageHeader, DataEmptyState, LoadingState, ErrorState } from '@/shared/components/feedback';
import { AuditFilters } from './AuditFilters';
import { AuditRow } from './AuditRow';
import { AuditVirtualRow } from './AuditVirtualRow';

const COLUMNS = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'action', label: 'Action' },
  { key: 'resource', label: 'Resource' },
  { key: 'actor', label: 'Actor' },
  { key: 'result', label: 'Result' },
];

export function AuditPage() {
  const { data: auditLogs, isLoading: loading, error, refetch } = useListAuditLogsQuery();

  if (error) {
    const message = errorMessage(error) || 'Failed to load audit logs';
    return <ErrorState message={message} onRetry={refetch} />;
  }

  const entries = auditLogs ?? [];
  const isVirtualized = entries.length >= VIRTUALIZATION_THRESHOLD;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<History className="h-6 w-6" aria-hidden />}
        iconClassName="text-slate-400"
        title="Audit Log"
        description="Track all resource changes and system events"
        onRefresh={refetch}
      />

      <AuditFilters />

      <Card padding="none">
        <CardHeader className="px-4 pt-4">
          <CardTitle>{entries.length} Audit Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState message="Loading audit logs..." />
          ) : entries.length === 0 ? (
            <DataEmptyState
              icon={<History className="h-6 w-6 text-slate-400" aria-hidden />}
              title="No audit entries"
              description="Audit logs will appear here as changes are made."
            />
          ) : isVirtualized ? (
            <div
              role="table"
              aria-label={`${entries.length} audit entries`}
              aria-rowcount={entries.length}
            >
              <div
                role="row"
                className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,.8fr)] gap-3 border-b border-slate-700 bg-slate-800/50 px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-400"
              >
                {COLUMNS.map((col) => (
                  <div key={col.key} role="columnheader">
                    {col.label}
                  </div>
                ))}
              </div>
              <VirtualList
                items={entries}
                rowHeight={56}
                height={640}
                ariaLabel={`${entries.length} audit entries`}
                renderRow={(entry, _index, style) => (
                  <AuditVirtualRow entry={entry} style={style} />
                )}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {COLUMNS.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <AuditRow key={entry.id} entry={entry} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
