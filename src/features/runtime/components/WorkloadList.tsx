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
} from '@/shared/components/ui';
import { EmptyState } from '@/shared/components/ui';
import { healthVariant } from './healthBadge';
import type { RuntimeWorkload } from '../types';

interface Props {
  workloads: RuntimeWorkload[];
  selected: RuntimeWorkload | null;
  onSelect: (w: RuntimeWorkload) => void;
}

export function WorkloadList({ workloads, selected, onSelect }: Props) {
  if (workloads.length === 0) {
    return <EmptyState title="No workloads" description="No runtime workloads visible in this cluster yet." />;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workloads ({workloads.length})</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Namespace</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Replicas</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workloads.map((w) => {
              const isSelected = selected?.namespace === w.namespace && selected?.name === w.name;
              const ownerLink = w.catalog.find((l) => l.type === 'service' || l.type === 'ref');
              return (
                <TableRow
                  key={`${w.namespace}/${w.name}`}
                  data-selected={isSelected}
                  className={isSelected ? 'bg-slate-800/40' : 'cursor-pointer hover:bg-slate-800/30'}
                  onClick={() => onSelect(w)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(w);
                    }
                  }}
                  aria-label={`Select workload ${w.name}`}
                >
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell>{w.namespace}</TableCell>
                  <TableCell>{w.kind}</TableCell>
                  <TableCell>
                    {w.replicas.ready}/{w.replicas.desired}
                  </TableCell>
                  <TableCell>
                    <Badge variant={healthVariant(w.health)}>{w.health}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {ownerLink ? `${ownerLink.kind}/${ownerLink.name}` : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
