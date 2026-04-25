export interface PluginSlot {
  id: string;
  pluginName: string;
  title: string;
  slot: 'catalog.tab' | 'resource.tab' | 'dashboard.card' | 'settings.panel';
  remoteEntry: string;
  exposedModule: string;
  route?: string;
}

export interface PluginSlotProps {
  pluginName: string;
  resourceRef?: string;
}
