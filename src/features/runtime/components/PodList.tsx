import { useState } from 'react';
import { Button, Modal, Alert } from '@/shared/components/ui';
import { useFetchRuntimeLogsQuery } from '../services/runtimeApi';
import { errorMessage } from '@/shared/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  EmptyState,
} from '@/shared/components/ui';
import type { RuntimePod } from '../types';

interface Props {
  pods: RuntimePod[];
}

// Provider-agnostic: Kubernetes pods and ECS tasks share this list.
function PodLogs({pod,onClose}:{pod:RuntimePod;onClose:()=>void}) {
 const logs = useFetchRuntimeLogsQuery({clusterId:pod.clusterId,namespace:pod.namespace,podName:pod.name,tail:100});
 return <Modal isOpen onClose={onClose} title={`Logs: ${pod.name}`} size="lg"><div className="space-y-3"><Button onClick={logs.refetch} disabled={logs.isFetching}>Refresh logs</Button>{logs.isError ? <Alert type="error" title="Unable to fetch logs">{errorMessage(logs.error)}</Alert> : logs.isLoading ? <p>Loading logs…</p> : <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs">{logs.data?.map((entry)=>`${entry.timestamp} ${entry.line}`).join('\n') || 'No log lines reported.'}</pre>}</div></Modal>;
}
export function PodList({ pods }: Props) {
 const [selected, setSelected] = useState<RuntimePod | null>(null);
  if (pods.length === 0) {
    return (
      <EmptyState
        title="No instances"
        description="No pods/tasks reported for this workload."
      />
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Instances / pods ({pods.length})</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead>Ready</TableHead>
              <TableHead>Restarts</TableHead>
              <TableHead>Node / host</TableHead><TableHead>Logs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pods.map((p) => (
              <TableRow key={`${p.namespace}/${p.name}`}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      p.phase === 'Running'
                        ? 'success'
                        : p.phase === 'Failed'
                          ? 'danger'
                          : 'default'
                    }
                  >
                    {p.phase}
                  </Badge>
                </TableCell>
                <TableCell>{p.ready ? 'Yes' : 'No'}</TableCell>
                <TableCell>{p.restarts}</TableCell>
                <TableCell className="text-slate-400">{p.node || '—'}</TableCell><TableCell><Button size="sm" onClick={()=>setSelected(p)} aria-label={`View logs for ${p.name}`}>View logs</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {selected && <PodLogs pod={selected} onClose={()=>setSelected(null)} />}
    </Card>
  );
}
