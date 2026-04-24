import { Link } from 'react-router-dom';
import { Box, Sparkles } from 'lucide-react';
import { ROUTES } from '@/shared/config';
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
  Button,
} from '@/shared/components/ui';
import { DataEmptyState, LoadingState } from '@/shared/components/feedback';
import type { Resource, ResourceKind } from '@/shared/types';
import { ResourceRow } from './ResourceRow';

interface ResourceListViewProps {
  items: Resource[];
  loading: boolean;
  kindFilter: ResourceKind | null;
  namespaceFilter: string | null;
  onDetectDrift: (resource: Resource) => void;
  onReconcile: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
}

export function ResourceListView({
  items,
  loading,
  kindFilter,
  namespaceFilter,
  onDetectDrift,
  onReconcile,
  onEdit,
  onDelete,
}: ResourceListViewProps) {
  const hasFilters = Boolean(kindFilter || namespaceFilter);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resources ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingState message="Loading resources..." iconClassName="text-purple-400" />
        ) : items.length === 0 ? (
          <DataEmptyState
            icon={<Box className="h-12 w-12 text-purple-400" />}
            title="No resources found"
            description={
              hasFilters
                ? 'Try adjusting your filters'
                : 'Create your first resource using Golden Paths'
            }
            action={
              !hasFilters ? (
                <Link to={ROUTES.GOLDEN_PATHS}>
                  <Button>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Go to Golden Paths
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kind</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((resource) => (
                  <ResourceRow
                    key={resource.id}
                    resource={resource}
                    onDetectDrift={onDetectDrift}
                    onReconcile={onReconcile}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
