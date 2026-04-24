import { Link, useParams } from 'react-router-dom';
import {
  History,
  Filter,
  ArrowLeft,
  User,
  Bot,
  Cpu,
  CheckCircle,
  XCircle,
  ShieldBan,
  Search,
} from 'lucide-react';
import {
  useListAuditLogsQuery,
  useGetAuditEntryQuery,
} from '@/features/audit/services/auditApi';
import { errorMessage } from '@/shared/lib/api';
import { ROUTES } from '@/shared/config';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Input,
  Alert,
  EmptyState,
} from '@/shared/components/ui';
import { PageHeader, DataEmptyState, LoadingState, ErrorState } from '@/shared/components/feedback';
import { cn, formatDateTime } from '@/shared/utils';
import type { AuditEntry } from '@/shared/types';

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

interface AuditRowProps {
  entry: AuditEntry;
}

function AuditRow({ entry }: AuditRowProps) {
  const actorIcons: Record<string, typeof User> = {
    user: User,
    system: Bot,
    automation: Cpu,
  };

  const resultConfig: Record<string, { icon: typeof CheckCircle; color: string }> = {
    success: { icon: CheckCircle, color: 'text-emerald-400' },
    failure: { icon: XCircle, color: 'text-red-400' },
    blocked: { icon: ShieldBan, color: 'text-yellow-400' },
  };

  const ActorIcon = actorIcons[entry.actorType] || User;
  const ResultIcon = resultConfig[entry.result]?.icon || CheckCircle;
  const resultColor = resultConfig[entry.result]?.color || 'text-slate-400';

  return (
    <TableRow>
      <TableCell>
        <span className="text-slate-400 text-sm font-mono">
          {formatDateTime(entry.timestamp)}
        </span>
      </TableCell>
      <TableCell>
        <Link
          to={ROUTES.AUDIT.DETAIL(entry.id)}
          className="font-medium hover:text-blue-400 transition-colors"
        >
          {entry.action}
        </Link>
      </TableCell>
      <TableCell>
        <span className="text-slate-400">
          {entry.resourceKind}/{entry.resourceNamespace}/{entry.resourceName}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <ActorIcon className="h-4 w-4 text-slate-500" />
          <span className="text-slate-300">{entry.actor}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className={cn('flex items-center gap-1', resultColor)}>
          <ResultIcon className="h-4 w-4" />
          <span className="capitalize text-sm">{entry.result}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Audit Detail Page
export function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { selectedAuditEntry, loading, error } = useAppSelector((state) => state.audit);

  useEffect(() => {
    if (id) {
      dispatch(fetchAuditEntry(id));
    }
    return () => {
      dispatch(clearSelectedAuditEntry());
    };
  }, [dispatch, id]);

  if (loading && !selectedAuditEntry) {
    return <LoadingState message="Loading audit entry..." />;
  }

  if (error) {
    return (
      <Alert type="error" title="Failed to load audit entry">
        {error}
      </Alert>
    );
  }

  if (!selectedAuditEntry) {
    return (
      <EmptyState
        icon={<History className="h-6 w-6 text-slate-500" />}
        title="Audit entry not found"
        description="The requested audit entry could not be found."
      />
    );
  }

  const resultColors: Record<string, string> = {
    success: 'bg-emerald-500/20 text-emerald-400',
    failure: 'bg-red-500/20 text-red-400',
    blocked: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back link */}
      <Link to={ROUTES.AUDIT.LIST} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" />
        Back to audit log
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Badge className={resultColors[selectedAuditEntry.result]}>
            {selectedAuditEntry.result}
          </Badge>
          <h1 className="text-2xl font-bold text-white">{selectedAuditEntry.action}</h1>
        </div>
        <p className="text-slate-400 mt-1">
          {formatDateTime(selectedAuditEntry.timestamp)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Resource Kind</p>
                <p className="text-slate-200">{selectedAuditEntry.resourceKind}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Namespace</p>
                <p className="text-slate-200">{selectedAuditEntry.resourceNamespace}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Resource Name</p>
                <p className="text-slate-200">{selectedAuditEntry.resourceName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Actor Type</p>
                <p className="text-slate-200 capitalize">{selectedAuditEntry.actorType}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-1">Actor</p>
              <p className="text-slate-200">{selectedAuditEntry.actor}</p>
            </div>

            {selectedAuditEntry.message && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Message</p>
                <p className="text-slate-200 bg-slate-800/50 p-3 rounded-lg">
                  {selectedAuditEntry.message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAuditEntry.metadata && Object.keys(selectedAuditEntry.metadata).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(selectedAuditEntry.metadata).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between">
                    <span className="text-sm text-slate-400">{key}</span>
                    <span className="text-sm text-slate-200 font-mono">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No additional metadata</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
