import { Globe, Cpu, HardDrive } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/shared/components/ui';
import { cn } from '@/shared/utils';
import {
  formatRelativeTime,
  getProviderIcon,
  getStatusColor,
  getStatusIcon,
  getUsageBarColor,
} from './clusterPresentation';
import type { ClusterView } from '../types';

interface ClusterDetailPanelProps {
  cluster: ClusterView | null;
}

export function ClusterDetailPanel({ cluster }: ClusterDetailPanelProps) {
  if (!cluster) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Globe className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Select a cluster to view details</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getProviderIcon(cluster.provider)}
            {cluster.displayName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase">Provider</label>
              <p className="text-white mt-1">{cluster.provider.toUpperCase()}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase">Region</label>
              <p className="text-white mt-1">{cluster.region}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase">Version</label>
              <p className="text-white mt-1">{cluster.version}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase">Environment</label>
              <p className="text-white mt-1 capitalize">{cluster.environment}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase">Status</label>
            <div className="mt-1">
              <Badge className={getStatusColor(cluster.status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(cluster.status)}
                  {cluster.status}
                </span>
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase">Last Sync</label>
            <p className="text-white mt-1">{formatRelativeTime(cluster.lastSyncAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Resource Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-400" />
                CPU Usage
              </span>
              <span className="text-sm font-medium text-white">{cluster.cpu.used}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', getUsageBarColor(cluster.cpu.used))}
                style={{ width: `${cluster.cpu.used}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-purple-400" />
                Memory Usage
              </span>
              <span className="text-sm font-medium text-white">{cluster.memory.used}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  getUsageBarColor(cluster.memory.used),
                )}
                style={{ width: `${cluster.memory.used}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Nodes</span>
              <span className="text-white">{cluster.nodeCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-400">Resources</span>
              <span className="text-white">{cluster.resourceCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase">API Server</label>
            <p className="text-blue-400 text-sm mt-1 truncate">{cluster.endpoints.api}</p>
          </div>
          {cluster.endpoints.argocd && (
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase">ArgoCD</label>
              <p className="text-blue-400 text-sm mt-1 truncate">{cluster.endpoints.argocd}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
