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

export function PodList({ pods }: Props) {
  if (pods.length === 0) {
    return <EmptyState title="No pods" description="No pods reported for this workload." />;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pods ({pods.length})</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead>Ready</TableHead>
              <TableHead>Restarts</TableHead>
              <TableHead>Node</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pods.map((p) => (
              <TableRow key={`${p.namespace}/${p.name}`}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  <Badge variant={p.phase === 'Running' ? 'success' : p.phase === 'Failed' ? 'danger' : 'default'}>
                    {p.phase}
                  </Badge>
                </TableCell>
                <TableCell>{p.ready ? 'Yes' : 'No'}</TableCell>
                <TableCell>{p.restarts}</TableCell>
                <TableCell className="text-slate-400">{p.node || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
