import { Shield } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '@/shared/components/ui';
import { DataEmptyState, LoadingState } from '@/shared/components/feedback';
import type { RuntimePolicy } from '@/shared/types';
import { PolicyRow } from './PolicyRow';

export interface PolicyListViewProps {
  enabledPolicies: RuntimePolicy[];
  disabledPolicies: RuntimePolicy[];
  loading: boolean;
}

export function PolicyListView({
  enabledPolicies,
  disabledPolicies,
  loading,
}: PolicyListViewProps) {
  return (
    <>
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
    </>
  );
}
