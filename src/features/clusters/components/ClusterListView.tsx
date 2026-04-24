import { Globe } from 'lucide-react';
import { DataEmptyState } from '@/shared/components/feedback';
import { ClusterListItem } from './ClusterListItem';
import type { ClusterView } from '../types';

interface ClusterListViewProps {
  clusters: ClusterView[];
  selectedCluster: ClusterView | null;
  onSelect: (cluster: ClusterView) => void;
  onEdit: (cluster: ClusterView) => void;
  onDelete: (cluster: ClusterView) => void;
}

export function ClusterListView({
  clusters,
  selectedCluster,
  onSelect,
  onEdit,
  onDelete,
}: ClusterListViewProps) {
  if (clusters.length === 0) {
    return (
      <DataEmptyState
        icon={<Globe className="h-8 w-8 text-slate-500" />}
        title="No clusters found"
        description="No clusters match your current filters."
      />
    );
  }

  return (
    <>
      {clusters.map((cluster) => (
        <ClusterListItem
          key={cluster.id}
          cluster={cluster}
          isSelected={selectedCluster?.id === cluster.id}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}
