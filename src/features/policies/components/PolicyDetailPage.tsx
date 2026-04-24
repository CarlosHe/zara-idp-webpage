import { Link, useParams } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { useListRuntimePoliciesQuery } from '@/features/policies/services/policiesApi';
import { ROUTES } from '@/shared/config';
import { errorMessage } from '@/shared/lib/api';
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
import { cn } from '@/shared/utils';
import { PolicyActionDetails } from './PolicyActionDetails';

export function PolicyDetailPage() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const { data: runtimePolicies = [], isLoading: loading, error } = useListRuntimePoliciesQuery();

  const policy = runtimePolicies.find(
    (p) => p.namespace === namespace && p.name === name,
  );

  if (loading && runtimePolicies.length === 0) {
    return <LoadingState message="Loading policy..." />;
  }

  if (error) {
    return (
      <Alert type="error" title="Failed to load policy">
        {errorMessage(error) || 'Unable to load policy.'}
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
      <Link
        to={ROUTES.POLICIES.LIST}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to policies
      </Link>

      <div className="flex items-start gap-4">
        <div
          className={cn(
            'h-12 w-12 rounded-lg flex items-center justify-center',
            policy.enabled ? 'bg-blue-500/20' : 'bg-slate-700',
          )}
        >
          <Shield
            className={cn(
              'h-6 w-6',
              policy.enabled ? 'text-blue-400' : 'text-slate-500',
            )}
          />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{policy.name}</h1>
            <Badge
              className={
                policy.enabled
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-500/20 text-slate-400'
              }
            >
              {policy.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <p className="text-slate-400 mt-1">{policy.namespace}</p>
        </div>
      </div>

      {policy.description && (
        <Card>
          <CardContent>
            <p className="text-slate-300">{policy.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PolicyActionDetails action={policy.action} />
          </CardContent>
        </Card>

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
