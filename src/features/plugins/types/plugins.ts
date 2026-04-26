export type PluginSlotKind = 'catalog.tab' | 'resource.tab' | 'dashboard.card' | 'settings.panel';

export interface PluginSlot {
  id: string;
  pluginName: string;
  title: string;
  slot: PluginSlotKind;
  remoteEntry: string;
  exposedModule: string;
  route?: string;
}

export interface PluginSlotProps {
  pluginName: string;
  resourceRef?: string;
}

export type PluginStatus = 'installed' | 'uninstalled';

export type PluginHealthState = 'unknown' | 'healthy' | 'degraded' | 'quarantined';

export interface PluginHealth {
  state: PluginHealthState;
  consecutiveFailures: number;
  lastProbeAt?: string;
  lastError?: string;
}

export interface PluginCanary {
  fromVersion: string;
  toVersion: string;
  percentage: number;
  openedAt: string;
  openedBy: string;
  status: 'in_progress' | 'promoted' | 'rolled_back';
}

export interface PluginResourceQuota {
  cpuMilli: number;
  memoryMiB: number;
}

export interface PluginRecord {
  name: string;
  displayName: string;
  vendor?: string;
  description?: string;
  version: string;
  status: PluginStatus;
  health: PluginHealth;
  canary?: PluginCanary;
  runtime: string;
  resources: PluginResourceQuota;
  permissions: {
    scopes?: string[];
    outboundHosts?: string[];
    resources?: { kind: string; verbs: string[] }[];
  };
  signing: {
    digest: string;
    signatureRef: string;
    sbomRef: string;
  };
  frontend?: {
    slot: PluginSlotKind;
    remoteEntry: string;
    exposedModule: string;
    route?: string;
  };
  installedBy: string;
  installedAt: string;
  updatedAt: string;
}
