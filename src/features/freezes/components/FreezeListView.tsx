import { Snowflake } from 'lucide-react';
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
import type { Freeze } from '@/shared/types';
import { FreezeRow } from './FreezeRow';

interface FreezeListViewProps {
  activeFreezes: Freeze[];
  inactiveFreezes: Freeze[];
  loading: boolean;
}

export function FreezeListView({
  activeFreezes,
  inactiveFreezes,
  loading,
}: FreezeListViewProps) {
  return (
    <>
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
              icon={<Snowflake className="h-6 w-6 text-slate-400" />}
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
    </>
  );
}
