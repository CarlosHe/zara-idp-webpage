import { Link, useParams } from 'react-router-dom';
import {
  Snowflake,
  ArrowLeft,
  Clock,
  User,
  AlertTriangle,
} from 'lucide-react';
import {
  useListFreezesQuery,
  useGetFreezeQuery,
} from '@/features/freezes/services/freezesApi';
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
  Alert,
  EmptyState,
} from '@/shared/components/ui';
import { PageHeader, DataEmptyState, LoadingState, ErrorState } from '@/shared/components/feedback';
import { cn, formatDateTime, formatRelativeTime } from '@/shared/utils';
import type { Freeze } from '@/shared/types';

export function FreezesPage() {
  const { data: freezes, isLoading: loading, error, refetch } = useListFreezesQuery();

  const safeFreezes = Array.isArray(freezes) ? freezes : [];
  const activeFreezes = safeFreezes.filter((f) => f.active);
  const inactiveFreezes = safeFreezes.filter((f) => !f.active);

  if (error) {
    const message = errorMessage(error) || 'Failed to load freezes';
    return <ErrorState message={message} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        icon={<Snowflake className="h-6 w-6" />}
        iconClassName="text-cyan-400"
        title="Freezes"
        description="View active deployment freezes and change restrictions"
        onRefresh={refetch}
      />

      {/* Active Freezes Warning */}
      {activeFreezes.length > 0 && (
        <Alert type="warning" title={`${activeFreezes.length} Active Freeze${activeFreezes.length > 1 ? 's' : ''}`}>
          Changes may be restricted. Review active freezes below.
        </Alert>
      )}

      {/* Active Freezes */}
      <Card padding="none">
        <CardHeader className="px-4 pt-4">
          <CardTitle className="flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-cyan-400" />
            Active Freezes ({activeFreezes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState message="Loading freezes..." />
          ) : activeFreezes.length === 0 ? (
            <DataEmptyState
              icon={<Snowflake className="h-6 w-6 text-slate-500" />}
              title="No active freezes"
              description="All systems are open for changes."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeFreezes.map((freeze) => (
                  <FreezeRow key={freeze.id} freeze={freeze} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Past Freezes */}
      {inactiveFreezes.length > 0 && (
        <Card padding="none">
          <CardHeader className="px-4 pt-4">
            <CardTitle className="text-slate-400">
              Past Freezes ({inactiveFreezes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveFreezes.slice(0, 10).map((freeze) => (
                  <FreezeRow key={freeze.id} freeze={freeze} inactive />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface FreezeRowProps {
  freeze: Freeze;
  inactive?: boolean;
}

function FreezeRow({ freeze, inactive }: FreezeRowProps) {
  const scopeLabels: string[] = [];
  
  if (freeze.scope.global) {
    scopeLabels.push('Global');
  } else {
    if (freeze.scope.namespaces.length > 0) {
      scopeLabels.push(`${freeze.scope.namespaces.length} namespace(s)`);
    }
    if (freeze.scope.teams.length > 0) {
      scopeLabels.push(`${freeze.scope.teams.length} team(s)`);
    }
    if (freeze.scope.kinds.length > 0) {
      scopeLabels.push(`${freeze.scope.kinds.length} kind(s)`);
    }
  }

  return (
    <TableRow className={cn(inactive && 'opacity-60')}>
      <TableCell>
        <Link
          to={ROUTES.FREEZES.DETAIL(freeze.id)}
          className="font-medium hover:text-blue-400 transition-colors flex items-center gap-2"
        >
          {freeze.active && <Snowflake className="h-4 w-4 text-cyan-400" />}
          {freeze.name}
        </Link>
      </TableCell>
      <TableCell>
        <span className="text-slate-400">{freeze.reason}</span>
      </TableCell>
      <TableCell>
        <span className="text-slate-400">{freeze.createdBy}</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {scopeLabels.map((label, i) => (
            <Badge key={i} variant="outline">
              {label}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        {freeze.expiresAt ? (
          <span className="text-slate-400">{formatRelativeTime(freeze.expiresAt)}</span>
        ) : (
          <span className="text-slate-500">No expiration</span>
        )}
      </TableCell>
    </TableRow>
  );
}

// Freeze Detail Page
export function FreezeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: selectedFreeze, isLoading: loading, error } = useGetFreezeQuery(id ?? '', {
    skip: !id,
  });

  if (loading && !selectedFreeze) {
    return <LoadingState message="Loading freeze..." />;
  }

  if (error) {
    return (
      <Alert type="error" title="Failed to load freeze">
        {errorMessage(error) || 'Unable to load freeze details.'}
      </Alert>
    );
  }

  if (!selectedFreeze) {
    return (
      <EmptyState
        icon={<Snowflake className="h-6 w-6 text-slate-500" />}
        title="Freeze not found"
        description="The requested freeze could not be found."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back link */}
      <Link to={ROUTES.FREEZES.LIST} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" />
        Back to freezes
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={cn(
          'h-12 w-12 rounded-lg flex items-center justify-center',
          selectedFreeze.active ? 'bg-cyan-500/20' : 'bg-slate-700'
        )}>
          <Snowflake className={cn(
            'h-6 w-6',
            selectedFreeze.active ? 'text-cyan-400' : 'text-slate-500'
          )} />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{selectedFreeze.name}</h1>
            <Badge className={selectedFreeze.active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-500/20 text-slate-400'}>
              {selectedFreeze.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-slate-400 mt-1">{selectedFreeze.reason}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Freeze Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-400">Created By</p>
                <p className="text-slate-200">{selectedFreeze.createdBy}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-400">Created At</p>
                <p className="text-slate-200">{formatDateTime(selectedFreeze.createdAt)}</p>
              </div>
            </div>

            {selectedFreeze.expiresAt && (
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-400">Expires At</p>
                  <p className="text-slate-200">{formatDateTime(selectedFreeze.expiresAt)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scope */}
        <Card>
          <CardHeader>
            <CardTitle>Scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFreeze.scope.global ? (
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Global Freeze</span>
              </div>
            ) : (
              <>
                {selectedFreeze.scope.namespaces.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Namespaces</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFreeze.scope.namespaces.map((ns) => (
                        <Badge key={ns}>{ns}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFreeze.scope.teams.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Teams</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFreeze.scope.teams.map((team) => (
                        <Badge key={team}>{team}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFreeze.scope.kinds.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Resource Kinds</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFreeze.scope.kinds.map((kind) => (
                        <Badge key={kind}>{kind}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {selectedFreeze.allowedOperations.length > 0 && (
              <div>
                <p className="text-sm text-slate-400 mb-2">Allowed Operations</p>
                <div className="flex flex-wrap gap-2">
                  {selectedFreeze.allowedOperations.map((op) => (
                    <Badge key={op} className="bg-emerald-500/20 text-emerald-400">
                      {op}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
