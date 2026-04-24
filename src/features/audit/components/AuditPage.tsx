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
} from '@/shared/components/ui';
import { PageHeader, DataEmptyState, LoadingState, ErrorState } from '@/shared/components/feedback';
import { AuditFilters } from './AuditFilters';
import { AuditRow } from './AuditRow';

export function AuditPage() {
  const { data: auditLogs, isLoading: loading, error, refetch } = useListAuditLogsQuery();

  if (error) {
    const message = errorMessage(error) || 'Failed to load audit logs';
    return <ErrorState message={message} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        icon={<History className="h-6 w-6" />}
        iconClassName="text-slate-400"
        title="Audit Log"
        description="Track all resource changes and system events"
        onRefresh={refetch}
      />

      {/* Filters */}
      <AuditFilters />

      {/* Audit Table */}
      <Card padding="none">
        <CardHeader className="px-4 pt-4">
          <CardTitle>
            {(auditLogs || []).length} Audit Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState message="Loading audit logs..." />
          ) : !auditLogs || auditLogs.length === 0 ? (
            <DataEmptyState
              icon={<History className="h-6 w-6 text-slate-500" />}
              title="No audit entries"
              description="Audit logs will appear here as changes are made."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((entry) => (
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
