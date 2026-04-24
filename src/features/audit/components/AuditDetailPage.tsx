import { Link, useParams } from 'react-router-dom';
import { History, ArrowLeft } from 'lucide-react';
import { useGetAuditEntryQuery } from '@/features/audit/services/auditApi';
import { errorMessage } from '@/shared/lib/api';
import { ROUTES } from '@/shared/config';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Alert,
  EmptyState,
} from '@/shared/components/ui';
import { LoadingState } from '@/shared/components/feedback';
import { formatDateTime } from '@/shared/utils';

const resultColors: Record<string, string> = {
  success: 'bg-emerald-500/20 text-emerald-400',
  failure: 'bg-red-500/20 text-red-400',
  blocked: 'bg-yellow-500/20 text-yellow-400',
};

export function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: selectedAuditEntry, isLoading: loading, error } = useGetAuditEntryQuery(
    id ?? '',
    { skip: !id },
  );

  if (loading && !selectedAuditEntry) {
    return <LoadingState message="Loading audit entry..." />;
  }

  if (error) {
    return (
      <Alert type="error" title="Failed to load audit entry">
        {errorMessage(error) || 'Unable to load audit entry.'}
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
