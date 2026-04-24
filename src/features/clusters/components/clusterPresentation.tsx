import {
  Server,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Cloud,
} from 'lucide-react';
import type { ClusterView } from '../types';

export function getStatusIcon(status: ClusterView['status']) {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case 'degraded':
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    case 'unhealthy':
      return <XCircle className="h-4 w-4 text-red-400" />;
    default:
      return <Activity className="h-4 w-4 text-slate-400" />;
  }
}

export function getStatusColor(status: ClusterView['status']) {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'degraded':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'unhealthy':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

export function getProviderIcon(provider: ClusterView['provider']) {
  switch (provider) {
    case 'aws':
      return <Cloud className="h-4 w-4 text-orange-400" />;
    case 'gcp':
      return <Cloud className="h-4 w-4 text-blue-400" />;
    case 'azure':
      return <Cloud className="h-4 w-4 text-cyan-400" />;
    default:
      return <Server className="h-4 w-4 text-slate-400" />;
  }
}

export function getEnvColor(env: ClusterView['environment']) {
  switch (env) {
    case 'production':
      return 'bg-red-500/20 text-red-400';
    case 'staging':
      return 'bg-amber-500/20 text-amber-400';
    default:
      return 'bg-blue-500/20 text-blue-400';
  }
}

export function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function getUsageBarColor(used: number) {
  if (used > 80) return 'bg-red-500';
  if (used > 60) return 'bg-amber-500';
  return 'bg-emerald-500';
}
