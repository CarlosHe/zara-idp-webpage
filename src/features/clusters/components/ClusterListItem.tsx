import {
  Server,
  Activity,
  Cpu,
  HardDrive,
  ChevronRight,
  Boxes,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, Badge } from '@/shared/components/ui';
import { cn } from '@/shared/utils';
import {
  formatRelativeTime,
  getEnvColor,
  getProviderIcon,
  getStatusColor,
  getStatusIcon,
  getUsageBarColor,
} from './clusterPresentation';
import type { ClusterView } from '../types';

interface ClusterListItemProps {
  cluster: ClusterView;
  isSelected: boolean;
  onSelect: (cluster: ClusterView) => void;
  onEdit: (cluster: ClusterView) => void;
  onDelete: (cluster: ClusterView) => void;
}

export function ClusterListItem({
  cluster,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: ClusterListItemProps) {
  return (
    <div className="relative" onClick={() => onSelect(cluster)}>
      <Card
        className={cn(
          'transition-all cursor-pointer hover:bg-slate-700/50',
          isSelected && 'ring-2 ring-cyan-500',
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getProviderIcon(cluster.provider)}
                <h3 className="font-semibold text-white">{cluster.displayName}</h3>
                <Badge className={getStatusColor(cluster.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(cluster.status)}
                    {cluster.status}
                  </span>
                </Badge>
                <Badge className={getEnvColor(cluster.environment)}>
                  {cluster.environment}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                <span>{cluster.provider.toUpperCase()}</span>
                <span>{cluster.region}</span>
                <span>{cluster.version}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Cpu className="h-3 w-3" /> CPU
                    </span>
                    <span className="text-slate-300">{cluster.cpu.used}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        getUsageBarColor(cluster.cpu.used),
                      )}
                      style={{ width: `${cluster.cpu.used}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <HardDrive className="h-3 w-3" /> Memory
                    </span>
                    <span className="text-slate-300">{cluster.memory.used}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        getUsageBarColor(cluster.memory.used),
                      )}
                      style={{ width: `${cluster.memory.used}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 ml-4">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Server className="h-3 w-3" />
                  {cluster.nodeCount} nodes
                </span>
                <span className="flex items-center gap-1">
                  <Boxes className="h-3 w-3" />
                  {cluster.resourceCount}
                </span>
              </div>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {formatRelativeTime(cluster.lastSyncAt)}
              </span>
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(cluster);
          }}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-600 transition-colors bg-slate-800/80"
          title="Edit cluster"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(cluster);
          }}
          className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors bg-slate-800/80"
          title="Delete cluster"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
