import { Link } from 'react-router-dom';
import { GitBranch } from 'lucide-react';
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
import { useListChangeSetsQuery } from '../services/changesetsApi';

export function ChangeSetsPage() {
  const { data, isLoading, isError, error, refetch } = useListChangeSetsQuery({
    limit: 50,
  });

  if (isLoading && !data) {
    return <LoadingState message="Loading change sets..." />;
  }

  if (isError) {
    return (
      <DataEmptyState
        icon={<GitBranch className="h-6 w-6 text-slate-400" />}
        title="Failed to load change sets"
        description={errorMessage(error) || 'Unexpected error'}
        action={
          <Button type="button" size="sm" variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const items = data?.changesets ?? [];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="changesets-page">
      <header>
        <h1 className="text-2xl font-semibold text-slate-50">ChangeSets</h1>
        <p className="text-sm text-slate-400 mt-1">
          Governed mutations with risk, approval, and audit trail.
          {data?.total != null ? ` · ${data.total} total` : null}
        </p>
      </header>

      {items.length === 0 ? (
        <DataEmptyState
          icon={<GitBranch className="h-6 w-6 text-slate-400" />}
          title="No change sets"
          description="Apply a manifest with zaractl or the API to create one."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((cs) => (
                  <TableRow key={cs.id}>
                    <TableCell>
                      <Link
                        to={ROUTES.CHANGESETS.DETAIL(cs.id)}
                        className="font-mono text-sm text-blue-400 hover:text-blue-300"
                      >
                        {cs.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{cs.approvalStatus ?? 'unknown'}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{cs.totalRisk ?? '—'}</TableCell>
                    <TableCell className="text-sm text-slate-400">{cs.source ?? '—'}</TableCell>
                    <TableCell className="text-sm">{cs.requestedBy ?? '—'}</TableCell>
                    <TableCell className="text-sm">{cs.changes?.length ?? 0}</TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {cs.updatedAt ? formatRelativeTime(String(cs.updatedAt)) : '—'}
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
