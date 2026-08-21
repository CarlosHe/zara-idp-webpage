import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui';
import { DataEmptyState, LoadingState } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { ROUTES } from '@/shared/config';
import { formatRelativeTime } from '@/shared/utils';
import { useListStacksQuery } from '../services/stacksApi';

export function StacksPage() {
  const { data, isLoading, isError, error, refetch } = useListStacksQuery({ limit: 50 });

  if (isLoading && !data) {
    return <LoadingState message="Loading infrastructure stacks..." />;
  }

  if (isError) {
    return (
      <DataEmptyState
        icon={<Layers className="h-6 w-6 text-slate-400" />}
        title="Failed to load stacks"
        description={errorMessage(error) || 'Unexpected error'}
        action={
          <Button type="button" size="sm" variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const items = data ?? [];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="stacks-page">
      <header>
        <h1 className="text-2xl font-semibold text-slate-50">Infrastructure stacks</h1>
        <p className="text-sm text-slate-400 mt-1">
          GitOps / Terraform stacks governed by Zara (foundation VPC, ALB, RDS, …).
        </p>
      </header>

      {items.length === 0 ? (
        <DataEmptyState
          icon={<Layers className="h-6 w-6 text-slate-400" />}
          title="No stacks"
          description="Create an InfrastructureStack via API or zaractl for foundation IaC."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stacks</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Env</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link
                        to={ROUTES.STACKS.DETAIL(s.id)}
                        className="font-medium text-blue-400 hover:text-blue-300"
                      >
                        {s.name}
                      </Link>
                      <div className="text-xs font-mono text-slate-500">{s.id}</div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">{s.namespace}</TableCell>
                    <TableCell className="text-sm">{s.environment ?? '—'}</TableCell>
                    <TableCell className="text-sm font-mono">{s.provider ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.status ?? 'unknown'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {s.updatedAt ? formatRelativeTime(s.updatedAt) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
