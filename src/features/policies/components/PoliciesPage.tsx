import { Link, useParams } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  AlertTriangle,
  Bell,
  Clock,
  CheckSquare,
} from 'lucide-react';
import { useListRuntimePoliciesQuery } from '@/features/policies/services/policiesApi';
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
import { cn } from '@/shared/utils';
import type { RuntimePolicy, RuntimeAction } from '@/shared/types';

export function PoliciesPage() {
  const { data: runtimePolicies, isLoading: loading, error, refetch } =
    useListRuntimePoliciesQuery();

  const safePolicies = Array.isArray(runtimePolicies) ? runtimePolicies : [];
  const enabledPolicies = safePolicies.filter((p) => p.enabled);
  const disabledPolicies = safePolicies.filter((p) => !p.enabled);

  if (error) {
    const message = errorMessage(error) || 'Failed to load runtime policies';
    return <ErrorState message={message} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        icon={<Shield className="h-6 w-6" />}
        iconClassName="text-blue-400"
        title="Runtime Policies"
        description="Manage policies that control runtime behavior and change restrictions"
        onRefresh={() => dispatch(fetchRuntimePolicies())}
      />

      {/* Enabled Policies */}
      <Card padding="none">
        <CardHeader className="px-4 pt-4">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Active Policies ({enabledPolicies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState message="Loading policies..." />
          ) : enabledPolicies.length === 0 ? (
            <DataEmptyState
              icon={<Shield className="h-6 w-6 text-slate-500" />}
              title="No active policies"
              description="No runtime policies are currently enabled."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Triggers</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Scope</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enabledPolicies.map((policy) => (
                  <PolicyRow key={policy.id} policy={policy} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Disabled Policies */}
      {disabledPolicies.length > 0 && (
        <Card padding="none">
          <CardHeader className="px-4 pt-4">
            <CardTitle className="text-slate-400">
              Disabled Policies ({disabledPolicies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Triggers</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disabledPolicies.map((policy) => (
                  <PolicyRow key={policy.id} policy={policy} disabled />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface PolicyRowProps {
  policy: RuntimePolicy;
  disabled?: boolean;
}

function PolicyRow({ policy, disabled }: PolicyRowProps) {
  const actionConfig: Record<string, { icon: typeof Shield; color: string }> = {
    freeze: { icon: AlertTriangle, color: 'text-cyan-400 bg-cyan-500/20' },
    deny: { icon: Shield, color: 'text-red-400 bg-red-500/20' },
    warn: { icon: Bell, color: 'text-yellow-400 bg-yellow-500/20' },
    notify: { icon: Bell, color: 'text-blue-400 bg-blue-500/20' },
    requireApproval: { icon: CheckSquare, color: 'text-purple-400 bg-purple-500/20' },
  };

  const ActionIcon = actionConfig[policy.action.type]?.icon || Shield;
  const actionColor = actionConfig[policy.action.type]?.color || 'text-slate-400 bg-slate-500/20';

  return (
    <TableRow className={cn(disabled && 'opacity-60')}>
      <TableCell>
        <Link
          to={ROUTES.POLICIES.DETAIL(policy.namespace, policy.name)}
          className="font-medium hover:text-blue-400 transition-colors"
        >
          {policy.name}
        </Link>
        <p className="text-xs text-slate-500">{policy.namespace}</p>
      </TableCell>
      <TableCell>
        <span className="text-slate-400">{policy.description}</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {policy.triggers.map((trigger, i) => (
            <Badge key={i} variant="outline">
              {trigger.type}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', actionColor)}>
          <ActionIcon className="h-3 w-3" />
          {policy.action.type}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-slate-400">
          {policy.scope.namespaces.length > 0
            ? `${policy.scope.namespaces.length} ns`
            : 'All namespaces'}
        </span>
      </TableCell>
    </TableRow>
  );
}

// Policy Detail Page
export function PolicyDetailPage() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const { items: runtimePolicies, loading, error } = useAppSelector((state) => state.policies);

  const policy = runtimePolicies.find(
    (p) => p.namespace === namespace && p.name === name
  );

  if (loading && runtimePolicies.length === 0) {
    return <LoadingState message="Loading policy..." />;
  }

  if (error) {
    return (
      <Alert type="error" title="Failed to load policy">
        {error}
      </Alert>
    );
  }

  if (!policy) {
    return (
      <EmptyState
        icon={<Shield className="h-6 w-6 text-slate-500" />}
        title="Policy not found"
        description="The requested policy could not be found."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back link */}
      <Link to={ROUTES.POLICIES.LIST} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" />
        Back to policies
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={cn(
          'h-12 w-12 rounded-lg flex items-center justify-center',
          policy.enabled ? 'bg-blue-500/20' : 'bg-slate-700'
        )}>
          <Shield className={cn(
            'h-6 w-6',
            policy.enabled ? 'text-blue-400' : 'text-slate-500'
          )} />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{policy.name}</h1>
            <Badge className={policy.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}>
              {policy.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <p className="text-slate-400 mt-1">{policy.namespace}</p>
        </div>
      </div>

      {/* Description */}
      {policy.description && (
        <Card>
          <CardContent>
            <p className="text-slate-300">{policy.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Triggers */}
        <Card>
          <CardHeader>
            <CardTitle>Triggers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {policy.triggers.map((trigger, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-800/50">
                <div className="flex items-center justify-between mb-2">
                  <Badge>{trigger.type}</Badge>
                  <span className="text-sm text-slate-400">{trigger.source}</span>
                </div>
                {Object.keys(trigger.conditions).length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 mb-1">Conditions</p>
                    <pre className="text-xs text-slate-300 font-mono">
                      {JSON.stringify(trigger.conditions, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action */}
        <Card>
          <CardHeader>
            <CardTitle>Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ActionDetails action={policy.action} />
          </CardContent>
        </Card>

        {/* Scope */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Scope</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-2">Namespaces</p>
              {policy.scope.namespaces.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {policy.scope.namespaces.map((ns) => (
                    <Badge key={ns}>{ns}</Badge>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500">All namespaces</span>
              )}
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-2">Resource Kinds</p>
              {policy.scope.kinds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {policy.scope.kinds.map((kind) => (
                    <Badge key={kind}>{kind}</Badge>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500">All kinds</span>
              )}
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-2">Label Selectors</p>
              {Object.keys(policy.scope.labels).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(policy.scope.labels).map(([k, v]) => (
                    <Badge key={k} variant="outline">
                      {k}={v}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500">No label selectors</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ActionDetailsProps {
  action: RuntimeAction;
}

function ActionDetails({ action }: ActionDetailsProps) {
  const actionLabels: Record<string, string> = {
    freeze: 'Freeze deployments',
    deny: 'Deny all changes',
    warn: 'Show warning',
    notify: 'Send notification',
    requireApproval: 'Require approval',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-blue-400" />
        <span className="font-medium text-slate-200">
          {actionLabels[action.type] || action.type}
        </span>
      </div>

      {action.message && (
        <div>
          <p className="text-sm text-slate-400 mb-1">Message</p>
          <p className="text-slate-300 bg-slate-800/50 p-2 rounded">
            {action.message}
          </p>
        </div>
      )}

      {action.duration && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-400">Duration: {action.duration}</span>
        </div>
      )}

      {action.notifyChannels.length > 0 && (
        <div>
          <p className="text-sm text-slate-400 mb-1">Notify Channels</p>
          <div className="flex flex-wrap gap-2">
            {action.notifyChannels.map((channel) => (
              <Badge key={channel} variant="outline">
                {channel}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
