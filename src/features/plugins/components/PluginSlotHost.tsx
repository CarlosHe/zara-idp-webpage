import type { ComponentType } from 'react';
import type { PluginSlot, PluginSlotProps } from '../types/plugins';

interface PluginSlotHostProps {
  slots: PluginSlot[];
  activeSlotId: string;
  resourceRef?: string;
  fallback?: ComponentType<PluginSlotProps>;
}

function DefaultPluginFallback({ pluginName, resourceRef }: PluginSlotProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      <p className="font-semibold text-slate-900 dark:text-white">{pluginName}</p>
      <p>Remote module will be loaded by Module Federation for {resourceRef ?? 'this slot'}.</p>
    </div>
  );
}

export function PluginSlotHost({
  slots,
  activeSlotId,
  resourceRef,
  fallback: Fallback = DefaultPluginFallback,
}: PluginSlotHostProps) {
  const activeSlot = slots.find((slot) => slot.id === activeSlotId) ?? slots[0];
  if (!activeSlot) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        No plugin slots registered.
      </div>
    );
  }

  return <Fallback pluginName={activeSlot.pluginName} resourceRef={resourceRef} />;
}
