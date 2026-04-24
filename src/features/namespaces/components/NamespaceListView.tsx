import { FolderTree, Plus, Search } from 'lucide-react';
import { Button, Card, CardContent, Input } from '@/shared/components/ui';
import { DataEmptyState } from '@/shared/components/feedback';
import type { Namespace } from '@/shared/types';
import { NamespaceCard } from './NamespaceCard';

interface NamespaceListViewProps {
  namespaces: Namespace[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedTier: string;
  onSelectedTierChange: (value: string) => void;
  onCreate: () => void;
  onEdit: (namespace: Namespace) => void;
  onDelete: (namespace: Namespace) => void;
}

export function NamespaceListView({
  namespaces,
  searchQuery,
  onSearchQueryChange,
  selectedTier,
  onSelectedTierChange,
  onCreate,
  onEdit,
  onDelete,
}: NamespaceListViewProps) {
  return (
    <>
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search namespaces by name, team, or description..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedTier}
              onChange={(e) => onSelectedTierChange(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="all">All Tiers</option>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {namespaces.length === 0 ? (
        <DataEmptyState
          title="No namespaces found"
          description="Create your first namespace to get started with multi-tenancy"
          icon={<FolderTree className="h-12 w-12" />}
          action={
            <Button onClick={onCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Namespace
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {namespaces.map((ns) => (
            <NamespaceCard
              key={ns.id}
              namespace={ns}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}
