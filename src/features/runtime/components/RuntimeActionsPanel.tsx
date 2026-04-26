import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Alert,
  useToast,
} from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import {
  useProposeRuntimeRestartMutation,
  useProposeRuntimeScaleMutation,
  useProposeRuntimeRollbackMutation,
} from '../services/runtimeApi';
import type { RuntimeActionResponse, RuntimeWorkload } from '../types';

interface Props {
  workload: RuntimeWorkload;
}

// Every cluster mutation here POSTs to a runtime action endpoint that
// creates a ChangeSet. The UI never talks to the cluster directly —
// the panel surfaces the resulting `changeSetId` so the user can
// follow it through approval.
export function RuntimeActionsPanel({ workload }: Props) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [replicas, setReplicas] = useState<number>(workload.replicas.desired);
  const [revision, setRevision] = useState('');
  const [lastResponse, setLastResponse] = useState<RuntimeActionResponse | null>(null);

  const [restart, { isLoading: restarting }] = useProposeRuntimeRestartMutation();
  const [scale, { isLoading: scaling }] = useProposeRuntimeScaleMutation();
  const [rollback, { isLoading: rollingBack }] = useProposeRuntimeRollbackMutation();

  const baseRequest = {
    clusterId: workload.clusterId,
    namespace: workload.namespace,
    workload: workload.name,
    workloadKind: workload.kind,
    reason: reason.trim() || undefined,
  };

  function handleResponse(action: string, response: RuntimeActionResponse) {
    setLastResponse(response);
    toast.success(response.message, `${action} ChangeSet created`);
  }

  function handleError(action: string, err: unknown) {
    const message = errorMessage(err as Parameters<typeof errorMessage>[0]) ?? `${action} action failed`;
    toast.error(message, `${action} failed`);
  }

  async function onRestart() {
    try {
      const res = await restart(baseRequest).unwrap();
      handleResponse('Restart', res);
    } catch (err) {
      handleError('Restart', err);
    }
  }

  async function onScale() {
    try {
      const res = await scale({ ...baseRequest, replicas }).unwrap();
      handleResponse('Scale', res);
    } catch (err) {
      handleError('Scale', err);
    }
  }

  async function onRollback() {
    if (!revision.trim()) return;
    try {
      const res = await rollback({ ...baseRequest, targetRevision: revision.trim() }).unwrap();
      handleResponse('Rollback', res);
    } catch (err) {
      handleError('Rollback', err);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Governed actions</CardTitle>
        <CardDescription>
          Every action creates a ChangeSet. High-risk actions require approval before they execute.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="reason" className="text-xs uppercase tracking-wide text-slate-400">
            Reason (optional)
          </label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="memory leak, scaling for traffic, ..."
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={onRestart} disabled={restarting} variant="primary">
            {restarting ? 'Restarting…' : 'Restart workload'}
          </Button>
        </div>

        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="replicas" className="text-xs uppercase tracking-wide text-slate-400 block">
              Replicas
            </label>
            <Input
              id="replicas"
              type="number"
              min={0}
              value={replicas}
              onChange={(e) => setReplicas(Number(e.target.value))}
              className="w-24"
            />
          </div>
          <Button onClick={onScale} disabled={scaling || replicas < 0}>
            {scaling ? 'Scaling…' : 'Propose scale'}
          </Button>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="revision" className="text-xs uppercase tracking-wide text-slate-400 block">
              Rollback revision
            </label>
            <Input
              id="revision"
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              placeholder="e.g. 4"
            />
          </div>
          <Button onClick={onRollback} disabled={rollingBack || !revision.trim()} variant="danger">
            {rollingBack ? 'Submitting…' : 'Propose rollback'}
          </Button>
        </div>

        {lastResponse && (
          <Alert type={lastResponse.requiresApproval ? 'warning' : 'success'} title={lastResponse.message}>
            ChangeSet: {lastResponse.changeSetId}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
