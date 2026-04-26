import { useMemo, useState } from 'react';
import { Puzzle } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import { DataEmptyState, LoadingState } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import {
  useListPluginsQuery,
  useListPluginSlotsQuery,
  useProbePluginHealthMutation,
  useUninstallPluginMutation,
} from '../services/pluginsApi';
import type { PluginHealthState, PluginRecord } from '../types/plugins';
import { PluginSlotHost } from './PluginSlotHost';

const HEALTH_BADGE: Record<PluginHealthState, { label: string; variant: 'success' | 'warning' | 'danger' | 'outline' }> = {
  healthy: { label: 'Healthy', variant: 'success' },
  degraded: { label: 'Degraded', variant: 'warning' },
  quarantined: { label: 'Quarantined', variant: 'danger' },
  unknown: { label: 'Not probed', variant: 'outline' },
};

export function PluginsPage() {
  const { data: plugins, isLoading: pluginsLoading, isError: pluginsError, error: pluginsErrObj } = useListPluginsQuery();
  const { data: slots } = useListPluginSlotsQuery();
  const [uninstallPlugin, { isLoading: uninstalling }] = useUninstallPluginMutation();
  const [probeHealth, { isLoading: probing }] = useProbePluginHealthMutation();
  const [activeSlotId, setActiveSlotId] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const orderedSlots = useMemo(() => slots ?? [], [slots]);
  const activeSlot = useMemo(
    () => orderedSlots.find((slot) => slot.id === activeSlotId) ?? orderedSlots[0],
    [activeSlotId, orderedSlots],
  );

  const handleUninstall = async (plugin: PluginRecord) => {
    try {
      const out = await uninstallPlugin(plugin.name).unwrap();
      setActionMessage(`Uninstall ChangeSet created (${out.changesetId})`);
    } catch (err) {
      setActionMessage(`Uninstall failed: ${errorMessage(err)}`);
    }
  };

  const handleProbe = async (plugin: PluginRecord) => {
    try {
      const snap = await probeHealth(plugin.name).unwrap();
      setActionMessage(`${plugin.name} is now ${snap.state}`);
    } catch (err) {
      setActionMessage(`Health probe failed: ${errorMessage(err)}`);
    }
  };

  return (
    <main className="space-y-6 p-6">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-primary-600">Extensibility</p>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Plugin Marketplace</h1>
        <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">
          Signed, sandboxed plugins extend Zara through gRPC providers, REST hooks, and Module Federation slots. Every install,
          upgrade, and uninstall flows through a ChangeSet — no direct mutation, no hidden risk.
        </p>
      </section>

      {actionMessage ? (
        <div role="status" className="rounded-lg border border-primary-300 bg-primary-50 px-4 py-2 text-sm text-primary-800 dark:border-primary-700/40 dark:bg-primary-900/20 dark:text-primary-200">
          {actionMessage}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Installed plugins</CardTitle>
          <CardDescription>
            Trust badges, health, runtime quotas, and lifecycle controls — backed by the plugin registry aggregate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pluginsLoading ? (
            <LoadingState message="Loading plugin marketplace..." />
          ) : pluginsError ? (
            <DataEmptyState
              icon={<Puzzle className="h-12 w-12 text-slate-400" aria-hidden="true" />}
              title="Plugin registry unavailable"
              description={errorMessage(pluginsErrObj)}
            />
          ) : !plugins || plugins.length === 0 ? (
            <DataEmptyState
              icon={<Puzzle className="h-12 w-12 text-slate-400" aria-hidden="true" />}
              title="No plugins installed"
              description="Install a signed plugin via zaractl to surface its slots in this registry."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {plugins.map((plugin) => (
                <article
                  key={plugin.name}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{plugin.displayName}</h3>
                    <Badge variant="outline">{plugin.runtime}</Badge>
                  </header>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {plugin.name} · v{plugin.version}
                    {plugin.vendor ? ` · ${plugin.vendor}` : ''}
                  </p>
                  {plugin.description ? (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{plugin.description}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant={HEALTH_BADGE[plugin.health.state].variant}>
                      {HEALTH_BADGE[plugin.health.state].label}
                    </Badge>
                    <Badge variant="info">CPU {plugin.resources.cpuMilli}m</Badge>
                    <Badge variant="info">Mem {plugin.resources.memoryMiB} MiB</Badge>
                    {plugin.canary ? (
                      <Badge variant="warning">
                        Canary {plugin.canary.fromVersion} → {plugin.canary.toVersion} ({plugin.canary.percentage}%)
                      </Badge>
                    ) : null}
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <dt className="font-semibold uppercase tracking-wide">Signed by</dt>
                    <dd className="break-all">{plugin.signing.signatureRef}</dd>
                    <dt className="font-semibold uppercase tracking-wide">SBOM</dt>
                    <dd className="break-all">{plugin.signing.sbomRef}</dd>
                    {plugin.health.lastError ? (
                      <>
                        <dt className="font-semibold uppercase tracking-wide">Last error</dt>
                        <dd className="break-all text-rose-600 dark:text-rose-400">{plugin.health.lastError}</dd>
                      </>
                    ) : null}
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleProbe(plugin)}
                      disabled={probing}
                    >
                      Probe health
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleUninstall(plugin)}
                      disabled={uninstalling}
                    >
                      Uninstall
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dynamic plugin tabs</CardTitle>
          <CardDescription>These slots come from the plugin registry manifest contract.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderedSlots.length === 0 ? (
            <DataEmptyState
              icon={<Puzzle className="h-12 w-12 text-slate-400" aria-hidden="true" />}
              title="No slots registered"
              description="Frontend plugins surface here once their manifest declares a Module Federation slot."
            />
          ) : (
            <>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Plugin slots">
                {orderedSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    role="tab"
                    aria-selected={slot.id === (activeSlot?.id ?? '')}
                    onClick={() => setActiveSlotId(slot.id)}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-500 hover:text-primary-700 aria-selected:border-primary-600 aria-selected:bg-primary-600 aria-selected:text-white dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary-400"
                  >
                    {slot.title}
                  </button>
                ))}
              </div>

              {activeSlot ? (
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge variant="info">{activeSlot.slot}</Badge>
                    <Badge variant="outline">{activeSlot.exposedModule}</Badge>
                  </div>
                  <PluginSlotHost slots={orderedSlots} activeSlotId={activeSlot.id} resourceRef="catalog/default/api" />
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
